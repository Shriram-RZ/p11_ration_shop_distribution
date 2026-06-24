import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CreditCard, Users, MapPin, Fingerprint } from 'lucide-react'
import { storeApi } from '@/services/api'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatNumber } from '@/lib/utils'

const ICONS: Record<string, string> = {
  Rice: '🍚', Wheat: '🌾', Sugar: '🧂', 'Edible Oil': '🛢️', Kerosene: '⛽',
}

export default function MyCard() {
  const { data: card, isLoading } = useQuery({
    queryKey: ['my-card'],
    queryFn: storeApi.getMyCard,
  })

  if (isLoading) {
    return <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
  }
  if (!card) {
    return <div className="text-center py-16 text-slate-400">No ration card linked to your account.</div>
  }

  return (
    <div className="space-y-6">
      {/* Card profile */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-white bg-gradient-to-br from-green-600 to-emerald-700 shadow-lg"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-green-100 text-xs uppercase tracking-wide">Smart Ration Card</p>
            <p className="text-2xl font-bold mt-1 flex items-center gap-2">
              <CreditCard size={22} /> {card.card_number}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur">
            {card.category}
          </span>
        </div>

        <p className="mt-4 text-lg font-semibold">{card.family_name}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-green-50">
          <span className="flex items-center gap-1.5"><Fingerprint size={14} /> {card.aadhaar_number}</span>
          <span className="flex items-center gap-1.5"><Users size={14} /> {card.family_members} members</span>
          <span className="flex items-center gap-1.5"><MapPin size={14} /> {card.district}, {card.state}</span>
          <span className="capitalize">Status: {card.status}</span>
        </div>
      </motion.div>

      {/* Quota */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Monthly Quota</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Remaining allocation for this month.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {card.quota.map((q) => (
            <div
              key={q.commodity_id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="text-xl">{ICONS[q.name] ?? '📦'}</span> {q.name}
                </span>
                <span className="text-sm font-bold text-green-600">
                  {formatNumber(q.remaining)} {q.unit} left
                </span>
              </div>
              <ProgressBar value={q.remaining} max={q.allocated || 1} size="lg" />
              <p className="mt-2 text-xs text-slate-400">
                {formatNumber(q.used)} / {formatNumber(q.allocated)} {q.unit} used this month
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
