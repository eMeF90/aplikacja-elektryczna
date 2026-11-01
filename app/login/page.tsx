'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg('Błędny e-mail lub hasło: ' + error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Pobranie roli użytkownika z tabeli profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = profile?.role || 'worker'

      // Przekierowanie do odpowiedniego panelu w zależności od roli
      if (role === 'admin') {
        router.push('/admin')
      } else if (role === 'foreman') {
        router.push('/foreman')
      } else {
        router.push('/worker')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-2">Aplikacja Elektryczna</h1>
        <p className="text-slate-400 text-center text-sm mb-6">Zaloguj się do swojego panelu</p>

        {errorMsg && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              placeholder="np. jan.kowalski@firma.pl"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Hasło</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 font-bold p-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Logowanie...' : 'ZALOGUJ SIĘ'}
          </button>
        </form>
      </div>
    </div>
  )
}