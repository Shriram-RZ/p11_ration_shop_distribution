import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wheat, ShoppingCart, BarChart3, Package, Truck, ShieldCheck,
  Bell, ArrowRight, Check, Store, Users, Boxes,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const features = [
  { icon: BarChart3, title: 'Live Analytics', desc: 'Real-time stock dashboards, distribution trends and low-stock alerts at a glance.' },
  { icon: Package, title: 'Stock Management', desc: 'Track rice, wheat, sugar, oil & more across warehouses with full audit trails.' },
  { icon: ShoppingCart, title: 'Online Storefront', desc: 'Citizens browse commodities, add to cart and order online in a few taps.' },
  { icon: Truck, title: 'Distribution', desc: 'Streamlined monthly distribution workflow with verification and history.' },
  { icon: Bell, title: 'Smart Notifications', desc: 'Automatic low-stock and distribution reminders so nothing slips through.' },
  { icon: ShieldCheck, title: 'Secure & Audited', desc: 'JWT auth, role-based access and an audit log for every sensitive action.' },
]

const steps = [
  { icon: Users, title: 'Create an account', desc: 'Sign up in seconds as a customer to start shopping ration commodities.' },
  { icon: Store, title: 'Browse & order', desc: 'Explore live stock, add items to your cart and place your order online.' },
  { icon: Boxes, title: 'Track everything', desc: 'Follow your orders while staff manage stock and distribution behind the scenes.' },
]

const stats = [
  { value: '5+', label: 'Commodities' },
  { value: '24/7', label: 'Availability' },
  { value: '100%', label: 'Transparent' },
  { value: 'Real-time', label: 'Stock data' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const home = user?.role === 'customer' ? '/shop' : '/dashboard'

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Wheat size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">RationFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-green-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-green-600 transition-colors">How it works</a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button onClick={() => navigate(home)} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
                Go to app
              </button>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-green-500/20">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative">
        {/* animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[34rem] h-[34rem] rounded-full bg-green-300/30 dark:bg-green-800/20 blur-3xl" />
          <div className="absolute top-40 -left-32 w-[30rem] h-[30rem] rounded-full bg-emerald-300/30 dark:bg-emerald-800/20 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Digital Public Distribution System
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Ration distribution,{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                modernised.
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-500 dark:text-slate-400 max-w-md">
              Shop essential commodities online and let government centers monitor stock,
              distribution and beneficiaries — all in one transparent platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={isAuthenticated ? home : '/register'}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg shadow-green-500/25 transition-all"
              >
                {isAuthenticated ? 'Open app' : 'Start shopping'}
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold transition-colors"
              >
                Staff login
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-5 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Check size={16} className="text-green-600" /> Free to use</span>
              <span className="flex items-center gap-1.5"><Check size={16} className="text-green-600" /> No paperwork</span>
            </div>
          </motion.div>

          {/* floating preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-300/40 dark:shadow-black/40 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-slate-400">Available stock</p>
                  <p className="font-bold text-lg">Today's Catalog</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                  <Store size={18} className="text-green-600" />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { e: '🍚', n: 'Rice', p: '₹15/kg', q: '10,100 kg' },
                  { e: '🌾', n: 'Wheat', p: '₹12/kg', q: '4,000 kg' },
                  { e: '🛢️', n: 'Edible Oil', p: '₹120/L', q: '601 L' },
                  { e: '🧂', n: 'Sugar', p: '₹35/kg', q: '800 kg' },
                ].map((it, i) => (
                  <motion.div
                    key={it.n}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60"
                  >
                    <span className="text-2xl">{it.e}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{it.n}</p>
                      <p className="text-xs text-slate-400">{it.q} in stock</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{it.p}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
                <ShoppingCart size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Order placed</p>
                <p className="text-sm font-bold">₹150 · Confirmed</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* stats strip */}
        <div className="relative max-w-6xl mx-auto px-5 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center rounded-2xl border border-slate-200 dark:border-slate-800 py-5"
              >
                <p className="text-2xl font-extrabold text-green-600">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything in one platform</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              A complete ecosystem connecting citizens, fair price shops and government distribution centers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 mb-4 group-hover:scale-110 transition-transform">
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how" className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Get started in three steps</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">From sign-up to your first order in minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-slate-200 dark:border-slate-800 p-7"
              >
                <span className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                  {i + 1}
                </span>
                <s.icon size={28} className="text-green-600 mb-4" />
                <h3 className="font-bold text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 to-emerald-700 px-8 py-14 text-center shadow-2xl shadow-green-500/20">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to get your essentials?</h2>
              <p className="mt-3 text-green-100 max-w-xl mx-auto">
                Join RationFlow and start ordering ration commodities online today.
              </p>
              <Link
                to={isAuthenticated ? home : '/register'}
                className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-green-700 font-bold hover:bg-green-50 transition-colors shadow-lg"
              >
                {isAuthenticated ? 'Open app' : 'Create free account'}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <Wheat size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-600 dark:text-slate-300">RationFlow</span>
          </div>
          <p>© {new Date().getFullYear()} RationFlow — Streamlining ration distribution across India.</p>
        </div>
      </footer>
    </div>
  )
}
