'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Edit3,
  Folder,
  Image,
  File,
  Calendar,
  Truck,
  CreditCard,
  UserCheck,
  HardHat,
  DollarSign,
  Bell,
  Eye,
  Check,
  X,
  Upload,
  PieChart,
  Activity,
  Wrench,
  ShieldAlert,
  LogOut,
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()

  // Nawigacja główna i podzakładki
  const [activeTab, setActiveTab] = useState('company') // company, realization, admin_office, workers, orders, settings
  const [realizationSubTab, setRealizationSubTab] = useState('overview') // overview, docs, stats
  const [adminSubTab, setAdminSubTab] = useState('docs') // docs, fleet, contracts, accounting

  // Stan danych z Supabase
  const [company, setCompany] = useState({
    name: 'BUILD-CORP CONSTRUCTIONS Sp. z o.o.',
    nip: '5213894012',
    regon: '381920491',
    krs: '0000789123',
    address: 'ul. Budowlanych 45A, 02-678 Warszawa',
    phone: '+48 22 849 20 10',
    email: 'kontakt@buildcorp.pl',
    bankAccount: '49 1020 1026 0000 1202 0491 8829',
    capital: '2 500 000 PLN',
    ceo: 'Marek Janiszewski',
    monthlyBudget: 1580000,
  })

  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [workers, setWorkers] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [projectPhotos, setProjectPhotos] = useState<any[]>([])

  // Kontrola okien modalnych i formularzy
  const [selectedOrderModal, setSelectedOrderModal] = useState<any>(null)
  const [orderConfirmForm, setOrderConfirmForm] = useState({
    date: '',
    place: '',
    recipient: '',
    carrier: '',
    trackingNo: '',
  })

  const [editingWorker, setEditingWorker] = useState<any>(null)
  const [previewImage, setPreviewImage] = useState<any>(null)
  const [uploadFileFolder, setUploadFileFolder] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [newFileDesc, setNewFileDesc] = useState('')
  const [companyEditMode, setCompanyEditMode] = useState(false)
  const [companyForm, setCompanyForm] = useState(company)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // 1. Inwestycje / Budowy
      const { data: projData } = await supabase.from('projects').select('*')
      if (projData && projData.length > 0) {
        setProjects(projData)
        if (!selectedProjectId) setSelectedProjectId(projData[0].id)
      }

      // 2. Pracownicy + status aktywnych czasów (Online)
      const { data: profData } = await supabase.from('profiles').select('*')
      const { data: activeLogs } = await supabase
        .from('time_logs')
        .select('*')
        .is('end_time', null)

      if (profData) {
        const mappedWorkers = profData.map((w) => {
          const activeLog = activeLogs?.find((l) => l.user_id === w.id)
          return {
            ...w,
            isOnline: !!activeLog,
            startTime: activeLog ? new Date(activeLog.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
            assignedProject: activeLog?.project_id || 'Baza',
            docsExpiry: {
              bhp: w.docs_expiry_bhp || '2027-04-12',
              medical: w.docs_expiry_medical || '2027-01-15',
            },
          }
        })
        setWorkers(mappedWorkers)
      }

      // 3. Wnioski Urlopowe
      const { data: leaves } = await supabase
        .from('vacation_requests')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })

      if (leaves) setLeaveRequests(leaves)

      // 4. Zamówienia Materiałów
      const { data: ordData } = await supabase
        .from('material_requests')
        .select('*, projects(title), profiles(full_name)')
        .order('created_at', { ascending: false })

      if (ordData) setOrders(ordData)

      // 5. Zdjęcia i Dokumentacja
      const { data: photoData } = await supabase
        .from('project_photos')
        .select('*, profiles(full_name), tasks(title)')
        .order('created_at', { ascending: false })

      if (photoData) setProjectPhotos(photoData)
    } catch (err: any) {
      console.error('Błąd ładowania danych admina:', err)
    } finally {
      setLoading(false)
    }
  }

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || {}
  }, [projects, selectedProjectId])

  const onlineWorkersCount = useMemo(() => workers.filter((w) => w.isOnline).length, [workers])
  const pendingOrdersCount = useMemo(() => orders.filter((o) => o.status === 'pending' || o.status === 'Oczekujące').length, [orders])
  const pendingLeavesCount = useMemo(() => leaveRequests.filter((l) => l.status === 'pending' || l.status === 'Oczekujący').length, [leaveRequests])

  // Akceptacja/Odrzucenie Zamówienia Materiałów
  const handleApproveOrderModal = (order: any) => {
    setSelectedOrderModal(order)
    setOrderConfirmForm({
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      place: `Budowa: ${order.projects?.title || 'Plac Budowy'}`,
      recipient: order.profiles?.full_name || 'Brygadzista',
      carrier: 'Beton & Stal Express',
      trackingNo: `TRACK-${Math.floor(100000 + Math.random() * 900000)}`,
    })
  }

  const handleSaveOrderApproval = async () => {
    if (!selectedOrderModal) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('material_requests')
        .update({
          status: 'Potwierdzone',
          delivery_details: orderConfirmForm,
        })
        .eq('id', selectedOrderModal.id)

      if (!error) {
        alert('Zatwierdzono zamówienie i przekazano informacje o dostawie do Brygadzisty!')
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
      const { error } = await supabase
        .from('material_requests')
        .update({ status: 'Odrzucone' })
        .eq('id', orderId)

      if (!error) fetchAdminData()
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Akceptacja/Odrzucenie Urlopów
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

  // Zapis Edycji Pracownika
  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWorker) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: editingWorker.role,
          hourly_rate: editingWorker.hourly_rate,
          daily_allowance: editingWorker.daily_allowance,
          phone: editingWorker.phone,
        })
        .eq('id', editingWorker.id)

      if (!error) {
        alert('Pomyślnie zaktualizowano dane pracownika!')
        setEditingWorker(null)
        fetchAdminData()
      }
    } catch (err: any) {
      alert('Błąd zapisu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filtrowanie dokumentów budowy do 3 folderów
  const currentAdminDocs = projectPhotos.filter((p) => p.project_id === selectedProjectId && (p.photo_type === 'admin' || p.photo_type === 'general'))
  const currentForemanDocs = projectPhotos.filter((p) => p.project_id === selectedProjectId && p.photo_type === 'progress')
  const currentWorkerDocs = projectPhotos.filter((p) => p.project_id === selectedProjectId && p.photo_type === 'task_completion')

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR NAVIGACJI */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
              BC
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-slate-100 text-sm tracking-wide truncate">{company.name}</h1>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Panel Administratora
              </span>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('company')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'company'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4" />
                <span>1. FIRMA & KPI</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('realization')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'realization'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <HardHat className="w-4 h-4" />
                <span>2. DZIAŁ REALIZACJI</span>
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('admin_office')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin_office'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>3. ADMINISTRACJA</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('workers')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'workers'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>4. PRACOWNICI ONLINE</span>
              </div>
              <div className="flex items-center gap-1">
                {pendingLeavesCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {onlineWorkersCount} ON
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>5. ZAMÓWIENIA</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>6. USTAWIENIA</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Wyloguj</span>
          </button>
        </div>
      </aside>

      {/* OBSZAR ROBOCZY */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-slate-100">
              {activeTab === 'company' && '1. Profil Firmy & Wskaźniki Zarządcze KPI'}
              {activeTab === 'realization' && '2. Dział Realizacji Budowlanych'}
              {activeTab === 'admin_office' && '3. Administracja & Flota & Umowy'}
              {activeTab === 'workers' && '4. Zarządzanie Kadrami & Pracownicy Online'}
              {activeTab === 'orders' && '5. Centrum Zamówień i Zaopatrzenia'}
              {activeTab === 'settings' && '6. Ustawienia Systemowe i Konto Administratora'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                System Supabase Active
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">
                Budowy w toku: <strong className="text-white">{projects.length}</strong>
              </span>
            </div>

            <button className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 relative">
              <Bell className="w-4 h-4" />
              {(pendingOrdersCount > 0 || pendingLeavesCount > 0) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FIRMA (KPIs) */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Budowy Aktywne</p>
                    <p className="text-2xl font-black text-white mt-1">{projects.length}</p>
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                      <TrendingUp className="w-3 h-3" /> Zgodnie z planem
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pracownicy Łącznie</p>
                    <p className="text-2xl font-black text-white mt-1">{workers.length}</p>
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                      <UserCheck className="w-3 h-3" /> {onlineWorkersCount} zalogowanych
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Oczekujące Wnioski/Zamówienia</p>
                    <p className="text-2xl font-black text-amber-400 mt-1">{pendingOrdersCount + pendingLeavesCount}</p>
                    <p className="text-xs text-slate-400 mt-1">Wymagają weryfikacji</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Miesięczny Budżet Sprzętu</p>
                    <p className="text-2xl font-black text-white mt-1">{(company.monthlyBudget / 1000).toFixed(0)}k PLN</p>
                    <p className="text-xs text-slate-400 mt-1">Wykorzystanie: 64%</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-slate-100 text-sm">Oficjalne Dane Rejestrowe Firmy</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-500 font-semibold block">Pełna Nazwa Podmiotu</span>
                        <span className="text-slate-200 font-medium text-sm">{company.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">NIP</span>
                        <span className="font-mono text-amber-400 font-bold">{company.nip}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">REGON / KRS</span>
                        <span className="text-slate-300 font-mono">
                          {company.regon} / {company.krs}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-500 font-semibold block">Adres Główny Siedziby</span>
                        <span className="text-slate-200">{company.address}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Kontakt Centralny</span>
                        <span className="text-slate-300 block">{company.phone}</span>
                        <span className="text-amber-400">{company.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 mb-4">
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                      Alerty Operacyjne BHP & Flota
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-300">Weryfikacja Badań Lekarskich</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Sprawdź ważność badań dla pracowników polowych.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REALIZACJA (Budowy & 3 Foldery) */}
          {activeTab === 'realization' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wybierz Inwestycję:</span>
                  <div className="flex flex-wrap gap-2">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedProjectId === p.id
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex border-b border-slate-800 gap-6 text-xs font-bold">
                <button
                  onClick={() => setRealizationSubTab('overview')}
                  className={`pb-3 transition-colors relative ${realizationSubTab === 'overview' ? 'text-amber-400' : 'text-slate-400'}`}
                >
                  Kosztorys i Budżet
                </button>
                <button
                  onClick={() => setRealizationSubTab('docs')}
                  className={`pb-3 transition-colors relative ${realizationSubTab === 'docs' ? 'text-amber-400' : 'text-slate-400'}`}
                >
                  System 3 Folderów Dokumentów
                </button>
              </div>

              {realizationSubTab === 'docs' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Folder 1: Admin */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-amber-400 font-bold text-xs uppercase">
                      <Folder className="w-4 h-4" /> 1. Folder Administratora
                    </div>
                    <div className="space-y-2">
                      {currentAdminDocs.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setPreviewImage(doc)}
                          className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs cursor-pointer hover:border-amber-500"
                        >
                          <p className="font-bold text-slate-200 truncate">{doc.description || 'Dokument Admina'}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{new Date(doc.created_at).toLocaleDateString('pl-PL')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Folder 2: Brygadzista */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-blue-400 font-bold text-xs uppercase">
                      <Folder className="w-4 h-4" /> 2. Folder Brygadzisty
                    </div>
                    <div className="space-y-2">
                      {currentForemanDocs.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setPreviewImage(doc)}
                          className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs cursor-pointer hover:border-blue-500"
                        >
                          <p className="font-bold text-slate-200 truncate">{doc.profiles?.full_name || 'Brygadzista'}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{new Date(doc.created_at).toLocaleDateString('pl-PL')}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Folder 3: Pracownicy */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-emerald-400 font-bold text-xs uppercase">
                      <Folder className="w-4 h-4" /> 3. Folder Pracowników
                    </div>
                    <div className="space-y-2">
                      {currentWorkerDocs.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setPreviewImage(doc)}
                          className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs cursor-pointer hover:border-emerald-500"
                        >
                          <p className="font-bold text-slate-200 truncate">{doc.tasks?.title || 'Zadanie Wykonane'}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{doc.profiles?.full_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRACOWNICI ONLINE & STAWKI */}
          {activeTab === 'workers' && (
            <div className="space-y-6">
              {/* Oczekujące urlopy */}
              {pendingLeavesCount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Wnioski Urlopowe Do Akceptacji ({pendingLeavesCount})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {leaveRequests
                      .filter((r) => r.status === 'pending' || r.status === 'Oczekujący')
                      .map((req) => (
                        <div key={req.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-white block">{req.profiles?.full_name}</strong>
                            <span className="text-slate-400 block">
                              Typ: {req.type} ({req.start_date} - {req.end_date})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLeaveDecision(req.id, 'Zatwierdzony')}
                              className="bg-emerald-500 text-slate-950 font-bold p-2 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleLeaveDecision(req.id, 'Odrzucony')}
                              className="bg-rose-500 text-white font-bold p-2 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tabela pracowników */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-200">
                  Panel Pracowników i Zarządzanie Stawkami
                </div>
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Pracownik</th>
                      <th className="p-4">Rola</th>
                      <th className="p-4">Status Aplikacji</th>
                      <th className="p-4">Stawka / Dieta</th>
                      <th className="p-4 text-right">Opcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {workers.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-bold text-white">{w.full_name}</td>
                        <td className="p-4 font-semibold text-amber-400">{w.role}</td>
                        <td className="p-4">
                          {w.isOnline ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              ZALOGOWANY (Start: {w.startTime})
                            </span>
                          ) : (
                            <span className="text-slate-500">Niezalogowany</span>
                          )}
                        </td>
                        <td className="p-4 font-mono">
                          <div>{w.hourly_rate || 35} PLN/h</div>
                          <span className="text-slate-500 text-[10px]">Dieta: {w.daily_allowance || 0} PLN</span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setEditingWorker(w)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ZAMÓWIENIA MATERIAŁÓW */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  ZAMÓWIENIA MATERIAŁÓW OD BRYGADZISTÓW
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {orders.map((o) => (
                  <div key={o.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold text-white text-sm">{o.item_name}</h4>
                      <p className="text-slate-400">Budowa: {o.projects?.title || 'Nieokreślona'}</p>
                      <p className="text-slate-400">Zamawiający: {o.profiles?.full_name}</p>
                      <p className="text-amber-400">{o.notes}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {o.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveOrderModal(o)}
                            className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs"
                          >
                            Potwierdź & Wyślij Dostawę
                          </button>
                          <button
                            onClick={() => handleRejectOrder(o.id)}
                            className="bg-rose-500/20 text-rose-400 font-semibold px-3 py-2 rounded-lg text-xs"
                          >
                            Odrzuć
                          </button>
                        </>
                      )}

                      {o.status === 'Potwierdzone' && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold">
                          W dostawie
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL POTWIERDZENIA DOSTAWY */}
      {selectedOrderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">Potwierdzenie Dostawy Zamówienia</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Planowana Data Dostawy:</label>
                <input
                  type="date"
                  value={orderConfirmForm.date}
                  onChange={(e) => setOrderConfirmForm({ ...orderConfirmForm, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Przewoźnik / Hurtownia:</label>
                <input
                  type="text"
                  value={orderConfirmForm.carrier}
                  onChange={(e) => setOrderConfirmForm({ ...orderConfirmForm, carrier: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => setSelectedOrderModal(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs">
                Anuluj
              </button>
              <button onClick={handleSaveOrderApproval} className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs">
                Zatwierdź Dostawę
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDYCJI STAWKI PRACOWNIKA */}
      {editingWorker && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveWorker} className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-white text-sm">Edycja Stawki: {editingWorker.full_name}</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Stawka Godzinowa [PLN/h]:</label>
                <input
                  type="number"
                  value={editingWorker.hourly_rate || 35}
                  onChange={(e) => setEditingWorker({ ...editingWorker, hourly_rate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={() => setEditingWorker(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs">
                Anuluj
              </button>
              <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs">
                Zapisz
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PODGLĄD ZDJĘCIA / DOKUMENTU */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">{previewImage.description || 'Załącznik'}</span>
              <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-950 p-2 rounded-lg">
              <img src={previewImage.photo_url} alt="Podgląd" className="max-h-[60vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}