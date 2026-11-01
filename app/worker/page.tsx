'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Play,
  Square,
  Clock,
  ClipboardList,
  Camera,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Folder,
  X,
  Eye,
  Coffee,
  CheckCircle2,
  ExternalLink,
  Download,
  Palmtree,
  HeartPulse,
  UserCheck,
} from 'lucide-react'

const MONTH_NAMES = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
]

export default function WorkerPanel() {
  const router = useRouter()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'timer' | 'tasks' | 'photos' | 'stats' | 'settings'>('timer')
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  const [userProfile, setUserProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const [activeLog, setActiveLog] = useState<any>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false)
  const [breakSeconds, setBreakSeconds] = useState<number>(0)
  const [claimDiet, setClaimDiet] = useState<boolean>(false)

  const [showVacationModal, setShowVacationModal] = useState<boolean>(false)
  const [leaveType, setLeaveType] = useState<'UW' | 'L4'>('UW')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [leaveReason, setLeaveReason] = useState<string>('')

  const [tasks, setTasks] = useState<any[]>([])
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [taskPhotoFiles, setTaskPhotoFiles] = useState<{ [taskId: string]: File[] }>({})
  const [previewFile, setPreviewFile] = useState<{ title: string; url: string } | null>(null)

  const [workerPhotos, setWorkerPhotos] = useState<any[]>([])

  const [historicalLogs, setHistoricalLogs] = useState<any[]>([])
  const [vacationRequests, setVacationRequests] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    initWorker()
  }, [])

  useEffect(() => {
    if (selectedProject && userProfile) {
      fetchTasksAndData(selectedProject, userProfile.id)
    }
  }, [selectedProject, userProfile])

  useEffect(() => {
    let interval: any = null
    if (activeLog && !activeLog.end_time) {
      interval = setInterval(() => {
        const start = new Date(activeLog.start_time).getTime()
        const now = new Date().getTime()
        const diffInSec = Math.floor((now - start) / 1000)

        if (isOnBreak) {
          setBreakSeconds((prev) => prev + 1)
        } else {
          setElapsedSeconds(diffInSec > 0 ? diffInSec - breakSeconds : 0)
        }
      }, 1000)
    } else {
      setElapsedSeconds(0)
    }
    return () => clearInterval(interval)
  }, [activeLog, isOnBreak, breakSeconds])

