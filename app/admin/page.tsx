'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Play, Square, Coffee, MapPin, CheckCircle, AlertTriangle, LogOut } from 'lucide-react'

export default function WorkerPanel() {
  const [loading, setLoading] = useState(false)
  const [activeLog, setActiveLog] = useState<any>(null)
  const [isOnBreak, setIsOnBreak] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [isErrorMessage, setIsErrorMessage] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchActiveLogAndProjects()
  }, [])

  const fetchActiveLogAndProjects = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: projData } = await supabase.from('projects').select('*')
    if (projData && projData.length > 0) {
      setProjects(projData)
      setSelectedProject(projData[0].id)
    }

    const { data: logData } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .maybeSingle()

    if (logData) {
      setActiveLog(logData)
      setSelectedProject(logData.project_id)
      if (logData.break_start_time && !logData.break_end_time) {
        setIsOnBreak(true)
      }
    }
  }

  const getGpsPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolokalizacja nie jest wspierana przez przeglądarkę.'))
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      }
    })
  }

  const handleStartWork = async () => {
    if (!selectedProject) {
      setMessage('Wybierz budowę przed rozpoczęciem pracy!', true)
      return
    }

    setLoading(true)
    setMessage('Pobieranie pozycji GPS...', false)

    try {
      const pos = await getGpsPosition()
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: isOutside } = await supabase.rpc('is_point_outside_geofence', {
        p_lat: lat,
        p_lng: lng,
        proj_id: selectedProject,
      })

      const { data, error } = await supabase
        .from('time_logs')
        .insert({
          user_id: user.id,
          project_id: selectedProject,
          start_latitude: lat,
          start_longitude: lng,
          is_start_outside_geofence: isOutside || false,
        })
        .select()
        .single()

      if (error) throw error

      setActiveLog(data)
      setMessage('Pomyślnie rozpoczęto pracę!', false)
    } catch (err: any) {
      setMessage('Błąd GPS: ' + (err.message || 'Nie udało się pobrać lokalizacji.'), true)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBreak = async () => {
    if (!activeLog) return
    setLoading(true)

    try {
      if (!isOnBreak) {
        const { error } = await supabase
          .from('time_logs')
          .update({ break_start_time: new Date().toISOString() })
          .eq('id', activeLog.id)

        if (error) throw error
        setIsOnBreak(true)
        setMessage('Rozpoczęto przerwę.', false)
      } else {
        const breakEndTime = new Date().toISOString()
        const { error } = await supabase
          .from('time_logs')
          .update({ break_end_time: breakEndTime })
          .eq('id', activeLog.id)

        if (error) throw error
        setIsOnBreak(false)
        setMessage('Zakończono przerwę. Cichy stoper GPS aktywny na 10 min.', false)

        setTimeout(() => {
          verifyGpsPostBreak(activeLog.id)
        }, 600000)
      }
    } catch (err: any) {
      setMessage('Błąd: ' + err.message, true)
    } finally {
      setLoading(false)
    }
  }

  const verifyGpsPostBreak = async (logId: string) => {
    try {
      const pos = await getGpsPosition()
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude

      const { data: isOutside } = await supabase.rpc('is_point_outside_geofence', {
        p_lat: lat,
        p_lng: lng,
        proj_id: selectedProject,
      })

      await supabase
        .from('time_logs')
        .update({
          post_break_gps_lat: lat,
          post_break_gps_lng: lng,
          is_outside_after_break: isOutside || false,
        })
        .eq('id', logId)
    } catch (err) {
      console.log('Cichy pobór GPS nieudany:', err)
    }
  }

  const handleStopWork = async () => {
    if (!activeLog) return
    setLoading(true)
    setMessage('Pobieranie pozycji GPS...', false)

    try {
      const pos = await getGpsPosition()
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude

      const { data: isOutside } = await supabase.rpc('is_point_outside_geofence', {
        p_lat: lat,
        p_lng: lng,
        proj_id: selectedProject,
      })

      const endTime = new Date()
      const startTime = new Date(activeLog.start_time)
      let diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

      if (activeLog.break_start_time && activeLog.break_end_time) {
        const bStart = new Date(activeLog.break_start_time)
        const bEnd = new Date(activeLog.break_end_time)
        const bHours = (bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60)
        diffHours = Math.max(0, diffHours - bHours)
      }

      const { error } = await supabase
        .from('time_logs')
        .update({
          end_time: endTime.toISOString(),
          end_latitude: lat,
          end_longitude: lng,
          is_end_outside_geofence: isOutside || false,
          calculated_hours: Number(diffHours.toFixed(2)),
        })
        .eq('id', activeLog.id)

      if (error) throw error

      setActiveLog(null)
      setIsOnBreak(false)
      setMessage('Praca zakończona i zapisana!', false)
    } catch (err: any) {
      setMessage('Błąd GPS przy kończeniu pracy: ' + err.message, true)
    } finally {
      setLoading(false)
    }
  }

  const setMessage = (msg: string, isErr: boolean) => {
    setStatusMessage(msg)
    setIsErrorMessage(isErr)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 max-w-md mx-auto flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6 pt-2">
          <div>
            <h1 className="text-xl font-bold">Panel Elektryka</h1>
            <p className="text-xs text-slate-400">System Rejestracji Czasu & GPS</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300"
            title="Wyloguj"
          >
            <LogOut size={20} />
          </button>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-sm mb-6 flex items-center gap-2 ${
              isErrorMessage
                ? 'bg-red-500/20 border border-red-500 text-red-300'
                : 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
            }`}
          >
            {isErrorMessage ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span>{statusMessage}</span>
          </div>
        )}

        {!activeLog && (
          <div className="mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
              Wybierz Budowę na dzisiaj:
            </label>
            {projects.length > 0 ? (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-white font-medium focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-amber-400">
                Brak aktywnych budów. Dodaj budowę w Panelu Admina.
              </p>
            )}
          </div>
        )}

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center shadow-2xl">
          {!activeLog ? (
            <div>
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <MapPin size={36} />
              </div>
              <p className="text-slate-300 text-sm mb-6">Gotowy do rozpoczęcia dnia pracy?</p>
              <button
                onClick={handleStartWork}
                disabled={loading || projects.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl shadow-lg transition-all text-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <Play fill="currentColor" size={24} />
                ROZPOCZNIJ PRACĘ
              </button>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                PRACA W TRAKCIE
              </div>

              <div className="text-xs text-slate-400 mb-6">
                Rozpoczęto o:{' '}
                <span className="text-white font-mono font-bold">
                  {new Date(activeLog.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleToggleBreak}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isOnBreak
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse'
                      : 'bg-slate-700 hover:bg-slate-600 text-amber-400 border border-slate-600'
                  }`}
                >
                  <Coffee size={20} />
                  {isOnBreak ? 'KONIEC PRZERWY' : 'ROZPOCZNIJ PRZERWĘ'}
                </button>

                <button
                  onClick={handleStopWork}
                  disabled={loading}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  <Square fill="currentColor" size={20} />
                  ZAKOŃCZ PRACĘ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-slate-500 text-xs mt-6">
        Lokalizacja GPS jest pobierana wyłącznie podczas kliknięcia przycisków.
      </div>
    </div>
  )
}