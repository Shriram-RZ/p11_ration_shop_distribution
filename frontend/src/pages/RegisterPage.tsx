import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Wheat, Lock, Mail, User, Phone, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in your name, email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      })
      toast.success('Account created — welcome!')
      navigate('/shop')
    } catch (err) {
      const ax = err as AxiosError<{ detail: string }>
      setError(ax.response?.data?.detail ?? 'Registration failed. Please try again.')
    }
  }

  const inputCls =
    'w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors'

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-green-200/40 dark:bg-green-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-200/40 dark:bg-emerald-900/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/50 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 px-8 pt-10 pb-12 relative overflow-hidden">
            <div className="relative flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 shadow-lg">
                <Wheat size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Create your account</h1>
              <p className="text-green-200 text-sm mt-1">Shop ration commodities online</p>
            </div>
          </div>

          <div className="px-8 py-8 -mt-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm mb-5"
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputCls} />
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" className={inputCls} />
              </div>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={inputCls} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  autoComplete="new-password"
                  className={inputCls + ' pr-10'}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account…' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