const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = touchEndX.current - touchStartX.current

    // Reaguj TYLKO na swipe od lewej krawędzi (pierwsze 40px)
    if (touchStartX.current < 40 && diffX > 50) {
      e.preventDefault()
      setIsSidebarOpen(true)
    } else if (isSidebarOpen && diffX < -50) {
      e.preventDefault()
      setIsSidebarOpen(false)
    }

    // Resetuj punkty dotyku
    touchStartX.current = 0
    touchEndX.current = 0
  }
  const initWorker = async () => {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) setUserProfile(profile)

      const { data: projData } = await supabase.from('projects').select('*')
      if (projData && projData.length > 0) {
        setProjects(projData)
        setSelectedProject(projData[0].id)
        if (profile) {
          fetchTasksAndData(projData[0].id, profile.id)
        }
      }
    } catch (err: any) {
      console.error('Błąd inicjalizacji pracownika:', err)
    }
  }

  const fetchTasksAndData = async (projId: string, userId: string) => {
    try {
      const { data: openLog } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', userId)
        .is('end_time', null)
        .maybeSingle()

      setActiveLog(openLog || null)

      const { data: history } = await supabase
        .from('time_logs')
        .select('*, projects(title)')
        .eq('user_id', userId)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: true })

      if (history) setHistoricalLogs(history)

      const { data: vacations } = await supabase
        .from('vacation_requests')
        .select('*')
        .eq('user_id', userId)

      if (vacations) setVacationRequests(vacations)

      const { data: taskData } = await supabase
        .from('tasks')
        .select('*, task_assignments(user_id, profiles(full_name)), project_photos(*)')
        .eq('project_id', projId)
        .order('created_at', { ascending: false })

      if (taskData) setTasks(taskData)

      const { data: photoData } = await supabase
        .from('project_photos')
        .select('*, tasks(title)')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })

      if (photoData) setWorkerPhotos(photoData)
    } catch (err: any) {
      console.error('Błąd pobierania danych pracownika:', err)
    }
  }

  const handleToggleWorkLog = async () => {
    if (!selectedProject || !userProfile) {
      alert('Nie wybrano budowy lub brak profilu użytkownika!')
      return
    }
    setLoading(true)

    try {
      if (!activeLog) {
        const startTimeISO = new Date().toISOString()
        const { data: newLog, error } = await supabase
          .from('time_logs')
          .insert({
            user_id: userProfile.id,
            project_id: selectedProject,
            start_time: startTimeISO,
            is_delegation: claimDiet,
            allowance_amount: claimDiet ? 45 : 0,
          })
          .select()
          .single()

        if (error) {
          alert('Błąd dodawania wpisu czasu: ' + error.message)
        } else if (newLog) {
          setActiveLog(newLog)
          setBreakSeconds(0)
          setIsOnBreak(false)
        }
      } else {
        const endTimeISO = new Date().toISOString()
        const { error } = await supabase
          .from('time_logs')
          .update({ end_time: endTimeISO })
          .eq('id', activeLog.id)

        if (error) {
          alert('Błąd zatrzymywania pracy: ' + error.message)
        } else {
          setActiveLog(null)
          setIsOnBreak(false)
          setBreakSeconds(0)
          fetchTasksAndData(selectedProject, userProfile.id)
        }
      }
    } catch (err: any) {
      alert('Wystąpił błąd podczas rejestracji czasu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitLeaveRequest = async () => {
    if (!startDate || !endDate || !userProfile) {
      alert('Proszę uzupełnić datę rozpoczęcia i zakończenia!')
      return
    }
    setLoading(true)

    try {
      const { error } = await supabase.from('vacation_requests').insert({
        user_id: userProfile.id,
        type: leaveType,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        reason: leaveReason,
      })

      if (!error) {
        alert(`Pomyślnie wysłano wniosek o ${leaveType}! Oczekuje na akceptację Administratora.`)
        setShowVacationModal(false)
        setStartDate('')
        setEndDate('')
        setLeaveReason('')
        fetchTasksAndData(selectedProject, userProfile.id)
      } else {
        alert('Błąd wysyłania wniosku: ' + error.message)
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBreak = () => {
    setIsOnBreak(!isOnBreak)
  }

  const handleClaimTask = async (taskId: string) => {
    if (!userProfile) return
    setLoading(true)

    try {
      // Przypisanie pracownika do zadania
      const { error: assignErr } = await supabase.from('task_assignments').insert({
        task_id: taskId,
        user_id: userProfile.id,
      })

      if (assignErr) {
        alert('Błąd przypisywania do zadania: ' + assignErr.message)
      } else {
        // Zmiana statusu zadania na "W trakcie"
        await supabase
          .from('tasks')
          .update({ status: 'in_progress' })
          .eq('id', taskId)

        alert('Pomyślnie podjęto się zadania!')
        fetchTasksAndData(selectedProject, userProfile.id)
      }
    } catch (err: any) {
      alert('Wystąpił błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskFileSelect = (taskId: string, files: FileList | null) => {
    if (!files) return
    const selectedFiles = Array.from(files)
    setTaskPhotoFiles((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), ...selectedFiles],
    }))
  }

  const handleRemoveTaskFile = (taskId: string, fileIndex: number) => {
    setTaskPhotoFiles((prev) => ({
      ...prev,
      [taskId]: prev[taskId].filter((_, idx) => idx !== fileIndex),
    }))
  }

  const handleSubmitTaskCompletion = async (taskId: string) => {
    if (!selectedProject || !userProfile) return
    setLoading(true)

    try {
      const filesToUpload = taskPhotoFiles[taskId] || []

      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop()
        const fileName = `worker-task-photos/${selectedProject}/${taskId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`

        const { error: uploadErr } = await supabase.storage
          .from('project-photos')
          .upload(fileName, file)

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('project-photos')
            .getPublicUrl(fileName)

          const photoUrl = publicUrlData?.publicUrl || ''

          await supabase.from('project_photos').insert({
            project_id: selectedProject,
            task_id: taskId,
            uploaded_by: userProfile.id,
            photo_type: 'task_completion',
            photo_url: photoUrl,
            description: `Wykonano zadanie przez ${userProfile.full_name}`,
          })
        }
      }

      const { error: updateErr } = await supabase
        .from('tasks')
        .update({ status: 'pending_approval' })
        .eq('id', taskId)

      if (!updateErr) {
        alert('Zgłoszono wykonanie zadania do Brygadzisty!')
        setTaskPhotoFiles((prev) => ({ ...prev, [taskId]: [] }))
        fetchTasksAndData(selectedProject, userProfile.id)
      } else {
        alert('Błąd aktualizacji zadania: ' + updateErr.message)
      }
    } catch (err: any) {
      alert('Wystąpił błąd podczas wysyłania: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatSeconds = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getPolishTaskStatus = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Czeka na akceptację'
      case 'completed':
        return 'Zakończone'
      case 'in_progress':
        return 'W trakcie'
      case 'todo':
      case 'pending':
      default:
        return 'Do zrobienia'
    }
  }

  const getFileNameFromUrl = (url: string) => {
    try {
      const decoded = decodeURIComponent(url)
      const parts = decoded.split('/')
      const lastPart = parts[parts.length - 1]
      return lastPart.split('?')[0] || 'Załącznik budowy'
    } catch {
      return 'Załącznik budowy'
    }
  }

  const groupedWorkerPhotos = workerPhotos.reduce((acc: any, photo: any) => {
    const folderName = photo.tasks?.title || 'Zdjęcia Ogólne / Budowa'
    if (!acc[folderName]) acc[folderName] = []
    acc[folderName].push(photo)
    return acc
  }, {})

  const calculateRoundedHours = (startTimeStr: string, endTimeStr: string) => {
    const start = new Date(startTimeStr)
    const end = new Date(endTimeStr)

    let startHour = start.getHours()
    let startMin = start.getMinutes()
    let endHour = end.getHours()
    let endMin = end.getMinutes()

    if (startMin > 0 && startMin <= 35) {
      startHour = startHour
    }
    if (endMin >= 30) {
      endHour = endHour + 1
    }

    const diff = endHour - startHour
    return diff > 0 ? diff : Number(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1))
  }

  const generateMonthDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    const daysArray = []
    const polishDays = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth - 1, day)
      const dayOfWeekIndex = currentDate.getDay()
      const dayOfWeekStr = polishDays[dayOfWeekIndex]
      const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6

      const dayLog = historicalLogs.find((l) => {
        const d = new Date(l.start_time)
        return d.getDate() === day && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
      })

      const dayVacation = vacationRequests.find((v) => {
        const vStart = new Date(v.start_date)
        const vEnd = new Date(v.end_date)
        vStart.setHours(0, 0, 0, 0)
        vEnd.setHours(23, 59, 59, 999)
        return currentDate >= vStart && currentDate <= vEnd
      })

      let calculatedHours = 0
      let startFormatted = '-'
      let endFormatted = '-'

      if (dayLog) {
        const st = new Date(dayLog.start_time)
        startFormatted = st.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        if (dayLog.end_time) {
          calculatedHours = calculateRoundedHours(dayLog.start_time, dayLog.end_time)
          const et = new Date(dayLog.end_time)
          endFormatted = et.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else {
          endFormatted = 'W trakcie...'
        }
      }

      daysArray.push({
        dateStr: currentDate.toLocaleDateString('pl-PL'),
        dayOfWeek: dayOfWeekStr,
        isWeekend,
        projectName: dayLog?.projects?.title || (dayVacation ? `Wniosek (${dayVacation.type})` : '-'),
        startTime: startFormatted,
        endTime: endFormatted,
        hours: calculatedHours,
        allowance: dayLog?.is_delegation ? '45 zł' : '-',
        advance: dayLog?.advance_payment ? `${dayLog.advance_payment} zł` : '-',
        uw: dayVacation?.type === 'UW' ? '1' : '-',
        l4: dayVacation?.type === 'L4' ? '1' : '-',
        remarks: dayVacation?.reason || dayLog?.remarks || '-',
        vacationStatus: dayVacation?.status || null,
      })
    }
    return daysArray
  }

  const monthData = generateMonthDays()
  const totalMonthHours = monthData.reduce((sum, d) => sum + d.hours, 0)
  const totalUW = monthData.filter((d) => d.uw === '1').length
  const totalL4 = monthData.filter((d) => d.l4 === '1').length

  const hourlyRate = userProfile?.hourly_rate || 35.0
  const estimatedPayout = totalMonthHours * hourlyRate

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehaviorX: 'none', touchAction: 'pan-y' }}
      className="min-h-screen bg-slate-950 text-white w-full relative flex flex-col justify-between overflow-x-hidden font-sans"
    >
      {/* Subtelny niebieski pasek wskaźnika nawigacji na lewej krawędzi */}
      <div
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-0 left-0 bottom-0 w-2 z-40 bg-blue-500/30 hover:bg-blue-500/60 transition-all cursor-pointer"
        title="Przesuń w prawo, aby otworzyć panel"
      />

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Panel Pracownika</h2>
              <p className="text-xs text-blue-400 font-medium">{userProfile?.full_name || 'Pracownik'}</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveSection('timer')
                setIsSidebarOpen(false)
              }}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                activeSection === 'timer'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock size={18} /> 1. Licznik Pracy
            </button>

            <button
              onClick={() => {
                setActiveSection('tasks')
                setIsSidebarOpen(false)
              }}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                activeSection === 'tasks'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList size={18} /> 2. Zadania
            </button>

            <button
              onClick={() => {
                setActiveSection('photos')
                setIsSidebarOpen(false)
              }}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                activeSection === 'photos'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ImageIcon size={18} /> 3. Dodane Zdjęcia
            </button>

            <button
              onClick={() => {
                setActiveSection('stats')
                setIsSidebarOpen(false)
              }}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                activeSection === 'stats'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 size={18} /> 4. Statystyki & Ewidencja
            </button>
          </nav>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              setActiveSection('settings')
              setIsSidebarOpen(false)
            }}
            className="w-full p-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-all"
          >
            <Settings size={18} /> Ustawienia
          </button>
          <button
            onClick={handleLogout}
            className="w-full p-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 flex items-center gap-3 transition-all"
          >
            <LogOut size={18} /> Wyloguj
          </button>
        </div>
      </div>

      <div className="p-4 pt-6 space-y-6">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">WYBRANA BUDOWA:</span>
            <span className="text-xs text-blue-400 font-semibold">{userProfile?.full_name}</span>
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-blue-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {activeSection === 'timer' && (
          <div className="space-y-5">
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">CZAS PRACY DZISIAJ</h3>

              <div className="py-2">
                <span className="text-4xl font-mono font-extrabold text-blue-400 tracking-wider">
                  {formatSeconds(elapsedSeconds)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  {activeLog ? (isOnBreak ? 'W trakcie przerwy' : 'Praca w toku...') : 'Nie rozpoczęto pracy'}
                </p>
                {activeLog && activeLog.start_time && (
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Rozpoczęto o: {new Date(activeLog.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              {!activeLog && (
                <div className="flex items-center justify-center gap-2 pt-1 pb-2">
                  <input
                    type="checkbox"
                    id="claimDietCheck"
                    checked={claimDiet}
                    onChange={(e) => setClaimDiet(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-950 cursor-pointer"
                  />
                  <label htmlFor="claimDietCheck" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Dopisanie diety należnej (45 zł)
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleToggleWorkLog}
                  disabled={loading}
                  className={`py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                    activeLog
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {activeLog ? <Square size={16} /> : <Play size={16} />}
                  {activeLog ? 'ZAKOŃCZ PRACĘ' : 'ROZPOCZNIJ PRACĘ'}
                </button>

                <button
                  onClick={handleToggleBreak}
                  disabled={!activeLog || loading}
                  className={`py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 border ${
                    isOnBreak
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 disabled:opacity-40'
                  }`}
                >
                  <Coffee size={16} />
                  {isOnBreak ? 'WRÓĆ DO PRACY' : 'PRZERWA'}
                </button>
              </div>

              {isOnBreak && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                  <span>Czas trwania przerwy:</span>
                  <span className="font-mono font-bold">{formatSeconds(breakSeconds)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setLeaveType('UW')
                  setShowVacationModal(true)
                }}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl flex flex-col items-center gap-2 text-xs font-semibold text-blue-300 transition-all shadow-lg"
              >
                <Palmtree className="text-blue-400" size={22} />
                <span>Wniosek o Urlop (UW)</span>
              </button>

              <button
                onClick={() => {
                  setLeaveType('L4')
                  setShowVacationModal(true)
                }}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-rose-500 rounded-2xl flex flex-col items-center gap-2 text-xs font-semibold text-rose-300 transition-all shadow-lg"
              >
                <HeartPulse className="text-rose-400" size={22} />
                <span>Zgłoś Chorobę (L4)</span>
              </button>
            </div>
          </div>
        )}

        {activeSection === 'tasks' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              PRZYPISANE ZADANIA ({tasks.length})
            </h3>

            {tasks.length === 0 ? (
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                Brak zadań na wybranej budowie.
              </div>
            ) : (
              tasks.map((task) => {
                const isExpanded = expandedTaskId === task.id
                const taskFiles = taskPhotoFiles[task.id] || []
                const attachments = Array.isArray(task.attachments) ? task.attachments : []
                const isClaimedByMe = task.task_assignments?.some((ta: any) => ta.user_id === userProfile?.id)

                return (
                  <div
                    key={task.id}
                    className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl transition-all"
                  >
                    <div
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-4 cursor-pointer hover:bg-slate-850 transition-all space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-white">{task.title}</h4>
                        <span className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-lg text-[10px] font-bold uppercase">
                          {getPolishTaskStatus(task.status)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock size={13} /> Szacowany czas: {task.estimated_hours || 0}h
                        </span>
                        <span className="text-blue-400 font-semibold text-[11px] flex items-center gap-1">
                          {isExpanded ? 'Zwiń' : 'Szczegóły'}
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4 text-xs">
                        {task.description && (
                          <div>
                            <span className="text-slate-400 block font-semibold mb-1">Opis wykonania:</span>
                            <p className="text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
                              {task.description}
                            </p>
                          </div>
                        )}

                        {attachments.length > 0 && (
                          <div>
                            <span className="text-slate-400 block font-semibold mb-1.5">Załączone pliki budowy:</span>
                            <div className="space-y-1.5">
                              {attachments.map((url: string, idx: number) => {
                                const realFileName = getFileNameFromUrl(url)
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setPreviewFile({ title: realFileName, url })}
                                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-purple-300 hover:border-purple-500 transition-all"
                                  >
                                    <span className="truncate flex items-center gap-2 font-medium text-[11px]">
                                      <FileText size={14} /> {realFileName}
                                    </span>
                                    <Eye size={14} />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* PODEJMIJ SIĘ ZADANIA - Przed podjęciem */}
                        {!isClaimedByMe ? (
                          <button
                            onClick={() => handleClaimTask(task.id)}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50"
                          >
                            <UserCheck size={16} /> PODEJMIJ SIĘ ZADANIA
                          </button>
                        ) : (
                          /* SEKCJA ZDJĘĆ I ZGŁASZANIA - Po podjęciu */
                          <div className="space-y-4 pt-2 border-t border-slate-900">
                            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2 text-[11px] font-semibold">
                              <UserCheck size={15} /> Podjąłeś się tego zadania (widoczne dla Brygadzisty)
                            </div>

                            <div className="space-y-2">
                              <label className="block text-slate-300 font-semibold">
                                Zrób / dodaj zdjęcie z wykonania zadania:
                              </label>

                              <div className="border-2 border-dashed border-slate-800 rounded-xl p-3 text-center bg-slate-900 cursor-pointer hover:border-blue-500 transition-all">
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  multiple
                                  onChange={(e) => handleTaskFileSelect(task.id, e.target.files)}
                                  className="hidden"
                                  id={`task-photo-${task.id}`}
                                />
                                <label
                                  htmlFor={`task-photo-${task.id}`}
                                  className="cursor-pointer flex flex-col items-center gap-1"
                                >
                                  <Camera className="text-blue-400" size={22} />
                                  <span className="text-[11px] text-slate-300 font-semibold">Otwórz aparat / wybierz zdjęcia</span>
                                </label>
                              </div>

                              {taskFiles.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  {taskFiles.map((f, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] text-slate-300"
                                    >
                                      <span className="truncate flex items-center gap-1.5 font-medium">
                                        <ImageIcon className="text-emerald-400" size={14} /> {f.name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTaskFile(task.id, idx)}
                                        className="p-1 text-slate-400 hover:text-rose-400"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleSubmitTaskCompletion(task.id)}
                              disabled={loading}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50"
                            >
                              <CheckCircle2 size={16} /> ZGŁOŚ WYKONANIE (DO BRYGADZISTY)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeSection === 'photos' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              MOJE ZDJĘCIA (GRUPOWANE ZADANIAMI)
            </h3>

            {Object.keys(groupedWorkerPhotos).length === 0 ? (
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                Nie dodałeś jeszcze żadnych zdjęć do zadań.
              </div>
            ) : (
              Object.keys(groupedWorkerPhotos).map((folderName) => (
                <div key={folderName} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
                  <h4 className="font-bold text-xs text-blue-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Folder className="text-blue-400" size={16} /> Zadanie: {folderName} ({groupedWorkerPhotos[folderName].length})
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    {groupedWorkerPhotos[folderName].map((photo: any) => (
                      <div
                        key={photo.id}
                        onClick={() =>
                          setPreviewFile({ title: photo.description || folderName, url: photo.photo_url })
                        }
                        className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 cursor-pointer hover:border-blue-500 transition-all"
                      >
                        <img
                          src={photo.photo_url}
                          alt="Zdjęcie z wykonania zadania"
                          className="w-full h-24 object-cover rounded-lg mb-1"
                        />
                        <p className="text-[10px] text-slate-400 truncate font-medium">
                          {photo.description || 'Zdjęcie'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSection === 'stats' && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                EWIDENCJA CZASU PRACY
              </h3>

              <div className="flex gap-1">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-white focus:outline-none focus:border-blue-500"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1 text-center">
                <span className="text-[9px] text-slate-400 uppercase block">Godziny:</span>
                <p className="text-base font-bold text-blue-400 font-mono">{totalMonthHours} h</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1 text-center">
                <span className="text-[9px] text-slate-400 uppercase block">UW / L4:</span>
                <p className="text-base font-bold text-amber-400 font-mono">{totalUW} / {totalL4}</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1 text-center">
                <span className="text-[9px] text-slate-400 uppercase block">Wypłata (Brutto):</span>
                <p className="text-base font-bold text-emerald-400 font-mono">{estimatedPayout.toFixed(0)} zł</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[10px] flex items-center justify-around text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Oczekujący (Niebieski)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Zatwierdzony (Zielony)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Odrzucony (Czerwony)
              </span>
            </div>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-3">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs text-white">Ewidencja (godziny.xlsx)</h4>
                  <p className="text-[10px] text-slate-400">Czas rzeczywisty (Nieedytowalny dla Pracownika)</p>
                </div>

                <a
                  href={`/api/generate-pdf?month=${selectedMonth}&year=${selectedYear}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white rounded-xl text-xs flex items-center gap-1.5 transition-all font-semibold"
                >
                  <Download size={14} /> Otwórz PDF
                </a>
              </div>

              <div className="overflow-x-auto max-h-80 p-2">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                      <th className="p-1.5">Data</th>
                      <th className="p-1.5">Dzień</th>
                      <th className="p-1.5">Budowa</th>
                      <th className="p-1.5">Od</th>
                      <th className="p-1.5">Do</th>
                      <th className="p-1.5">Godz.[h]</th>
                      <th className="p-1.5">Dieta</th>
                      <th className="p-1.5">UW</th>
                      <th className="p-1.5">L4</th>
                      <th className="p-1.5">Uwagi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {monthData.map((row, idx) => {
                      let rowBgClass = ''

                      if (row.isWeekend) {
                        rowBgClass = 'bg-slate-850/80 text-amber-300/90'
                      }

                      if (row.vacationStatus === 'pending') {
                        rowBgClass = 'bg-blue-950/40 text-blue-200 border-l-2 border-blue-500'
                      } else if (row.vacationStatus === 'approved') {
                        rowBgClass = 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                      } else if (row.vacationStatus === 'rejected') {
                        rowBgClass = 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                      }

                      return (
                        <tr key={idx} className={rowBgClass}>
                          <td className="p-1.5 whitespace-nowrap">{row.dateStr}</td>
                          <td className={`p-1.5 ${row.isWeekend ? 'font-bold text-amber-400' : ''}`}>
                            {row.dayOfWeek.substring(0, 3)}
                          </td>
                          <td className="p-1.5 truncate max-w-[70px]">{row.projectName}</td>
                          <td className="p-1.5">{row.startTime}</td>
                          <td className="p-1.5">{row.endTime}</td>
                          <td className="p-1.5 font-bold text-blue-400">{row.hours > 0 ? `${row.hours}h` : '-'}</td>
                          <td className="p-1.5">{row.allowance}</td>
                          <td className="p-1.5 text-amber-400 font-bold">{row.uw}</td>
                          <td className="p-1.5 text-rose-400 font-bold">{row.l4}</td>
                          <td className="p-1.5 text-slate-400 truncate max-w-[60px]">{row.remarks}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Stawka za roboczogodzinę (ustawiona przez Admina):</span>
                  <span className="font-mono text-slate-200 font-semibold">{hourlyRate.toFixed(2)} PLN / h</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-white pt-1">
                  <span>Szacowana Wypłata Brutto:</span>
                  <span className="font-mono text-emerald-400">{estimatedPayout.toFixed(2)} PLN</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">USTAWIENIA KONTA</h3>
            <div className="space-y-2 text-xs">
              <p className="text-slate-300">
                <strong>Imię i Nazwisko:</strong> {userProfile?.full_name}
              </p>
              <p className="text-slate-300">
                <strong>Rola:</strong> {userProfile?.role}
              </p>
              <p className="text-slate-300">
                <strong>Stawka godzinowa:</strong> {hourlyRate} PLN / h
              </p>
            </div>
          </div>
        )}
      </div>

      {showVacationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">
                {leaveType === 'UW' ? 'Wniosek o Urlop (UW)' : 'Zgłoszenie Chorobowe (L4)'}
              </h4>
              <button onClick={() => setShowVacationModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Data Od:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Data Do:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Uwagi / Powód (Opcjonalnie):</label>
                <input
                  type="text"
                  placeholder="np. Urlop wypoczynkowy..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVacationModal(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSubmitLeaveRequest}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all"
              >
                Wyślij Wniosek
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between max-h-[80vh] my-auto">
            <div className="p-3.5 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h4 className="text-xs font-bold text-white truncate pr-2">{previewFile.title}</h4>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 text-slate-400 hover:text-white bg-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center overflow-auto max-h-[50vh] bg-slate-950">
              <img
                src={previewFile.url}
                alt={previewFile.title}
                className="max-w-full max-h-[45vh] object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="p-3.5 bg-slate-800 border-t border-slate-700 flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="flex-1 py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Zamknij
              </button>
              <a
                href={previewFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={14} /> Pełny rozmiar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}