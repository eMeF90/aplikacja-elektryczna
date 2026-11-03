'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  FileText,
  ShoppingBag,
  Settings,
  Shield,
  TrendingUp,
  Clock,
  Search,
  Plus,
  Edit3,
  Folder,
  File,
  Calendar,
  Truck,
  UserCheck,
  HardHat,
  DollarSign,
  Bell,
  Eye,
  Check,
  X,
  Upload,
  BarChart2,
  Menu,
  ChevronRight,
  Megaphone,
  Trash2,
  FolderPlus,
  Camera,
  QrCode,
  LogOut,
  Coffee,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()

  // Główne nawigacje i szuflady (Drawers)
  const [activeTab, setActiveTab] = useState<'company' | 'inwestycje' | 'admin_office' | 'workers' | 'orders' | 'settings'>('company')
  const [isMainSidebarOpen, setIsMainSidebarOpen] = useState(false)
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false)
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false)

  // Gest Swipe - Działa na całym ekranie
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  // Ustawienia Firmy & Admina
  const [company, setCompany] = useState({
    name: 'BUILD-CORP CONSTRUCTIONS Sp. z o.o.',
    nip: '5213894012',
    regon: '381920491',
    krs: '0000789123',
    address: 'ul. Budowlanych 45A, 02-678 Warszawa',
    phone: '+48 22 849 20 10',
    email: 'kontakt@buildcorp.pl',
    logo_url: '',
  })

  // Dane z Supabase
  const [projects, setProjects] = useState<any[]>([])
  const [newsList, setNewsList] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 1. Aktualności
  const [newNewsTitle, setNewNewsTitle] = useState('')
  const [newNewsContent, setNewNewsContent] = useState('')
  const [showAddNewsModal, setShowAddNewsModal] = useState(false)

  // 2. Inwestycje (Nowa budowa + Wyszukiwanie)
  const [projectSearchTerm, setProjectSearchTerm] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [inwestycjeSubTab, setInwestycjeSubTab] = useState<'valuations' | 'docs' | 'stats'>('docs')

  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [newProjTitle, setNewProjTitle] = useState('')
  const [newProjLocation, setNewProjLocation] = useState('')
  const [newProjBudget, setNewProjBudget] = useState('500000')

  // Pliki i Podfoldery w Inwestycjach
  const [projectFolders, setProjectFolders] = useState<{ [projId: string]: any[] }>({})
  const [newFolderName, setNewFolderName] = useState('')
  const [newProjectFile, setNewProjectFile] = useState<File | null>(null)

  // 3. Administracja (Wysuwany Panel jak w Inwestycjach)
  const [adminSearchTerm, setAdminSearchTerm] = useState('')
  const [adminCategories, setAdminCategories] = useState<string[]>(['Umowy i Leasingi', 'Dokumentacja BHP', 'Flota Samochodowa'])
  const [selectedAdminCategory, setSelectedAdminCategory] = useState<string>('Umowy i Leasingi')
  const [showAddAdminCatModal, setShowAddAdminCatModal] = useState(false)
  const [newAdminCatTitle, setNewAdminCatTitle] = useState('')

  // Pliki i Podfoldery w Administracji
  const [adminCatFiles, setAdminCatFiles] = useState<{ [catName: string]: any[] }>({})
  const [newAdminSubfolderName, setNewAdminSubfolderName] = useState('')

  // 4. Pracownicy (Naprawiony Panel & Modal Szczegółów)
  const [selectedWorker, setSelectedWorker] = useState<any>(null)
  const [editingWorkerRate, setEditingWorkerRate] = useState('')
  const [editingWorkerAllowance, setEditingWorkerAllowance] = useState('')
  const [editingWorkerPhone, setEditingWorkerPhone] = useState('')

  // 5. Zamówienia Materiałów (Dostawa + Zdjęcia + Tworzenie Własnego Zamówienia)
  const [selectedOrderModal, setSelectedOrderModal] = useState<any>(null)
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('')
  const [orderDeliveryPlace, setOrderDeliveryPlace] = useState('')
  const [orderDeliveryRecipient, setOrderDeliveryRecipient] = useState('')
  const [orderDeliveryCarrier, setOrderDeliveryCarrier] = useState('')
  const [orderDeliveryPhotos, setOrderDeliveryPhotos] = useState<File[]>([])

  // Tworzenie Własnego Zamówienia przez Admina
  const [showCreateAdminOrderModal, setShowCreateAdminOrderModal] = useState(false)
  const [adminOrderProjId, setAdminOrderProjId] = useState('')
  const [adminOrderItemName, setAdminOrderItemName] = useState('')
  const [adminOrderQuantity, setAdminOrderQuantity] = useState('')
  const [adminOrderLocation, setAdminOrderLocation] = useState('')
  const [adminOrderNotes, setAdminOrderNotes] = useState('')
  const [adminOrderPhotos, setAdminOrderPhotos] = useState<File[]>([])

  // Podgląd Plików / Lightbox
  const [previewFile, setPreviewFile] = useState<{ title: string; url: string } | null>(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  // Przeciągnięcie palcem (Swipe) z lewej do prawej otwiera menu na CAŁYM ekranie
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = touchEndX.current - touchStartX.current
    if (touchStartX.current < 80 && diffX > 60) {
      e.preventDefault()
      setIsMainSidebarOpen(true)
    } else if (isMainSidebarOpen && diffX < -60) {
      e.preventDefault()
      setIsMainSidebarOpen(false)
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // 1. Ustawienia
      const { data: compData } = await supabase.from('company_settings').select('*').eq('id', 1).maybeSingle()
      if (compData) {
        setCompany({
          name: compData.name || 'BUILD-CORP CONSTRUCTIONS Sp. z o.o.',
          nip: compData.nip || '',
          regon: compData.regon || '',
          krs: compData.krs || '',
          address: compData.address || '',
          phone: compData.phone || '',
          email: compData.email || '',
          logo_url: compData.logo_url || '',
        })
      }

      // 2. Aktualności
      const { data: newsData } = await supabase.from('company_news').select('*').order('created_at', { ascending: false })
      if (newsData) setNewsList(newsData)

      // 3. Inwestycje
      const { data: projData } = await supabase.from('projects').select('*').order('title', { ascending: true })
      if (projData && projData.length > 0) {
        setProjects(projData)
        if (!selectedProjectId) setSelectedProjectId(projData[0].id)
      }

      // 4. Czas Pracy & Pracownicy
      const { data: profData } = await supabase.from('profiles').select('*')
      const { data: logsData } = await supabase.from('time_logs').select('*, projects(title)').order('start_time', { ascending: false })
      if (logsData) setTimeLogs(logsData)

      const { data: vacationData } = await supabase.from('vacation_requests').select('*, profiles(full_name)').order('created_at', { ascending: false })
      if (vacationData) setLeaveRequests(vacationData)

      const todayStr = new Date().toISOString().split('T')[0]

      if (profData) {
        const mappedWorkers = profData.map((worker) => {
          const openLog = logsData?.find((l) => l.user_id === worker.id && !l.end_time)
          const activeVacation = vacationData?.find((v) => {
            return v.user_id === worker.id && v.status === 'approved' && todayStr >= v.start_date && todayStr <= v.end_date
          })

          let status: 'working' | 'absent' | 'l4' | 'vacation' = 'absent'
          if (openLog) status = 'working'
          else if (activeVacation) status = activeVacation.type === 'L4' ? 'l4' : 'vacation'

          return {
            ...worker,
            status,
            activeLog: openLog || null,
          }
        })
        setWorkers(mappedWorkers)
      }

      // 5. Zamówienia Materiałów
      const { data: ordData } = await supabase
        .from('material_requests')
        .select('*, projects(title), profiles(full_name)')
        .order('created_at', { ascending: false })

      if (ordData) setOrders(ordData)
    } catch (err: any) {
      console.error('Błąd ładowania danych administratora:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- ZARZĄDZANIE INWESTYCJAMI ---
  const handleCreateProjectSubmit = async () => {
    if (!newProjTitle) return
    setLoading(true)

    try {
      const { data, error } = await supabase.from('projects').insert({
        title: newProjTitle,
        location: newProjLocation,
        budget_total: Number(newProjBudget) || 500000,
        status: 'w_toku',
      }).select().single()

      if (!error && data) {
        alert('Dodano nową budowę!')
        setShowAddProjectModal(false)
        setNewProjTitle('')
        setNewProjLocation('')
        fetchAdminData()
        setSelectedProjectId(data.id)
      }
    } catch (err: any) {
      alert('Błąd tworzenia budowy: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title, 'pl'))
  }, [projects, projectSearchTerm])

  const selectedProjectObj = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0]
  }, [projects, selectedProjectId])

  const handleAddProjectFolder = () => {
    if (!newFolderName || !selectedProjectId) return
    const folderItem = { id: Date.now().toString(), name: newFolderName, isFolder: true, files: [] }
    setProjectFolders((prev) => ({
      ...prev,
      [selectedProjectId]: [...(prev[selectedProjectId] || []), folderItem],
    }))
    setNewFolderName('')
  }

  const handleDeleteProjectFolder = (folderId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten folder i jego zawartość?')) {
      setProjectFolders((prev) => ({
        ...prev,
        [selectedProjectId]: (prev[selectedProjectId] || []).filter((f) => f.id !== folderId),
      }))
    }
  }

  // --- ZARZĄDZANIE ADMINISTRACJĄ (DRAWER & PLIKI) ---
  const filteredAdminCategories = useMemo(() => {
    return adminCategories.filter((cat) => cat.toLowerCase().includes(adminSearchTerm.toLowerCase()))
  }, [adminCategories, adminSearchTerm])

  const handleAddAdminCategory = () => {
    if (!newAdminCatTitle) return
    if (!adminCategories.includes(newAdminCatTitle)) {
      setAdminCategories((prev) => [...prev, newAdminCatTitle])
      setSelectedAdminCategory(newAdminCatTitle)
    }
    setNewAdminCatTitle('')
    setShowAddAdminCatModal(false)
  }

  const handleDeleteAdminCategory = (catToDelete: string) => {
    if (window.confirm(`Czy na pewno chcesz usunąć kategorię "${catToDelete}"?`)) {
      setAdminCategories((prev) => prev.filter((c) => c !== catToDelete))
      if (selectedAdminCategory === catToDelete) {
        setSelectedAdminCategory(adminCategories[0] || '')
      }
    }
  }

  const handleAddAdminSubfolder = () => {
    if (!newAdminSubfolderName || !selectedAdminCategory) return
    const newItem = { id: Date.now().toString(), name: newAdminSubfolderName, isFolder: true }
    setAdminCatFiles((prev) => ({
      ...prev,
      [selectedAdminCategory]: [...(prev[selectedAdminCategory] || []), newItem],
    }))
    setNewAdminSubfolderName('')
  }

  const handleDeleteAdminItem = (itemId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten plik/folder?')) {
      setAdminCatFiles((prev) => ({
        ...prev,
        [selectedAdminCategory]: (prev[selectedAdminCategory] || []).filter((item) => item.id !== itemId),
      }))
    }
  }

  // --- ZARZĄDZANIE PRACOWNIKAMI ---
  const handleOpenWorkerModal = (worker: any) => {
    setSelectedWorker(worker)
    setEditingWorkerRate(worker.hourly_rate || '35')
    setEditingWorkerAllowance(worker.daily_allowance || '0')
    setEditingWorkerPhone(worker.phone || '')
  }

  const handleSaveWorkerChanges = async () => {
    if (!selectedWorker) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          hourly_rate: Number(editingWorkerRate),
          daily_allowance: Number(editingWorkerAllowance),
          phone: editingWorkerPhone,
        })
        .eq('id', selectedWorker.id)

      if (!error) {
        alert('Zapisano zmienione dane pracownika!')
        setSelectedWorker(null)
        fetchAdminData()
      }
    } catch (err: any) {
      alert('Błąd zapisu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveDecision = async (reqId: string, newStatus: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('vacation_requests')
        .update({ status: newStatus === 'Zatwierdzony' ? 'approved' : 'rejected' })
        .eq('id', reqId)

      if (!error) fetchAdminData()
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- ZARZĄDZANIE ZAMÓWIENIAMI MATERIAŁÓW ---
  const handleApproveOrderModal = (order: any) => {
    setSelectedOrderModal(order)
    setOrderDeliveryDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0])
    setOrderDeliveryPlace(order.projects?.title || 'Plac budowy')
    setOrderDeliveryRecipient(order.profiles?.full_name || 'Brygadzista')
    setOrderDeliveryCarrier('Hurtownia Budowlana Express')
    setOrderDeliveryPhotos([])
  }

  const handleSaveOrderApprovalSubmit = async () => {
    if (!selectedOrderModal) return
    setLoading(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of orderDeliveryPhotos) {
        const fileExt = file.name.split('.').pop()
        const fileName = `delivery-docs/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`

        const { error: uploadErr } = await supabase.storage.from('project-photos').upload(fileName, file)
        if (!uploadErr) {
          const { data } = supabase.storage.from('project-photos').getPublicUrl(fileName)
          if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
        }
      }

      const { error } = await supabase
        .from('material_requests')
        .update({
          status: 'Potwierdzone',
          delivery_details: {
            date: orderDeliveryDate,
            place: orderDeliveryPlace,
            recipient: orderDeliveryRecipient,
            carrier: orderDeliveryCarrier,
          },
          attachments: uploadedUrls,
        })
        .eq('id', selectedOrderModal.id)

      if (!error) {
        alert('Zamówienie zostało potwierdzone i przekazane do realizacji!')
        setSelectedOrderModal(null)
        fetchAdminData()
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectOrder = async (orderId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('material_requests').update({ status: 'Odrzucone' }).eq('id', orderId)
      if (!error) fetchAdminData()
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdminOrderSubmit = async () => {
    if (!adminOrderItemName || !adminOrderProjId) {
      alert('Wybierz budowę i wpisz nazwę materiału!')
      return
    }
    setLoading(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of adminOrderPhotos) {
        const fileExt = file.name.split('.').pop()
        const fileName = `admin-orders/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`

        const { error: uploadErr } = await supabase.storage.from('project-photos').upload(fileName, file)
        if (!uploadErr) {
          const { data } = supabase.storage.from('project-photos').getPublicUrl(fileName)
          if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
        }
      }

      const { error } = await supabase.from('material_requests').insert({
        project_id: adminOrderProjId,
        item_name: adminOrderItemName,
        quantity: adminOrderQuantity,
        notes: `Miejsce dostawy: ${adminOrderLocation} | ${adminOrderNotes}`,
        status: 'pending',
        attachments: uploadedUrls,
      })

      if (!error) {
        alert('Utworzono zamówienie materiałów!')
        setShowCreateAdminOrderModal(false)
        setAdminOrderItemName('')
        setAdminOrderQuantity('')
        setAdminOrderPhotos([])
        fetchAdminData()
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

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehaviorX: 'none', touchAction: 'pan-y' }}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-x-hidden select-none"
    >
      {/* Pasek wspierający gest Swipe przy lewej krawędzi */}
      <div
        onClick={() => setIsMainSidebarOpen(true)}
        className="fixed top-0 left-0 bottom-0 w-3 z-40 bg-amber-500/20 hover:bg-amber-500/50 transition-all cursor-pointer"
        title="Przesuń w prawo, aby otworzyć menu główne"
      />

      {isMainSidebarOpen && (
        <div onClick={() => setIsMainSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity" />
      )}

      {/* GŁÓWNY PASEK BOCZNY */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 p-4 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isMainSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              {company.logo_url ? (
                <img src={company.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-slate-950 text-base">
                  BC
                </div>
              )}
              <div className="overflow-hidden">
                <h1 className="font-bold text-slate-100 text-xs tracking-wide truncate" title={company.name}>
                  {company.name}
                </h1>
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <Shield size={12} /> Panel Admina
                </span>
              </div>
            </div>
            <button onClick={() => setIsMainSidebarOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('company')
                setIsMainSidebarOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'company' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 size={16} />
                <span>1. {company.name.substring(0, 15)}...</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('inwestycje')
                setIsMainSidebarOpen(false)
                setIsProjectDrawerOpen(true)
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'inwestycje' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardHat size={16} />
                <span>2. INWESTYCJE</span>
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('admin_office')
                setIsMainSidebarOpen(false)
                setIsAdminDrawerOpen(true)
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'admin_office' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} />
                <span>3. ADMINISTRACJA</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('workers')
                setIsMainSidebarOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'workers' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} />
                <span>4. PRACOWNICI</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders')
                setIsMainSidebarOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'orders' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={16} />
                <span>5. ZAMÓWIENIA</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="space-y-1 pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              setActiveTab('settings')
              setIsMainSidebarOpen(false)
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'settings' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Settings size={16} />
            <span>6. USTAWIENIA</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-all"
          >
            <LogOut size={16} />
            <span>Wyloguj</span>
          </button>
        </div>
      </aside>

      {/* OBSZAR TREŚCI */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMainSidebarOpen(true)}
              className="p-2 bg-slate-800 text-amber-400 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-bold"
            >
              <Menu size={16} /> Menu
            </button>

            <h2 className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-none">
              {activeTab === 'company' && company.name}
              {activeTab === 'inwestycje' && (selectedProjectObj?.title || 'Inwestycje')}
              {activeTab === 'admin_office' && selectedAdminCategory}
              {activeTab === 'workers' && '4. Pracownicy'}
              {activeTab === 'orders' && '5. Zamówienia Materiałów'}
              {activeTab === 'settings' && '6. Ustawienia'}
            </h2>
          </div>

          {activeTab === 'inwestycje' && (
            <button
              onClick={() => setIsProjectDrawerOpen(true)}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md"
            >
              Zmień Budowę
            </button>
          )}

          {activeTab === 'admin_office' && (
            <button
              onClick={() => setIsAdminDrawerOpen(true)}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md"
            >
              Zmień Kategorię
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* TAB 1: FIRMA */}
          {activeTab === 'company' && (
            <div className="space-y-5">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">PROFIL FIRMY</span>
                  <h1 className="text-xl font-black text-white">{company.name}</h1>
                  <p className="text-xs text-slate-400 mt-0.5">{company.address}</p>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-xs text-white flex items-center gap-2">
                    <Megaphone className="text-amber-400" size={16} /> Aktualności Firmowe
                  </h3>
                  <button
                    onClick={() => setShowAddNewsModal(true)}
                    className="px-2.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1"
                  >
                    <Plus size={14} /> Dodaj
                  </button>
                </div>

                {newsList.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <h4 className="font-bold text-xs text-amber-300">{item.title}</h4>
                    <p className="text-xs text-slate-300">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: INWESTYCJE */}
          {activeTab === 'inwestycje' && (
            <div className="space-y-5">
              {selectedProjectObj && (
                <div className="space-y-4">
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl text-center space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">WYBRANA INWESTYCJA</span>
                      <h2 className="text-lg md:text-xl font-black text-white mt-0.5">{selectedProjectObj.title}</h2>
                      <p className="text-xs text-slate-400">{selectedProjectObj.location || 'Brak lokalizacji'}</p>
                    </div>

                    <div className="flex justify-center pt-1">
                      <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs w-full max-w-md">
                        <button
                          onClick={() => setInwestycjeSubTab('valuations')}
                          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all text-center ${
                            inwestycjeSubTab === 'valuations' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
                          }`}
                        >
                          1. Wyceny i kosztorysy
                        </button>
                        <button
                          onClick={() => setInwestycjeSubTab('docs')}
                          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all text-center ${
                            inwestycjeSubTab === 'docs' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
                          }`}
                        >
                          2. Dokumentacja
                        </button>
                        <button
                          onClick={() => setInwestycjeSubTab('stats')}
                          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all text-center ${
                            inwestycjeSubTab === 'stats' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
                          }`}
                        >
                          3. Statystyki
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* FOLDERY I PLIKI W INWESTYCJACH */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <FolderPlus className="text-amber-400" size={16} /> Zarządzanie Folderami Budowy
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nazwa nowego folderu..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                        />
                        <button onClick={handleAddProjectFolder} className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
                          Dodaj Folder
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                      {(projectFolders[selectedProjectId] || []).map((folder) => (
                        <div key={folder.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200">
                          <span className="flex items-center gap-2 truncate font-semibold">
                            <Folder className="text-amber-400" size={16} /> {folder.name}
                          </span>
                          <button onClick={() => handleDeleteProjectFolder(folder.id)} className="p-1 text-slate-500 hover:text-rose-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADMINISTRACJA (DRAWER Z KATEGORIAMI) */}
          {activeTab === 'admin_office' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-xs text-white flex items-center gap-2">
                    <Folder className="text-amber-400" size={16} /> Kategoria: <span className="text-amber-400">{selectedAdminCategory}</span>
                  </h3>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nazwa podfolderu..."
                      value={newAdminSubfolderName}
                      onChange={(e) => setNewAdminSubfolderName(e.target.value)}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                    <button onClick={handleAddAdminSubfolder} className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
                      + Dodaj Podfolder
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(adminCatFiles[selectedAdminCategory] || []).map((item) => (
                    <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200">
                      <span className="flex items-center gap-2 font-semibold">
                        <Folder className="text-amber-400" size={16} /> {item.name}
                      </span>
                      <button onClick={() => handleDeleteAdminItem(item.id)} className="p-1 text-slate-500 hover:text-rose-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRACOWNICI (NAPRAWIONY PANEL) */}
          {activeTab === 'workers' && (
            <div className="space-y-5">
              {/* WNIOSKI URLOPOWE */}
              {leaveRequests.filter((l) => l.status === 'pending').length > 0 && (
                <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs text-amber-300">Oczekujące Wnioski Urlopowe</h4>
                  {leaveRequests
                    .filter((l) => l.status === 'pending')
                    .map((req) => (
                      <div key={req.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{req.profiles?.full_name}</p>
                          <p className="text-slate-400">{req.type} ({req.start_date} - {req.end_date})</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleLeaveDecision(req.id, 'Zatwierdzony')} className="p-2 bg-emerald-600 text-white rounded-lg">
                            <Check size={14} />
                          </button>
                          <button onClick={() => handleLeaveDecision(req.id, 'Odrzucony')} className="p-2 bg-rose-600 text-white rounded-lg">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* LISTA PRACOWNIKÓW */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-300">
                  Lista Wszystkich Pracowników ({workers.length})
                </div>

                <div className="divide-y divide-slate-800">
                  {workers.map((w) => {
                    let statusBadge = <span className="text-rose-400">Nieaktywny</span>
                    if (w.status === 'working') statusBadge = <span className="text-emerald-400 font-bold">🟢 ZALOGOWANY</span>
                    else if (w.status === 'l4') statusBadge = <span className="text-blue-400 font-bold">🔵 L4 (Chorobowe)</span>
                    else if (w.status === 'vacation') statusBadge = <span className="text-slate-400 font-bold">⚪ Urlop (UW)</span>

                    return (
                      <div key={w.id} onClick={() => handleOpenWorkerModal(w)} className="p-4 hover:bg-slate-850 cursor-pointer flex justify-between items-center transition-all">
                        <div>
                          <h4 className="font-bold text-sm text-white">{w.full_name}</h4>
                          <p className="text-xs text-slate-400">{w.role === 'foreman' ? 'Brygadzista' : 'Pracownik'}</p>
                        </div>
                        <div className="text-right text-xs">
                          {statusBadge}
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">{w.hourly_rate || 35} PLN/h</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ZAMÓWIENIA MATERIAŁÓW */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ZAMÓWIENIA MATERIAŁÓW ({orders.length})
                </h3>
                <button
                  onClick={() => setShowCreateAdminOrderModal(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Plus size={16} /> Dodaj Własne Zamówienie
                </button>
              </div>

              <div className="space-y-3">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{ord.item_name}</h4>
                        <p className="text-xs text-blue-400 font-semibold">{ord.projects?.title || 'Budowa'}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-[10px] font-bold">
                        {ord.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">Ilość: {ord.quantity || 'Nieokreślono'}</p>
                    {ord.notes && <p className="text-xs text-slate-500">{ord.notes}</p>}

                    {/* FOTOGRAFIE LUB QR KODY */}
                    {Array.isArray(ord.attachments) && ord.attachments.length > 0 && (
                      <div className="flex gap-2 pt-2">
                        {ord.attachments.map((url: string, idx: number) => (
                          <img
                            key={idx}
                            src={url}
                            alt="Załącznik"
                            onClick={() => setPreviewFile({ title: ord.item_name, url })}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-800 cursor-pointer"
                          />
                        ))}
                      </div>
                    )}

                    {ord.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleApproveOrderModal(ord)}
                          className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
                        >
                          Zatwierdź & Dostawa
                        </button>
                        <button
                          onClick={() => handleRejectOrder(ord.id)}
                          className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs shadow-md"
                        >
                          Odrzuć
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: USTAWIENIA */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveCompanySettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl">
              <h3 className="font-bold text-xs text-white border-b border-slate-800 pb-3">Ustawienia Nazwy Firmy i Admina</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Pełna Nazwa Firmy:</label>
                  <input
                    type="text"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Adres Firmy:</label>
                  <input
                    type="text"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">URL Logo Firmy:</label>
                  <input
                    type="text"
                    value={company.logo_url}
                    onChange={(e) => setCompany({ ...company, logo_url: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
                Zapisz Ustawienia
              </button>
            </form>
          )}
        </div>
      </div>

      {/* DRAWER WYBORU INWESTYCJI */}
      {isProjectDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start">
          <div className="w-full max-w-xs bg-slate-900 border-r border-slate-800 h-full p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="font-bold text-xs text-white">Wybierz Inwestycję</h4>
                <button onClick={() => setIsProjectDrawerOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <button
                onClick={() => setShowAddProjectModal(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus size={16} /> Dodaj Nową Budowę
              </button>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Szukaj budowy (A, ad)..."
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id)
                      setIsProjectDrawerOpen(false)
                    }}
                    className={`w-full p-3 rounded-xl text-left text-xs font-semibold flex justify-between items-center transition-all ${
                      selectedProjectId === p.id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER WYBORU KATEGORII ADMINISTRACJI */}
      {isAdminDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start">
          <div className="w-full max-w-xs bg-slate-900 border-r border-slate-800 h-full p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="font-bold text-xs text-white">Kategorie Administracji</h4>
                <button onClick={() => setIsAdminDrawerOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <button
                onClick={() => setShowAddAdminCatModal(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus size={16} /> Dodaj Kategorię
              </button>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Szukaj..."
                  value={adminSearchTerm}
                  onChange={(e) => setAdminSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5">
                {filteredAdminCategories.map((cat) => (
                  <div key={cat} className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedAdminCategory(cat)
                        setIsAdminDrawerOpen(false)
                      }}
                      className={`flex-1 p-3 rounded-xl text-left text-xs font-semibold flex justify-between items-center ${
                        selectedAdminCategory === cat ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      <ChevronRight size={14} />
                    </button>
                    <button onClick={() => handleDeleteAdminCategory(cat)} className="p-2 text-slate-500 hover:text-rose-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DODAWANIA NOWEJ BUDOWY */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Dodaj Nową Budowę</h4>
              <button onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Nazwa Inwestycji..."
                value={newProjTitle}
                onChange={(e) => setNewProjTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Lokalizacja..."
                value={newProjLocation}
                onChange={(e) => setNewProjLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <input
                type="number"
                placeholder="Budżet [PLN]..."
                value={newProjBudget}
                onChange={(e) => setNewProjBudget(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowAddProjectModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleCreateProjectSubmit} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                Utwórz Budowę
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SZCZEGÓŁÓW PRACOWNIKA */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Profil: {selectedWorker.full_name}</h4>
              <button onClick={() => setSelectedWorker(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Stawka za roboczogodzinę [PLN/h]:</label>
                <input
                  type="number"
                  value={editingWorkerRate}
                  onChange={(e) => setEditingWorkerRate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dieta Dzienna [PLN]:</label>
                <input
                  type="number"
                  value={editingWorkerAllowance}
                  onChange={(e) => setEditingWorkerAllowance(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Telefon:</label>
                <input
                  type="text"
                  value={editingWorkerPhone}
                  onChange={(e) => setEditingWorkerPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setSelectedWorker(null)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleSaveWorkerChanges} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                Zapisz Dane
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DOSTAWY ZAMÓWIENIA Z ZAŁĄCZNIKAMI / KAMERĄ */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Potwierdź Dostawę Zamówienia</h4>
              <button onClick={() => setSelectedOrderModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Data Dostawy:</label>
                <input
                  type="date"
                  value={orderDeliveryDate}
                  onChange={(e) => setOrderDeliveryDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Hurtownia / Dostawca:</label>
                <input
                  type="text"
                  value={orderDeliveryCarrier}
                  onChange={(e) => setOrderDeliveryCarrier(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Załącz zdjęcie (QR kod, WZ, Aparat/Galeria):</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setOrderDeliveryPhotos(Array.from(e.target.files || []))}
                  className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-blue-600 file:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setSelectedOrderModal(null)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleSaveOrderApprovalSubmit} className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs">
                Zatwierdź
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TWORZENIA ZAMÓWIENIA PRZEZ ADMINA */}
      {showCreateAdminOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Nowe Zamówienie (Admin)</h4>
              <button onClick={() => setShowCreateAdminOrderModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Budowa:</label>
                <select
                  value={adminOrderProjId}
                  onChange={(e) => setAdminOrderProjId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="">-- Wybierz Budowę --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nazwa Materiału:</label>
                <input
                  type="text"
                  placeholder="np. Beton, Stal..."
                  value={adminOrderItemName}
                  onChange={(e) => setAdminOrderItemName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Ilość:</label>
                <input
                  type="text"
                  placeholder="np. 100 sztuk..."
                  value={adminOrderQuantity}
                  onChange={(e) => setAdminOrderQuantity(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Załącz zdjęcie (Aparat/Galeria):</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setAdminOrderPhotos(Array.from(e.target.files || []))}
                  className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-blue-600 file:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowCreateAdminOrderModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleCreateAdminOrderSubmit} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                Wyślij Zamówienie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PODGLĄD ZDJĘĆ / PODGLĄD LIGHTBOX */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl overflow-hidden flex flex-col justify-between max-h-[80vh] my-auto">
            <div className="p-3.5 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <h4 className="text-xs font-bold text-white truncate pr-2">{previewFile.title}</h4>
              <button onClick={() => setPreviewFile(null)} className="p-1 text-slate-400 hover:text-white bg-slate-700 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center overflow-auto max-h-[50vh] bg-slate-950">
              <img src={previewFile.url} alt={previewFile.title} className="max-w-full max-h-[45vh] object-contain rounded-lg" />
            </div>

            <div className="p-3.5 bg-slate-800 border-t border-slate-700 flex gap-2">
              <button onClick={() => setPreviewFile(null)} className="flex-1 py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs">
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}