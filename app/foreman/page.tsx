'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Play,
  Square,
  Clock,
  Users,
  ClipboardList,
  FolderOpen,
  ShoppingCart,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Camera,
  FileText,
  Eye,
  Coffee,
  CheckCircle2,
  XCircle,
  Folder,
  ExternalLink,
  Download,
  AlertCircle,
  UserCheck,
} from 'lucide-react'

export default function ForemanPanel() {
  const router = useRouter()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'timer' | 'workers' | 'tasks' | 'docs' | 'orders' | 'settings'>('timer')
  const [docSubTab, setDocSubTab] = useState<'pre' | 'in_progress' | 'workers'>('pre')

  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  const [userProfile, setUserProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Licznik brygadzisty
  const [activeLog, setActiveLog] = useState<any>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false)
  const [breakSeconds, setBreakSeconds] = useState<number>(0)

  // Pracownicy i ich statusy
  const [allWorkersStatus, setAllWorkersStatus] = useState<any[]>([])

  // Zadania
  const [projectTasks, setProjectTasks] = useState<any[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskHours, setNewTaskHours] = useState('8')
  const [newTaskFiles, setNewTaskFiles] = useState<File[]>([])
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  // Dokumentacja i zdjęcia
  const [preDocs, setPreDocs] = useState<any[]>([])
  const [foremanDocs, setForemanDocs] = useState<any[]>([])
  const [workerDocs, setWorkerDocs] = useState<any[]>([])
  const [foremanUploadFiles, setForemanUploadFiles] = useState<File[]>([])

  // Zamówienia (Materiały)
  const [orders, setOrders] = useState<any[]>([])
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderTitle, setOrderTitle] = useState('')
  const [orderQuantity, setOrderQuantity] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [orderLocation, setOrderLocation] = useState('')
  const [orderFiles, setOrderFiles] = useState<File[]>([]) 

  const [previewFile, setPreviewFile] = useState<{ title: string; url: string } | null>(null)

  useEffect(() => {
    initForeman()
  }, [])

  useEffect(() => {
    if (selectedProject && userProfile) {
      fetchForemanData(selectedProject, userProfile.id)
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
    if (touchStartX.current < 40 && diffX > 50) {
      e.preventDefault()
      setIsSidebarOpen(true)
    } else if (isSidebarOpen && diffX < -50) {
      e.preventDefault()
      setIsSidebarOpen(false)
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  const initForeman = async () => {
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
        if (profile) fetchForemanData(projData[0].id, profile.id)
      }
    } catch (err: any) {
      console.error('Błąd inicjalizacji Brygadzisty:', err)
    }
  }

  const fetchForemanData = async (projId: string, userId: string) => {
    try {
      // 1. Licznik brygadzisty
      const { data: openLog } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', userId)
        .is('end_time', null)
        .maybeSingle()

      setActiveLog(openLog || null)

      // 2. Pobranie statusów wszystkich pracowników dla budowy
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')

      const { data: activeLogs } = await supabase
        .from('time_logs')
        .select('*, profiles(*)')
        .eq('project_id', projId)
        .is('end_time', null)

      const { data: vacations } = await supabase
        .from('vacation_requests')
        .select('*')
        .eq('status', 'approved')

      const todayStr = new Date().toISOString().split('T')[0]

      if (profiles) {
        const mappedWorkers = profiles.map((worker) => {
          const isWorking = activeLogs?.some((l) => l.user_id === worker.id)
          const activeVacation = vacations?.find((v) => {
            return v.user_id === worker.id && todayStr >= v.start_date && todayStr <= v.end_date
          })

          let status: 'working' | 'absent' | 'l4' | 'vacation' = 'absent'
          if (isWorking) {
            status = 'working'
          } else if (activeVacation) {
            status = activeVacation.type === 'L4' ? 'l4' : 'vacation'
          }

          return {
            ...worker,
            status,
          }
        })
        setAllWorkersStatus(mappedWorkers)
      }

      // 3. Zadania na budowie
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, task_assignments(user_id, profiles(full_name)), project_photos(*)')
        .eq('project_id', projId)
        .order('created_at', { ascending: false })

      if (tasksData) setProjectTasks(tasksData)

      // 4. Dokumentacja
      // Dok. Przedwykonawcza (zalaczniki projektu)
      const currentProj = projects.find((p) => p.id === projId)
      if (currentProj?.attachments) {
        setPreDocs(Array.isArray(currentProj.attachments) ? currentProj.attachments : [])
      }

      // Dok. w trakcie budowy (Brygadzista)
      const { data: fDocs } = await supabase
        .from('project_photos')
        .select('*, profiles(full_name)')
        .eq('project_id', projId)
        .eq('photo_type', 'progress')
        .order('created_at', { ascending: false })

      if (fDocs) setForemanDocs(fDocs)

      // Dok. Pracowników
      const { data: wDocs } = await supabase
        .from('project_photos')
        .select('*, tasks(title), profiles(full_name)')
        .eq('project_id', projId)
        .eq('photo_type', 'task_completion')
        .order('created_at', { ascending: false })

      if (wDocs) setWorkerDocs(wDocs)

      // 5. Zamówienia (Materiały)
      const { data: orderData } = await supabase
        .from('material_requests')
        .select('*, profiles(full_name)')
        .eq('project_id', projId)
        .order('created_at', { ascending: false })

      if (orderData) setOrders(orderData)
    } catch (err: any) {
      console.error('Błąd pobierania danych brygadzisty:', err)
    }
  }

  const handleToggleWorkLog = async () => {
    if (!selectedProject || !userProfile) return
    setLoading(true)

    try {
      if (!activeLog) {
        const { data: newLog, error } = await supabase
          .from('time_logs')
          .insert({
            user_id: userProfile.id,
            project_id: selectedProject,
            start_time: new Date().toISOString(),
          })
          .select()
          .single()

        if (!error && newLog) setActiveLog(newLog)
      } else {
        await supabase
          .from('time_logs')
          .update({ end_time: new Date().toISOString() })
          .eq('id', activeLog.id)

        setActiveLog(null)
      }
      fetchForemanData(selectedProject, userProfile.id)
    } catch (err: any) {
      alert('Błąd rejestracji czasu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTaskSubmit = async () => {
    if (!newTaskTitle || !selectedProject || !userProfile) {
      alert('Wpisz tytuł zadania!')
      return
    }
    setLoading(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of newTaskFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `task-attachments/${selectedProject}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`

        const { error: uploadErr } = await supabase.storage
          .from('project-photos')
          .upload(fileName, file)

        if (!uploadErr) {
          const { data } = supabase.storage.from('project-photos').getPublicUrl(fileName)
          if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
        }
      }

      const { error } = await supabase.from('tasks').insert({
        project_id: selectedProject,
        title: newTaskTitle,
        description: newTaskDesc,
        estimated_hours: Number(newTaskHours) || 8,
        status: 'todo',
        created_by: userProfile.id,
        attachments: uploadedUrls,
      })

      if (!error) {
        alert('Pomyślnie utworzono zadanie!')
        setShowTaskModal(false)
        setNewTaskTitle('')
        setNewTaskDesc('')
        setNewTaskFiles([])
        fetchForemanData(selectedProject, userProfile.id)
      } else {
        alert('Błąd tworzenia zadania: ' + error.message)
      }
    } catch (err: any) {
      alert('Wystąpił błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

      if (!error) {
        alert(newStatus === 'completed' ? 'Odebrano i zatwierdzono zadanie!' : 'Zwrócono do poprawek.')
        fetchForemanData(selectedProject, userProfile.id)
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForemanUploadDoc = async () => {
    if (foremanUploadFiles.length === 0 || !selectedProject || !userProfile) return
    setLoading(true)

    try {
      for (const file of foremanUploadFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `foreman-docs/${selectedProject}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`

        const { error: uploadErr } = await supabase.storage
          .from('project-photos')
          .upload(fileName, file)

        if (!uploadErr) {
          const { data } = supabase.storage.from('project-photos').getPublicUrl(fileName)
          if (data?.publicUrl) {
            await supabase.from('project_photos').insert({
              project_id: selectedProject,
              uploaded_by: userProfile.id,
              photo_type: 'progress',
              photo_url: data.publicUrl,
              description: `Dokumentacja budowy dodana przez ${userProfile.full_name}`,
            })
          }
        }
      }
      alert('Dodano pliki dokumentacji w trakcie budowy!')
      setForemanUploadFiles([])
      fetchForemanData(selectedProject, userProfile.id)
    } catch (err: any) {
      alert('Błąd wgrywania: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

const handleCreateOrderSubmit = async () => {
  if (!orderTitle || !selectedProject || !userProfile) {
    alert('Podaj nazwę materiału / zamówienia!')
    return
  }
  setLoading(true)

  try {
    const uploadedUrls: string[] = []

    // Wgrywanie zdjęć/załączników zamówienia
    for (const file of orderFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `order-attachments/${selectedProject}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`

      const { error: uploadErr } = await supabase.storage
        .from('project-photos')
        .upload(fileName, file)

      if (!uploadErr) {
        const { data } = supabase.storage.from('project-photos').getPublicUrl(fileName)
        if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
      }
    }

    const { error } = await supabase.from('material_requests').insert({
      project_id: selectedProject,
      user_id: userProfile.id,
      item_name: orderTitle,
      quantity: orderQuantity,
      notes: `Lokalizacja dostawy: ${orderLocation || 'Brak'}${orderNotes ? ` | Uwagi: ${orderNotes}` : ''}`,
      attachments: uploadedUrls,
      status: 'pending',
    })

    if (!error) {
      alert('Zgłoszono zamówienie materiałów do Biura / Admina!')
      setShowOrderModal(false)
      setOrderTitle('')
      setOrderQuantity('')
      setOrderLocation('')
      setOrderNotes('')
      setOrderFiles([])
      fetchForemanData(selectedProject, userProfile.id)
    } else {
      alert('Błąd dodawania zamówienia: ' + error.message)
    }
  } catch (err: any) {
    alert('Błąd: ' + err.message)
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

  const getFileNameFromUrl = (url: string) => {
    try {
      const decoded = decodeURIComponent(url)
      const parts = decoded.split('/')
      return parts[parts.length - 1].split('?')[0] || 'Załącznik'
    } catch {
      return 'Załącznik'
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehaviorX: 'none', touchAction: 'pan-y' }}
      className="min-h-screen bg-slate-950 text-white w-full relative flex flex-col justify-between overflow-x-hidden font-sans"
    >
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

      {/* PASEK BOCZNY BRYGADZISTY */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Panel Brygadzisty</h2>
              <p className="text-xs text-blue-400 font-medium">{userProfile?.full_name || 'Brygadzista'}</p>
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
                setActiveSection('workers')
                setIsSidebarOpen(false)
              }}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                activeSection === 'workers'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users size={18} /> 2. Lista Pracowników
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
              <ClipboardList size={18} /> 3. Zadania ({projectTasks.filter((t) => t.status === 'pending_approval').length})
            </button>

            <button
              onClick={() => {
                setActiveSection('docs')
                setIsSidebarOpen(false)
              }}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                activeSection === 'docs'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FolderOpen size={18} /> 4. Dokumentacja i Zdjęcia
            </button>

            <button
              onClick={() => {
                setActiveSection('orders')
                setIsSidebarOpen(false)
              }}
              className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                activeSection === 'orders'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShoppingCart size={18} /> 5. Zamówienia (Materiały)
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

      {/* TREŚĆ GŁÓWNA */}
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

        {/* 1. LICZNIK BRYGADZISTY */}
        {activeSection === 'timer' && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">MÓJ CZAS PRACY (BRYGADZISTA)</h3>

            <div className="py-2">
              <span className="text-4xl font-mono font-extrabold text-blue-400 tracking-wider">
                {formatSeconds(elapsedSeconds)}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {activeLog ? 'Praca w toku...' : 'Nie rozpoczęto pracy'}
              </p>
            </div>

            <button
              onClick={handleToggleWorkLog}
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                activeLog
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {activeLog ? <Square size={16} /> : <Play size={16} />}
              {activeLog ? 'ZAKOŃCZ PRACĘ BRYGADZISTY' : 'ROZPOCZNIJ PRACĘ BRYGADZISTY'}
            </button>
          </div>
        )}

        {/* 2. LISTA PRACOWNIKÓW I STATUSY (ZIELONY / CZERWONY / NIEBIESKI / SZARY) */}
        {activeSection === 'workers' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              STAN OBECNOŚCI PRACOWNIKÓW ({allWorkersStatus.length})
            </h3>

            {/* Legenda kolorów */}
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Zalogowany (Pracuje)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Nieaktywny (Nie kliknął start)
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Na L4 (Chorobowe)
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Na Urlopie (UW)
              </span>
            </div>

            <div className="space-y-2">
              {allWorkersStatus.map((worker) => {
                let badgeColor = 'bg-slate-800 border-slate-700 text-slate-400'
                let statusText = 'Nieaktywny'

                if (worker.status === 'working') {
                  badgeColor = 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  statusText = 'Zalogowany (Praca w toku)'
                } else if (worker.status === 'absent') {
                  badgeColor = 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                  statusText = 'Brak startu w aplikacji'
                } else if (worker.status === 'l4') {
                  badgeColor = 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                  statusText = 'Na L4 (Chorobowe)'
                } else if (worker.status === 'vacation') {
                  badgeColor = 'bg-slate-800 border-slate-600 text-slate-300'
                  statusText = 'Na urlopie (UW)'
                }

                return (
                  <div
                    key={worker.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-md transition-all ${badgeColor}`}
                  >
                    <div>
                      <h4 className="font-bold text-xs text-white">{worker.full_name}</h4>
                      <p className="text-[10px] opacity-80 mt-0.5">{statusText}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-black/30 border border-white/10">
                        {worker.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. ZADANIA I AKCEPTACJA WYKONANIA */}
        {activeSection === 'tasks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                ZADANIA NA BUDOWIE ({projectTasks.length})
              </h3>

              <button
                onClick={() => setShowTaskModal(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Plus size={16} /> Dodaj Zadanie
              </button>
            </div>

            {projectTasks.map((task) => {
              const isPendingApproval = task.status === 'pending_approval'
              const isExpanded = expandedTaskId === task.id
              const photos = task.project_photos || []

              return (
                <div
                  key={task.id}
                  className={`bg-slate-900 rounded-2xl border ${
                    isPendingApproval ? 'border-amber-500/80' : 'border-slate-800'
                  } overflow-hidden shadow-xl`}
                >
                  <div
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="p-4 cursor-pointer hover:bg-slate-850 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-white">{task.title}</h4>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                          isPendingApproval
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : task.status === 'completed'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-blue-500/20 border-blue-500 text-blue-300'
                        }`}
                      >
                        {isPendingApproval
                          ? 'CZAKA NA ODBIÓR'
                          : task.status === 'completed'
                          ? 'ZAKOŃCZONE'
                          : 'W TRAKCIE'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Przypisani pracownicy: {task.task_assignments?.length || 0}</span>
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
                          <span className="text-slate-400 block font-semibold mb-1">Opis:</span>
                          <p className="text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
                            {task.description}
                          </p>
                        </div>
                      )}

                      {/* Zdjęcia przesłane przez pracowników do tego zadania */}
                      {photos.length > 0 && (
                        <div>
                          <span className="text-slate-400 block font-semibold mb-2">
                            Zdjęcia wykonanych prac ({photos.length}):
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {photos.map((photo: any) => (
                              <div
                                key={photo.id}
                                onClick={() =>
                                  setPreviewFile({ title: task.title, url: photo.photo_url })
                                }
                                className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 cursor-pointer"
                              >
                                <img
                                  src={photo.photo_url}
                                  alt="Zdjęcie z wykonania zadania"
                                  className="w-full h-24 object-cover rounded-lg mb-1"
                                />
                                <p className="text-[9px] text-slate-400 truncate">Kliknij, aby powiększyć</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ODBIÓR ZADANIA PRZEZ BRYGADZISTĘ */}
                      {isPendingApproval && (
                        <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-2">
                          <p className="text-amber-300 text-[11px] font-semibold flex items-center gap-1.5">
                            <AlertCircle size={15} /> Pracownik zgłosił wykonanie pracy.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                              disabled={loading}
                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                            >
                              <CheckCircle2 size={15} /> Zatwierdź / Odbierz
                            </button>
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                              disabled={loading}
                              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                            >
                              <XCircle size={15} /> Do poprawki
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 4. DOKUMENTACJA I ZDJĘCIA - Z PODZAKŁADKAMI */}
        {activeSection === 'docs' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              DOKUMENTACJA I ZDJĘCIA BUDOWY
            </h3>

            {/* Zakładki wewnętrzne */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setDocSubTab('pre')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all text-[11px] ${
                  docSubTab === 'pre' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                Przedwykonawcza
              </button>
              <button
                onClick={() => setDocSubTab('in_progress')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all text-[11px] ${
                  docSubTab === 'in_progress' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                W trakcie (Brygadzista)
              </button>
              <button
                onClick={() => setDocSubTab('workers')}
                className={`flex-1 py-2 rounded-lg font-bold transition-all text-[11px] ${
                  docSubTab === 'workers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
                }`}
              >
                Pracowników
              </button>
            </div>

            {/* PODZAKŁADKA 1: Przedwykonawcza */}
            {docSubTab === 'pre' && (
              <div className="space-y-2">
                {preDocs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6 bg-slate-900 rounded-2xl border border-slate-800">
                    Brak załączonych dokumentów przedwykonawczych od Biura.
                  </p>
                ) : (
                  preDocs.map((url: string, idx: number) => {
                    const realName = getFileNameFromUrl(url)
                    return (
                      <div
                        key={idx}
                        onClick={() => setPreviewFile({ title: realName, url })}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-purple-300 cursor-pointer hover:border-purple-500"
                      >
                        <span className="truncate flex items-center gap-2">
                          <FileText size={16} /> {realName}
                        </span>
                        <Eye size={16} />
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* PODZAKŁADKA 2: Dokumentacja w trakcie budowy (Brygadzista) */}
            {docSubTab === 'in_progress' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-xs font-semibold text-slate-300 block">Dodaj nowe zdjęcia/pliki budowlane:</span>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setForemanUploadFiles(Array.from(e.target.files || []))}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white cursor-pointer"
                  />
                  {foremanUploadFiles.length > 0 && (
                    <button
                      onClick={handleForemanUploadDoc}
                      disabled={loading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                    >
                      Wgraj Pliki ({foremanUploadFiles.length})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {foremanDocs.map((photo: any) => (
                    <div
                      key={photo.id}
                      onClick={() => setPreviewFile({ title: photo.description || 'Dokumentacja', url: photo.photo_url })}
                      className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 cursor-pointer"
                    >
                      <img src={photo.photo_url} alt="Dokumentacja" className="w-full h-24 object-cover rounded-lg mb-1" />
                      <p className="text-[9px] text-slate-400 truncate">{photo.profiles?.full_name || 'Brygadzista'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PODZAKŁADKA 3: Dokumentacja Pracowników */}
            {docSubTab === 'workers' && (
              <div className="grid grid-cols-2 gap-2">
                {workerDocs.length === 0 ? (
                  <p className="col-span-2 text-xs text-slate-500 text-center py-6 bg-slate-900 rounded-2xl border border-slate-800">
                    Pracownicy nie wgrali jeszcze zdjęć z wykonanych zadań.
                  </p>
                ) : (
                  workerDocs.map((photo: any) => (
                    <div
                      key={photo.id}
                      onClick={() =>
                        setPreviewFile({ title: photo.tasks?.title || 'Praca pracownika', url: photo.photo_url })
                      }
                      className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 cursor-pointer"
                    >
                      <img src={photo.photo_url} alt="Zdjęcie pracownika" className="w-full h-24 object-cover rounded-lg mb-1" />
                      <p className="text-[10px] text-blue-400 font-semibold truncate">{photo.tasks?.title || 'Zadanie'}</p>
                      <p className="text-[9px] text-slate-400 truncate">{photo.profiles?.full_name}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. ZAMÓWIENIA MATERIAŁÓW */}
        {activeSection === 'orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                ZAMÓWIENIA MATERIAŁÓW ({orders.length})
              </h3>

              <button
                onClick={() => setShowOrderModal(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Plus size={16} /> Zamów Materiał
              </button>
            </div>

            <div className="space-y-2">
              {orders.map((ord) => (
                <div key={ord.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 shadow-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-white">{ord.item_name}</h4>
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-bold">
                      {ord.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Ilość: {ord.quantity || 'Nieokreślono'}</p>
                  {ord.notes && <p className="text-[10px] text-slate-500">Uwagi: {ord.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USTAWIENIA */}
        {activeSection === 'settings' && (
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">PROFIL BRYGADZISTY</h3>
            <p className="text-slate-300">
              <strong>Imię i Nazwisko:</strong> {userProfile?.full_name}
            </p>
            <p className="text-slate-300">
              <strong>Rola:</strong> {userProfile?.role}
            </p>
          </div>
        )}
      </div>

      {/* MODAL: TWORZENIE ZADANIA */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Dodaj Nowe Zadanie</h4>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tytuł zadania:</label>
                <input
                  type="text"
                  placeholder="np. Montaż rozdzielnicy R1..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Opis / Wytyczne:</label>
                <textarea
                  placeholder="Szczegóły wykonania..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Szacowane godziny [h]:</label>
                <input
                  type="number"
                  value={newTaskHours}
                  onChange={(e) => setNewTaskHours(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Załączniki (schematy, rysunki):</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setNewTaskFiles(Array.from(e.target.files || []))}
                  className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-blue-600 file:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleCreateTaskSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg"
              >
                Utwórz Zadanie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ZAMÓWIENIE MATERIAŁÓW */}
      {showOrderModal && (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h4 className="font-bold text-sm text-white">Zamówienie Materiałów</h4>
        <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Nazwa materiału / sprzętu:</label>
          <input
            type="text"
            placeholder="np. Przewód YDYp 3x1.5..."
            value={orderTitle}
            onChange={(e) => setOrderTitle(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Ilość:</label>
          <input
            type="text"
            placeholder="np. 500m / 10 sztuk..."
            value={orderQuantity}
            onChange={(e) => setOrderQuantity(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Miejsce / Lokalizacja dostawy na budowie:</label>
          <input
            type="text"
            placeholder="np. Piętro 1, Rozdzielnia Główna..."
            value={orderLocation}
            onChange={(e) => setOrderLocation(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Dodatkowe uwagi:</label>
          <input
            type="text"
            placeholder="np. Pilne na wtorek rano..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* POLE WYBORU ZDJĘCIA (APARAT LUB GALERIA) */}
        <div>
          <label className="block text-slate-400 mb-1">Załącz zdjęcie (np. tabliczki, specyfikacji):</label>
          <div className="border-2 border-dashed border-slate-800 rounded-xl p-3 text-center bg-slate-950 cursor-pointer hover:border-blue-500 transition-all">
            <input
              type="file"
              multiple
              onChange={(e) => setOrderFiles(Array.from(e.target.files || []))}
              className="hidden"
              id="order-photo-input"
            />
            <label htmlFor="order-photo-input" className="cursor-pointer flex flex-col items-center gap-1.5">
              <Camera className="text-blue-400" size={24} />
              <span className="text-[12px] text-blue-400 font-bold">Zrób zdjęcie lub Wybierz z Galerii</span>
            </label>
          </div>

          {orderFiles.length > 0 && (
            <div className="space-y-1 pt-2">
              {orderFiles.map((f, idx) => (
                <div key={idx} className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center text-[11px] text-slate-300">
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => setOrderFiles(orderFiles.filter((_, i) => i !== idx))} className="text-rose-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => setShowOrderModal(false)}
          className="flex-1 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={handleCreateOrderSubmit}
          disabled={loading}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg"
        >
          Wyślij Zamówienie
        </button>
      </div>
    </div>
  </div>
)}

      {/* PODGLĄD ZDJĘĆ / PLIKÓW */}
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