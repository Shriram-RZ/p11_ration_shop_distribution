import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, User, Shield, Moon, Sun, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Sun },
]

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

export default function Settings() {
  const { user, isDarkMode, toggleDarkMode } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name ?? '', email: user?.email ?? '', phone: '' })
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_password: '' })

  const changePwMutation = useMutation({
    mutationFn: (d: any) => authApi.changePassword(d),
    onSuccess: () => { toast.success('Password changed!'); setPassForm({ current_password: '', new_password: '', confirm_password: '' }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? 'Failed to change password'),
  })

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (passForm.new_password !== passForm.confirm_password) return toast.error('Passwords do not match')
    if (passForm.new_password.length < 8) return toast.error('Password must be at least 8 characters')
    changePwMutation.mutate({ current_password: passForm.current_password, new_password: passForm.new_password })
  }

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account and preferences</p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-lg shadow-card">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Profile Information</h3>
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
              {(user?.full_name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.full_name ?? user?.name ?? '—'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <p className="text-xs text-green-600 dark:text-green-400 capitalize mt-0.5">{(user?.role as string)?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); toast.success('Profile saved (demo)') }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </div>
            <button type="submit" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Save className="w-4 h-4" /> Save Profile
            </button>
          </form>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-lg shadow-card">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password *</label>
              <input required type="password" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={passForm.current_password} onChange={e => setPassForm(f => ({ ...f, current_password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password *</label>
              <input required type="password" minLength={8} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={passForm.new_password} onChange={e => setPassForm(f => ({ ...f, new_password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password *</label>
              <input required type="password" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" value={passForm.confirm_password} onChange={e => setPassForm(f => ({ ...f, confirm_password: e.target.value }))} />
            </div>
            <button type="submit" disabled={changePwMutation.isPending} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
              <Shield className="w-4 h-4" /> {changePwMutation.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-lg shadow-card">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Appearance</h3>
          <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">Dark Mode</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark theme</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform flex items-center justify-center ${isDarkMode ? 'translate-x-6' : ''}`}>
                {isDarkMode ? <Moon className="w-2.5 h-2.5 text-slate-700" /> : <Sun className="w-2.5 h-2.5 text-amber-500" />}
              </div>
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {['Light', 'Dark'].map(theme => (
              <button
                key={theme}
                onClick={() => { if ((theme === 'Dark') !== isDarkMode) toggleDarkMode() }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  (theme === 'Dark') === isDarkMode
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className={`w-full h-12 rounded-lg mb-2 ${theme === 'Dark' ? 'bg-slate-800' : 'bg-white border border-slate-200'}`} />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{theme}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
