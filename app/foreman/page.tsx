'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  Package,
  Camera,
  FolderKanban,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  Upload,
  FileText,
  Paperclip,
  Users,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Trash2,
  Image as ImageIcon,
  X,
  Calendar,
  MapPin,
  User,
  Eye,
  QrCode,
  FolderPlus,
  Folder,
  ExternalLink,
} from 'lucide-react'

export default function ForemanPanel() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'documentation' | 'materials'>('tasks')
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  // MODAL PODGLĄDU PLIKU / ZDJĘCIA
  const [previewFile, setPreviewFile] = useState<{ title: string; url: string } | null>(null)

  // DOKUMENTACJA ADMINA
  const [documents, setDocuments] = useState<any[]>([])

  // FOLDERY I PLIKI BRYGADZISTY
  const [foremanFolders, setForemanFolders] = useState<any[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)

  // ZALOGOWANI PRACOWNICI
  const [activeWorkers, setActiveWorkers] = useState<any[]>([])
  const [showWorkerPicker, setShowWorkerPicker] = useState(false)
  const [tempSelectedWorkerIds, setTempSelectedWorkerIds] = useState<string[]>([])
  const [finalSelectedWorkerIds, setFinalSelectedWorkerIds] = useState<string[]>([])

  // DOKUMENTY Z PROJEKTU DO ZADANIA
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [tempSelectedDocUrls, setTempSelectedDocUrls] = useState<string[]>([])
  const [finalSelectedDocUrls, setFinalSelectedDocUrls] = useState<string[]>([])
  const [taskLocalFiles, setTaskLocalFiles] = useState<File[]>([])

  // FORMULARZ ZADANIA
  const [tasks, setTasks] = useState<any[]>([])
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [selectedHours, setSelectedHours] = useState<number>(0)
  const [selectedMinutes, setSelectedMinutes] = useState<number>(0)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  // FORMULARZ MATERIAŁÓW
  const [materialRequests, setMaterialRequests] = useState<any[]>([])
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purpose, setPurpose] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [materialPhotoFile, setMaterialPhotoFile] = useState<File | null>(null)

  // ZDJĘCIA / PLIKI BUDOWY
  const [siteFiles, setSiteFiles] = useState<any[]>([])
  const [fileDescription, setFileDescription] = useState('')
  const [selectedSiteFile, setSelectedSiteFile] = useState<File | null>(null)

  const router = useRouter()

  useEffect(() => {
    initForeman()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchDataForProject(selectedProject)

      // SUBSKRYPCJA ZMIAN W CZASIE RZECZYWISTYM (REALTIME)
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${selectedProject}` },
          () => {
            fetchDataForProject(selectedProject)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedProject])

  const initForeman = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserProfile(profile)

      const { data: projData } = await supabase.from('projects').select('*')
      if (projData && projData.length > 0) {
        setProjects(projData)
        setSelectedProject(projData[0].id)
      }
    } catch (err: any) {
      console.error('Błąd inicjalizacji panelu:', err)
    }
  }

  const fetchDataForProject = async (projId: string) => {
    try {
      const { data: tData } = await supabase
        .from('tasks')
        .select('*, task_assignments(user_id, profiles(full_name)), project_photos(*, profiles(full_name))')
        .eq('project_id', projId)
        .order('created_at', { ascending: false })
      if (tData) setTasks(tData)

      const { data: docData } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projId)
        .order('folder_name', { ascending: true })
      if (docData) setDocuments(docData)

      const { data: folderData } = await supabase
        .from('foreman_folders')
        .select('*')
        .eq('project_id', projId)
        .order('created_at', { ascending: true })
      if (folderData) setForemanFolders(folderData)

      const { data: activeLogs } = await supabase
        .from('time_logs')
        .select('user_id, profiles(id, full_name)')
        .eq('project_id', projId)
        .is('end_time', null)

      if (activeLogs) {
        const uniqueWorkers = Array.from(
          new Map(
            activeLogs
              .filter((item: any) => item.profiles && item.profiles.id)
              .map((item: any) => [item.user_id, item.profiles])
          ).values()
        ).filter(Boolean)
        setActiveWorkers(uniqueWorkers)
      }

      const { data: mData } = await supabase
        .from('material_requests')
        .select('*')
        .eq('project_id', projId)
        .order('created_at', { ascending: false })
      if (mData) setMaterialRequests(mData)

      const { data: pData } = await supabase
        .from('project_photos')
        .select('*, profiles(full_name)')
        .eq('project_id', projId)
        .order('created_at', { ascending: false })
      if (pData) setSiteFiles(pData)
    } catch (err: any) {
      console.error('Błąd pobierania danych:', err)
    }
  }

  const formatTaskTime = (hoursDecimal: number | null | undefined) => {
    if (!hoursDecimal || hoursDecimal <= 0) return 'nieoszacowany'
    const totalMinutes = Math.round(hoursDecimal * 60)
    const hrs = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60

    if (hrs > 0 && mins > 0) return `${hrs} godz. ${mins} min`
    if (hrs > 0) return `${hrs} godz.`
    return `${mins} min`
  }

  const isImageUrl = (url: string) => {
    if (!url) return false
    const cleanUrl = url.split('?')[0].toLowerCase()
    return (
      cleanUrl.endsWith('.jpg') ||
      cleanUrl.endsWith('.jpeg') ||
      cleanUrl.endsWith('.png') ||
      cleanUrl.endsWith('.webp') ||
      cleanUrl.endsWith('.gif')
    )
  }

  const toggleTempWorker = (workerId: string) => {
    if (tempSelectedWorkerIds.includes(workerId)) {
      setTempSelectedWorkerIds(tempSelectedWorkerIds.filter((id) => id !== workerId))
    } else {
      setTempSelectedWorkerIds([...tempSelectedWorkerIds, workerId])
    }
  }

  const confirmWorkerSelection = () => {
    setFinalSelectedWorkerIds(tempSelectedWorkerIds)
    setShowWorkerPicker(false)
  }

  const cancelWorkerSelection = () => {
    setTempSelectedWorkerIds(finalSelectedWorkerIds)
    setShowWorkerPicker(false)
  }

  const toggleTempDoc = (docUrl: string) => {
    if (tempSelectedDocUrls.includes(docUrl)) {
      setTempSelectedDocUrls(tempSelectedDocUrls.filter((url) => url !== docUrl))
    } else {
      setTempSelectedDocUrls([...tempSelectedDocUrls, docUrl])
    }
  }

  const confirmDocSelection = () => {
    setFinalSelectedDocUrls(tempSelectedDocUrls)
    setShowDocPicker(false)
  }

  const cancelDocSelection = () => {
    setTempSelectedDocUrls(finalSelectedDocUrls)
    setShowDocPicker(false)
  }

  const handleLocalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskLocalFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeLocalFile = (index: number) => {
    setTaskLocalFiles((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setLoading(true)

    try {
      const uploadedLocalUrls: string[] = []
      if (taskLocalFiles.length > 0) {
        for (const file of taskLocalFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `task-attachments/${selectedProject}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('project-photos')
            .upload(fileName, file)

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('project-photos')
              .getPublicUrl(fileName)

            if (publicUrlData?.publicUrl) {
              uploadedLocalUrls.push(publicUrlData.publicUrl)
            }
          }
        }
      }

      const allAttachments = [...finalSelectedDocUrls, ...uploadedLocalUrls]
      const totalHoursCalculated = selectedHours + selectedMinutes / 60
      const initialStatus = finalSelectedWorkerIds.length > 0 ? 'in_progress' : 'todo'

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          project_id: selectedProject,
          title: taskTitle,
          description: taskDesc,
          estimated_hours: Number(totalHoursCalculated.toFixed(2)),
          attachments: allAttachments,
          status: initialStatus,
          created_by: userProfile?.id,
        })
        .select()
        .single()

      if (!error && newTask) {
        if (finalSelectedWorkerIds.length > 0) {
          const assignments = finalSelectedWorkerIds.map((wId) => ({
            task_id: newTask.id,
            user_id: wId,
          }))
          await supabase.from('task_assignments').insert(assignments)
        }

        setTaskTitle('')
        setTaskDesc('')
        setSelectedHours(0)
        setSelectedMinutes(0)
        setFinalSelectedWorkerIds([])
        setTempSelectedWorkerIds([])
        setFinalSelectedDocUrls([])
        setTempSelectedDocUrls([])
        setTaskLocalFiles([])

        fetchDataForProject(selectedProject)
      } else {
        alert('Błąd dodawania zadania: ' + (error?.message || 'Nieznany błąd'))
      }
    } catch (err: any) {
      alert('Wystąpił błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetTaskStatus = async (taskId: string, newStatus: 'done' | 'needs_fix') => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

      if (error) {
        alert('Błąd aktualizacji statusu: ' + error.message)
      } else {
        fetchDataForProject(selectedProject)
      }
    } catch (err: any) {
      alert('Nieoczekiwany błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Czy na pewno chcesz trwale usunąć to zadanie?')) return

    setLoading(true)
    try {
      await supabase.from('task_assignments').delete().eq('task_id', taskId)
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)

      if (error) {
        alert('Błąd podczas usuwania zadania: ' + error.message)
      } else {
        setExpandedTaskId(null)
        fetchDataForProject(selectedProject)
      }
    } catch (err: any) {
      alert('Błąd usuwania: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedProject) return
    setLoading(true)
    try {
      const { error } = await supabase.from('foreman_folders').insert({
        project_id: selectedProject,
        name: newFolderName.trim(),
      })

      if (!error) {
        setNewFolderName('')
        setShowNewFolderInput(false)
        fetchDataForProject(selectedProject)
      } else {
        alert('Błąd tworzenia folderu: ' + error.message)
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten folder? Pliki z folderu nie zostaną usunięte.')) return
    setLoading(true)
    try {
      await supabase.from('foreman_folders').delete().eq('id', folderId)
      if (selectedFolderId === folderId) setSelectedFolderId(null)
      fetchDataForProject(selectedProject)
    } catch (err: any) {
      alert('Błąd usuwania folderu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSiteFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !selectedSiteFile || !userProfile) return
    setLoading(true)

    try {
      const fileExt = selectedSiteFile.name.split('.').pop()
      const fileName = `site-documents/${selectedProject}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`

      const { error: uploadErr } = await supabase.storage
        .from('project-photos')
        .upload(fileName, selectedSiteFile)

      if (uploadErr) throw uploadErr

      const { data: publicUrlData } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName)

      const fileUrl = publicUrlData?.publicUrl || ''

      await supabase.from('project_photos').insert({
        project_id: selectedProject,
        uploaded_by: userProfile.id,
        photo_type: 'progress',
        photo_url: fileUrl,
        description: fileDescription || selectedSiteFile.name,
        folder_id: selectedFolderId,
      })

      setSelectedSiteFile(null)
      setFileDescription('')
      fetchDataForProject(selectedProject)
    } catch (err: any) {
      alert('Błąd wgrywania pliku: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSiteFile = async (fileId: string) => {
    if (!confirm('Czy na pewno chcesz trwale usunąć ten plik/zdjęcie z dokumentacji?')) return
    setLoading(true)
    try {
      const { error } = await supabase.from('project_photos').delete().eq('id', fileId)
      if (error) {
        alert('Błąd usuwania pliku: ' + error.message)
      } else {
        fetchDataForProject(selectedProject)
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaterialRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !userProfile) return
    setLoading(true)

    try {
      let uploadedPhotoUrl = ''

      if (materialPhotoFile) {
        const fileExt = materialPhotoFile.name.split('.').pop()
        const fileName = `materials/${selectedProject}/${Date.now()}.${fileExt}`

        const { error: uploadErr } = await supabase.storage
          .from('project-photos')
          .upload(fileName, materialPhotoFile)

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('project-photos')
            .getPublicUrl(fileName)
          uploadedPhotoUrl = publicUrlData?.publicUrl || ''
        }
      }

      const { error } = await supabase.from('material_requests').insert({
        project_id: selectedProject,
        requested_by: userProfile.id,
        item_name: itemName,
        quantity_with_unit: quantity,
        purpose,
        pickup_location: pickupLocation || 'Na budowę (kurier)',
        recipient_name: recipientName || userProfile.full_name,
        photo_url: uploadedPhotoUrl || null,
        status: 'requested',
      })

      if (!error) {
        setItemName('')
        setQuantity('')
        setPurpose('')
        setPickupLocation('')
        setRecipientName('')
        setMaterialPhotoFile(null)
        fetchDataForProject(selectedProject)
      } else {
        alert('Błąd tworzenia zamówienia: ' + error.message)
      }
    } catch (err: any) {
      alert('Błąd zgłoszenia materiałowego: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMaterialRequest = async (matId: string, status: string) => {
    if (status !== 'oczekujace' && status !== 'requested') {
      alert('Nie można usunąć zamówienia, które zostało już przetworzone przez Admina.')
      return
    }

    if (!confirm('Czy na pewno chcesz usunąć to zapotrzebowanie na materiał?')) return

    setLoading(true)
    try {
      const { error } = await supabase.from('material_requests').delete().eq('id', matId)
      if (error) {
        alert('Błąd podczas usuwania: ' + error.message)
      } else {
        fetchDataForProject(selectedProject)
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

  const groupedAdminDocuments = (documents || []).reduce((acc: any, doc: any) => {
    const folder = doc.folder_name || 'Inne Dokumenty'
    if (!acc[folder]) acc[folder] = []
    acc[folder].push(doc)
    return acc
  }, {})

  const workerPhotosList = (siteFiles || []).filter(
    (f) => f.uploaded_by !== userProfile?.id && f.task_id != null
  )

  const groupedWorkerPhotos = workerPhotosList.reduce((acc: any, photo: any) => {
    const workerName = photo.profiles?.full_name || 'Inny Pracownik'
    if (!acc[workerName]) acc[workerName] = []
    acc[workerName].push(photo)
    return acc
  }, {})

  const foremanFilesList = (siteFiles || []).filter((f) => {
    if (f.uploaded_by !== userProfile?.id && f.task_id != null) return false
    if (selectedFolderId === null) return true
    return f.folder_id === selectedFolderId
  })

const getTaskStatusBadge = (task: any) => {
  // 1. Zakończone / Potwierdzone przez brygadzistę
  if (task.status === 'done') {
    return (
      <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
        Potwierdzone
      </span>
    )
  }

  // 2. Czeka na potwierdzenie od brygadzisty (zgłoszone przez pracownika)
  if (
    task.status === 'pending_approval' ||
    task.status === 'czeka_na_potwierdzenie' ||
    task.status === 'oczekuje_na_potwierdzenie'
  ) {
    return (
      <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-lg text-[10px] font-bold uppercase animate-pulse tracking-wider">
        Czeka na potwierdzenie
      </span>
    )
  }

  // 3. Do poprawy
  if (task.status === 'needs_fix') {
    return (
      <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/50 text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
        Do poprawy
      </span>
    )
  }

  // 4. W trakcie wykonywania
  if (task.status === 'in_progress') {
    return (
      <span className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
        W trakcie
      </span>
    )
  }

  // 5. Oczekujące (brak statusu lub 'todo')
  return (
    <span className="px-2.5 py-1 bg-slate-700/80 border border-slate-600 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
      Oczekujące
    </span>
  )
}

  const getMaterialStatusBadge = (status: string) => {
    switch (status) {
      case 'zamowione':
      case 'ordered':
        return (
          <span className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            Zamówione
          </span>
        )
      case 'w_dostawie':
      case 'in_delivery':
        return (
          <span className="px-2.5 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-lg text-[10px] font-bold uppercase animate-pulse tracking-wider">
            W dostawie
          </span>
        )
      case 'odebrane':
      case 'received':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            Odebrane
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            Oczekujące
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 max-w-md mx-auto flex flex-col justify-between relative">
      <div>
        {/* NAGŁÓWEK */}
        <div className="flex justify-between items-center mb-6 pt-2 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold">Panel Brygadzisty</h1>
            <p className="text-xs text-slate-400">{userProfile?.full_name || 'Nadzór budowy'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300"
            title="Wyloguj"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* WYBÓR BUDOWY */}
        <div className="mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">WYBRANA BUDOWA:</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-medium focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* ZAKŁADKI */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-800 p-1 rounded-xl mb-6 border border-slate-700">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList size={16} /> Zadania
          </button>
          <button
            onClick={() => setActiveTab('documentation')}
            className={`py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'documentation' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderKanban size={16} /> Dok. & Zdjęcia
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'materials' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package size={16} /> Materiały
          </button>
        </div>

        {/* ZAKŁADKA 1: ZADANIA */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateTask} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <Plus size={18} /> Nowe Zadanie na Budowie
              </h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nazwa zadania:</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Opis zadania:</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white h-16 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* CZAS WYKONANIA */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Szacowany czas wykonania:</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Godziny (0-24h):</span>
                    <select
                      value={selectedHours}
                      onChange={(e) => setSelectedHours(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      {Array.from({ length: 25 }, (_, i) => (
                        <option key={i} value={i}>{i} godz.</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Minuty (co 5 min):</span>
                    <select
                      value={selectedMinutes}
                      onChange={(e) => setSelectedMinutes(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                        <option key={m} value={m}>{m} min</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SELEKCJA PRACOWNIKÓW */}
              <div className="pt-2 border-t border-slate-700/80">
                <label className="block text-xs text-slate-300 font-medium mb-1.5">Przypisz pracowników:</label>
                <button
                  type="button"
                  onClick={() => {
                    setTempSelectedWorkerIds(finalSelectedWorkerIds)
                    setShowWorkerPicker(!showWorkerPicker)
                  }}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-left text-slate-300 flex items-center justify-between hover:border-slate-600"
                >
                  <span className="flex items-center gap-2">
                    <Users size={16} className="text-blue-400" />
                    {finalSelectedWorkerIds.length > 0
                      ? `Wybrano pracowników (${finalSelectedWorkerIds.length})`
                      : 'Wybierz pracownika (Dowolny pracownik)'}
                  </span>
                  {showWorkerPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showWorkerPicker && (
                  <div className="mt-2 p-3 bg-slate-950 border border-slate-700 rounded-xl space-y-3">
                    <p className="text-[11px] text-slate-400 font-medium">Zalogowani na budowie dzisiaj:</p>
                    {activeWorkers.length === 0 ? (
                      <p className="text-xs text-amber-400 italic">Brak zalogowanych pracowników na tej budowie.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {activeWorkers.map((w) => {
                          const isChecked = tempSelectedWorkerIds.includes(w.id)
                          return (
                            <div
                              key={w.id}
                              onClick={() => toggleTempWorker(w.id)}
                              className={`p-2.5 rounded-lg text-xs flex items-center justify-between cursor-pointer border transition-all ${
                                isChecked
                                  ? 'bg-blue-950/80 border-blue-500 text-blue-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="font-medium">{w.full_name}</span>
                              <input type="checkbox" checked={isChecked} readOnly className="rounded" />
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={cancelWorkerSelection}
                        className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                      >
                        Anuluj
                      </button>
                      <button
                        type="button"
                        onClick={confirmWorkerSelection}
                        className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Zatwierdź
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SELEKCJA DOKUMENTÓW Z PROJEKTU */}
              <div className="pt-2 border-t border-slate-700/80">
                <label className="block text-xs text-slate-300 font-medium mb-1.5">Załącz pliki z dokumentacji:</label>
                <button
                  type="button"
                  onClick={() => {
                    setTempSelectedDocUrls(finalSelectedDocUrls)
                    setShowDocPicker(!showDocPicker)
                  }}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-left text-slate-300 flex items-center justify-between hover:border-slate-600"
                >
                  <span className="flex items-center gap-2">
                    <Paperclip size={16} className="text-purple-400" />
                    {finalSelectedDocUrls.length > 0
                      ? `Załączono pliki (${finalSelectedDocUrls.length})`
                      : 'Załącz plik z dokumentacji'}
                  </span>
                  {showDocPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showDocPicker && (
                  <div className="mt-2 p-3 bg-slate-950 border border-slate-700 rounded-xl space-y-3">
                    <p className="text-[11px] text-slate-400 font-medium">Dokumenty przypisane przez Admina:</p>
                    {documents.length === 0 ? (
                      <p className="text-xs text-amber-400 italic">Brak dokumentów w zakładce Dokumentacja.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {documents.map((doc) => {
                          const isChecked = tempSelectedDocUrls.includes(doc.file_url)
                          return (
                            <div
                              key={doc.id}
                              onClick={() => toggleTempDoc(doc.file_url)}
                              className={`p-2.5 rounded-lg text-xs flex items-center justify-between cursor-pointer border transition-all ${
                                isChecked
                                  ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="truncate pr-2">{doc.folder_name} / {doc.file_name}</span>
                              <input type="checkbox" checked={isChecked} readOnly className="rounded" />
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={cancelDocSelection}
                        className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                      >
                        Anuluj
                      </button>
                      <button
                        type="button"
                        onClick={confirmDocSelection}
                        className="flex-1 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Zatwierdź
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* LOKALNE PLIKI Z PRZYCISKIEM USUWANIA (X) */}
              <div className="pt-2 border-t border-slate-700/80">
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Zrób zdjęcie aparatem lub dodaj plik z urządzenia:
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-3 text-center cursor-pointer hover:border-blue-500 transition-all bg-slate-900">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleLocalFilesChange}
                    className="hidden"
                    id="task-local-file-input"
                  />
                  <label htmlFor="task-local-file-input" className="cursor-pointer flex flex-col items-center gap-1">
                    <Camera size={20} className="text-blue-400" />
                    <span className="text-xs text-slate-300 font-medium">
                      Kliknij, aby zrobić zdjęcie lub wybrać z galerii
                    </span>
                  </label>
                </div>

                {taskLocalFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {taskLocalFiles.map((f, idx) => (
                      <div key={idx} className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs text-slate-300">
                        <span className="truncate flex items-center gap-1.5 font-medium">
                          <ImageIcon size={14} className="text-emerald-400 shrink-0" /> {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLocalFile(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                          title="Usuń plik przed wysłaniem"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg active:scale-98 disabled:opacity-50"
              >
                {loading ? 'ZAPISYWANIE ZADANIA...' : 'DODAJ ZADANIE'}
              </button>
            </form>

            {/* LISTA ZADAŃ */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                LISTA ZADAŃ ({tasks.length})
              </h3>

              {tasks.map((task) => {
                const isExpanded = expandedTaskId === task.id
                const assignedUsers = Array.isArray(task.task_assignments) ? task.task_assignments : []
                const attachmentsList = Array.isArray(task.attachments) ? task.attachments : []
                const taskPhotos = Array.isArray(task.project_photos) ? task.project_photos : []

                const workerNames = assignedUsers
                  .map((ta: any) => ta.profiles?.full_name)
                  .filter(Boolean)

                return (
                  <div
                    key={task.id}
                    className="bg-slate-800 rounded-2xl border border-slate-700/80 overflow-hidden shadow-lg transition-all"
                  >
                    <div
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-4 cursor-pointer hover:bg-slate-750 transition-all space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-base text-white">{task.title}</h4>
                        {getTaskStatusBadge(task)}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-300 line-clamp-2">{task.description}</p>
                      )}

                      <div className="pt-1 flex items-center gap-1.5 text-xs text-blue-300 font-medium truncate">
                        <UserCheck size={14} className="shrink-0 text-blue-400" />
                        <span className="truncate">
                          {workerNames.length > 0
                            ? `Podjęli się: ${workerNames.join(', ')}`
                            : 'Brak przypisanych osób (Do wzięcia)'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-400 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={13} /> Czas: {formatTaskTime(task.estimated_hours)}
                        </span>
                        <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
                          {isExpanded ? 'Zwiń' : 'Rozwiń szczegóły'}
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-slate-900 border-t border-slate-700/80 space-y-4 text-xs">
                        {task.description && (
                          <div>
                            <span className="text-slate-400 block font-semibold mb-0.5">Pełny opis:</span>
                            <p className="text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800">{task.description}</p>
                          </div>
                        )}

                        <div>
                          <span className="text-slate-400 block font-semibold mb-1">Kto podjął się zadania:</span>
                          {assignedUsers.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {assignedUsers.map((ta: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-blue-300 rounded-lg text-xs font-medium flex items-center gap-1"
                                >
                                  <UserCheck size={12} /> {ta.profiles?.full_name || 'Pracownik'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-500 italic">Brak przypisanych osób (Zadanie oczekujące)</p>
                          )}
                        </div>

                        {attachmentsList.length > 0 && (
                          <div>
                            <span className="text-slate-400 block font-semibold mb-1.5">Załączone pliki i dokumenty ({attachmentsList.length}):</span>
                            <div className="space-y-1.5">
                              {attachmentsList.map((url: string, idx: number) => {
                                const filename = url.split('/').pop() || `Załącznik ${idx + 1}`
                                return (
                                  <button
                                    type="button"
                                    key={idx}
                                    onClick={() => setPreviewFile({ title: filename, url })}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 hover:border-purple-500 rounded-xl flex items-center justify-between text-purple-300 transition-all text-left group"
                                  >
                                    <span className="flex items-center gap-2 truncate text-xs font-medium pr-2">
                                      <FileText size={15} className="text-purple-400 shrink-0" />
                                      <span className="truncate">{filename}</span>
                                    </span>
                                    <Eye size={14} className="text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {taskPhotos.length > 0 && (
                          <div>
                            <span className="text-slate-400 block font-semibold mb-1">Zdjęcia z zakończenia pracy:</span>
                            <div className="grid grid-cols-2 gap-2">
                              {taskPhotos.map((p: any) => (
                                <div
                                  key={p.id}
                                  onClick={() => setPreviewFile({ title: p.description || 'Zdjęcie budowy', url: p.photo_url })}
                                  className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 cursor-pointer hover:border-blue-500 transition-all"
                                >
                                  <img
                                    src={p.photo_url}
                                    alt="Zdjęcie"
                                    className="w-full h-24 object-cover rounded-md mb-1"
                                  />
                                  <p className="text-[10px] text-slate-400 truncate">{p.description || 'Kliknij, aby powiększyć'}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleSetTaskStatus(task.id, 'done')}
                              disabled={loading}
                              className="py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98"
                            >
                              <CheckCircle2 size={16} /> Potwierdź
                            </button>

                            <button
                              onClick={() => handleSetTaskStatus(task.id, 'needs_fix')}
                              disabled={loading}
                              className="py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98"
                            >
                              <XCircle size={16} /> Do poprawy
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={loading}
                            className="w-full py-2 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Trash2 size={14} /> Usuń zadanie
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ZAKŁADKA 2: DOKUMENTACJA & ZDJĘCIA */}
        {activeTab === 'documentation' && (
          <div className="space-y-6">
            {/* SEKCJA 1: DOKUMENTACJA PRZEDWYKONAWCZA (ADMIN) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <FolderKanban size={16} /> 1. Dokumentacja Przedwykonawcza (Admin)
              </h3>

              {Object.keys(groupedAdminDocuments).length === 0 ? (
                <div className="bg-slate-800/50 p-5 rounded-xl text-center text-slate-500 text-xs border border-slate-800">
                  Admin nie wgrał jeszcze dokumentacji dla tej budowy.
                </div>
              ) : (
                Object.keys(groupedAdminDocuments).map((folderName) => (
                  <div key={folderName} className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-purple-300 flex items-center gap-2">
                      📁 Folder: {folderName}
                    </h4>
                    <div className="space-y-1.5 pt-1">
                      {groupedAdminDocuments[folderName].map((doc: any) => (
                        <div
                          key={doc.id}
                          onClick={() => setPreviewFile({ title: doc.file_name, url: doc.file_url })}
                          className="p-2.5 bg-slate-900 hover:bg-slate-950 rounded-lg border border-slate-700/80 flex items-center justify-between text-xs text-slate-200 cursor-pointer transition-all"
                        >
                          <span className="truncate flex items-center gap-2 font-medium">
                            <FileText size={15} className="text-purple-400 shrink-0" /> {doc.file_name}
                          </span>
                          <Eye size={14} className="text-purple-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* SEKCJA 2: DOKUMENTACJA W TRAKCIE BUDOWY */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Camera size={16} /> 2. Dokumentacja w Trakcie Budowy (Pliki Brygadzisty)
              </h3>

              <div className="flex gap-2 overflow-x-auto pb-1 items-center">
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 border transition-all ${
                    selectedFolderId === null
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Folder size={14} /> Wszystkie pliki
                </button>

                {foremanFolders.map((f) => (
                  <div key={f.id} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs shrink-0">
                    <button
                      onClick={() => setSelectedFolderId(f.id)}
                      className={`font-semibold flex items-center gap-1.5 ${
                        selectedFolderId === f.id ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      <Folder size={14} /> {f.name}
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(f.id)}
                      className="text-slate-500 hover:text-rose-400 ml-1 p-0.5"
                      title="Usuń folder"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1 shrink-0 transition-all"
                  title="Stwórz nowy folder"
                >
                  <FolderPlus size={15} /> + Nowy folder
                </button>
              </div>

              {showNewFolderInput && (
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                  <input
                    type="text"
                    placeholder="Wpisz nazwę nowego folderu..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNewFolderInput(false)}
                      className="flex-1 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg font-medium"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handleCreateFolder}
                      className="flex-1 py-1.5 bg-emerald-600 text-white text-xs rounded-lg font-bold"
                    >
                      Zapisz folder
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {foremanFilesList.length === 0 ? (
                  <div className="col-span-2 p-4 bg-slate-950/50 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                    Brak plików w tym folderze. Dodaj pierwszy plik poniżej!
                  </div>
                ) : (
                  foremanFilesList.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-800 rounded-xl p-2 border border-slate-700 text-xs flex flex-col justify-between relative group"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteSiteFile(p.id)}
                        className="absolute top-3 right-3 z-10 p-1.5 bg-rose-600/90 text-white rounded-lg shadow-lg hover:bg-rose-700 transition-all"
                        title="Usuń plik"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div
                        onClick={() => setPreviewFile({ title: p.description || 'Plik budowy', url: p.photo_url })}
                        className="cursor-pointer space-y-1.5"
                      >
                        {isImageUrl(p.photo_url) ? (
                          <img
                            src={p.photo_url}
                            alt={p.description || 'Zdjęcie'}
                            className="w-full h-28 object-cover rounded-lg bg-slate-900"
                          />
                        ) : (
                          <div className="w-full h-28 bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center justify-center p-2 text-purple-400">
                            <FileText size={32} />
                            <span className="text-[10px] text-slate-400 mt-1 truncate max-w-full">Dokument / Plik</span>
                          </div>
                        )}
                        <p className="text-slate-300 truncate font-medium pt-0.5">{p.description || 'Plik'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleUploadSiteFile} className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 mt-4">
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Plus size={15} /> Dodaj plik / zdjęcie do tej sekcji
                </p>

                {!selectedSiteFile ? (
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-3.5 text-center cursor-pointer hover:border-emerald-500 transition-all bg-slate-900">
                    <input
                      type="file"
                      accept="image/*,application/pdf,.dwg,.txt,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => setSelectedSiteFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="site-file-upload-input"
                    />
                    <label htmlFor="site-file-upload-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <Upload size={22} className="text-emerald-400" />
                      <span className="text-xs text-slate-300 font-medium">
                        Zrób zdjęcie lub dodaj plik (.png, .jpg, .pdf, DWG)
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-950 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-slate-200">
                    <span className="truncate flex items-center gap-2 font-medium text-emerald-300">
                      <ImageIcon size={16} /> {selectedSiteFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSiteFile(null)}
                      className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Usuń plik przed wgrywaniem"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Opis pliku / zdjęcia..."
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />

                <button
                  type="submit"
                  disabled={loading || !selectedSiteFile}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all disabled:opacity-50"
                >
                  DODAJ PLIK DO {selectedFolderId ? 'WYBRANEGO FOLDERU' : 'DOKUMENTACJI'}
                </button>
              </form>
            </div>

            {/* SEKCJA 3: DOKUMENTACJA PRACOWNIKÓW */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Users size={16} /> 3. Dokumentacja Pracowników (Foldery Pracowników)
              </h3>

              {Object.keys(groupedWorkerPhotos).length === 0 ? (
                <div className="bg-slate-800/50 p-5 rounded-xl text-center text-slate-500 text-xs border border-slate-800">
                  Pracownicy nie wrzucili jeszcze zdjęć z wykonanych zadań.
                </div>
              ) : (
                Object.keys(groupedWorkerPhotos).map((workerName) => (
                  <div key={workerName} className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-300 flex items-center gap-2">
                      👤 Pracownik: {workerName} ({groupedWorkerPhotos[workerName].length})
                    </h4>

                    <div className="grid grid-cols-2 gap-2.5">
                      {groupedWorkerPhotos[workerName].map((photo: any) => (
                        <div
                          key={photo.id}
                          className="bg-slate-900 p-2 rounded-xl border border-slate-800 relative space-y-1"
                        >
                          <button
                            type="button"
                            onClick={() => handleDeleteSiteFile(photo.id)}
                            className="absolute top-3 right-3 z-10 p-1.5 bg-rose-600/90 text-white rounded-lg shadow-lg"
                            title="Usuń plik z budowy"
                          >
                            <Trash2 size={13} />
                          </button>

                          <div
                            onClick={() => setPreviewFile({ title: photo.description || `Zdjęcie: ${workerName}`, url: photo.photo_url })}
                            className="cursor-pointer"
                          >
                            <img
                              src={photo.photo_url}
                              alt="Zdjęcie pracownika"
                              className="w-full h-24 object-cover rounded-lg mb-1"
                            />
                            <p className="text-[10px] text-slate-300 truncate font-medium">{photo.description || 'Zdjęcie z zadania'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ZAKŁADKA 3: MATERIAŁY */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateMaterialRequest} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-3.5 shadow-xl">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Plus size={18} /> Zapotrzebowanie na Materiał
              </h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nazwa materiału / sprzętu:</label>
                <input
                  type="text"
                  required
                  placeholder="np. Kołki szybkiego montażu 6x60"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Ilość z jednostką:</label>
                <input
                  type="text"
                  required
                  placeholder="np. 100 szt / 200 mb / 2 paczki"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Przeznaczenie (Po co? Do jakiego zadania?):</label>
                <textarea
                  required
                  placeholder="np. Do zamontowania korytek w hali A"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Miejsce dostawy:</label>
                  <input
                    type="text"
                    placeholder="Paczkomat / Budowa"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Odbiorca (Imię i Nazwisko):</label>
                  <input
                    type="text"
                    placeholder="Nazwisko do odbioru"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Zdjęcie poglądowe (np. takie jak na zdjęciu):
                </label>
                
                {!materialPhotoFile ? (
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-2.5 text-center cursor-pointer hover:border-amber-500 transition-all bg-slate-900">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setMaterialPhotoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="material-photo-input"
                    />
                    <label htmlFor="material-photo-input" className="cursor-pointer flex flex-col items-center gap-1">
                      <Camera size={18} className="text-amber-400" />
                      <span className="text-[11px] text-slate-300 font-medium">
                        Kliknij, aby wybrać zdjęcie poglądowe
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="p-2 bg-slate-950 border border-amber-500/50 rounded-xl flex items-center justify-between text-xs text-slate-200">
                    <span className="truncate flex items-center gap-1.5 font-medium text-amber-300">
                      <ImageIcon size={15} /> {materialPhotoFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMaterialPhotoFile(null)}
                      className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Usuń wybrane zdjęcie"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-lg active:scale-98"
              >
                ZAMÓW MATERIAŁ
              </button>
            </form>

            {/* LISTA ZAMÓWIEŃ MATERIAŁOWYCH */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lista Zamówień Materiałowych ({materialRequests.length})
              </h3>

              {materialRequests.map((mat) => {
                const isPending = mat.status === 'oczekujace' || mat.status === 'requested'

                return (
                  <div key={mat.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3 shadow-lg relative">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterialRequest(mat.id, mat.status)}
                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-all"
                        title="Usuń nieprzetworzone zamówienie"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="flex justify-between items-start gap-2 pr-6">
                      <div>
                        <h4 className="font-bold text-sm text-white">{mat.item_name}</h4>
                        <p className="text-xs text-amber-400 font-semibold">Ilość: {mat.quantity_with_unit}</p>
                      </div>
                      {getMaterialStatusBadge(mat.status)}
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <strong>Przeznaczenie:</strong> {mat.purpose}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-amber-400 shrink-0" />
                        <span className="truncate">
                          {isPending
                            ? (mat.pickup_location || 'Budowa')
                            : (mat.delivery_address || mat.pickup_location || 'Budowa')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-blue-400 shrink-0" />
                        <span className="truncate">
                          {isPending
                            ? (mat.recipient_name || 'Brak odbiorcy')
                            : (mat.recipient_name || 'Odbiorca ustawiony przez Admina')}
                        </span>
                      </div>
                    </div>

                    {!isPending && mat.estimated_delivery_date && (
                      <div className="p-2.5 bg-blue-950/80 border border-blue-500/50 rounded-xl text-xs text-blue-200 flex items-center gap-2 shadow-inner">
                        <Calendar size={15} className="text-blue-400 shrink-0" />
                        <span>
                          Przewidywana data dostawy: <strong>{mat.estimated_delivery_date}</strong>
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {mat.photo_url && (
                        <div
                          onClick={() => setPreviewFile({ title: `Zdjęcie poglądowe: ${mat.item_name}`, url: mat.photo_url })}
                          className="p-1.5 bg-slate-900 rounded-xl border border-slate-700 text-center cursor-pointer hover:border-amber-500 transition-all"
                        >
                          <img src={mat.photo_url} alt="Poglądowe" className="w-full h-16 object-cover rounded-lg mb-1" />
                          <span className="text-[10px] text-amber-300 font-semibold block truncate">Zdjęcie zamówienia</span>
                        </div>
                      )}

                      {mat.admin_photo_url && (
                        <div
                          onClick={() => setPreviewFile({ title: `Kod QR / Potwierdzenie dostawy`, url: mat.admin_photo_url })}
                          className="p-1.5 bg-purple-950/80 rounded-xl border border-purple-500/50 text-center cursor-pointer hover:border-purple-400 transition-all"
                        >
                          <img src={mat.admin_photo_url} alt="QR kod" className="w-full h-16 object-cover rounded-lg mb-1" />
                          <span className="text-[10px] text-purple-300 font-semibold flex items-center justify-center gap-1 truncate">
                            <QrCode size={11} /> Kod QR / Odbiór
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL PODGLĄDU PLIKU / ZDJĘCIA */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between max-h-[80vh] my-auto">
            <div className="p-3.5 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h4 className="text-xs font-bold text-white truncate pr-2">{previewFile.title}</h4>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 text-slate-400 hover:text-white bg-slate-700 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center overflow-auto max-h-[50vh] bg-slate-950">
              {isImageUrl(previewFile.url) ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.title}
                  className="max-w-full max-h-[45vh] object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <FileText size={48} className="text-purple-400 mx-auto animate-bounce" />
                  <p className="text-xs text-slate-300">Dokument / Plik w chmurze</p>
                </div>
              )}
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
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink size={14} /> Otwórz plik
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}