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
  Activity,
  ShieldAlert,
  LogOut,
  Trash2,
  FolderPlus,
  ChevronRight,
  Megaphone,
  BarChart2,
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()

  // Główne zakładki
  const [activeTab, setActiveTab] = useState<'company' | 'realization' | 'admin_office' | 'workers' | 'orders' | 'settings'>('company')

  // Ustawienia Firmy & Admina (Dynamiczne)
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

  const [adminCredentials, setAdminCredentials] = useState({
    email: 'admin@buildcorp.pl',
    password: '••••••••••••',
  })

  // Dane z Supabase
  const [projects, setProjects] = useState<any[]>([])
  const [newsList, setNewsList] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 1. Aktualności - Formularz
  const [newNewsTitle, setNewNewsTitle] = useState('')
  const [newNewsContent, setNewNewsContent] = useState('')
  const [showAddNewsModal, setShowAddNewsModal] = useState(false)

  // 2. Dział Realizacji - Lewy wysuwany panel budów i wyszukiwanie
  const [isRealizationDrawerOpen, setIsRealizationDrawerOpen] = useState(true)
  const [projectSearchTerm, setProjectSearchTerm] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [realizationSubTab, setRealizationSubTab] = useState<'valuations' | 'docs' | 'stats'>('docs')

  // Foldery projektowe (Realizacja)
  const [customProjectFolders, setCustomProjectFolders] = useState<{ [projId: string]: string[] }>({})
  const [newFolderName, setNewFolderName] = useState('')

  // 3. Administracja - Dynamiczne panele i struktura folderów
  const [adminSections, setAdminSections] = useState<string[]>(['Umowy', 'Dokumenty pracowników', 'Auta / Flota'])
  const [activeAdminSection, setActiveAdminSection] = useState<string>('Umowy')
  const [newAdminSectionTitle, setNewAdminSectionTitle] = useState('')
  const [showAddAdminSectionModal, setShowAddAdminSectionModal] = useState(false)

  // Pliki i Foldery w Administracji
  const [adminFiles, setAdminFiles] = useState<{ [section: string]: { id: string; name: string; isFolder: boolean; parent?: string }[] }>({
    'Umowy': [
      { id: '1', name: 'Umowy Podwykonawcze 2026', isFolder: true },
      { id: '2', name: 'Umowa_Generalna_2026.pdf', isFolder: false, parent: '1' },
    ],
    'Dokumenty pracowników': [
      { id: '3', name: 'Szkolenia_BHP', isFolder: true },
      { id: '4', name: 'Badania_Lekarskie_Jan_Kowalski.pdf', isFolder: false, parent: '3' },
    ],
    'Auta / Flota': [
      { id: '5', name: 'Karty_Paliwowe_Sprinter.pdf', isFolder: false },
    ],
  })
  const [newAdminItemName, setNewAdminItemName] = useState('')

  // Podgląd plików
  const [previewFile, setPreviewFile] = useState<any>(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // Pobieranie ustawień firmy
      const { data: compData } = await supabase.from('company_settings').select('*').eq('id', 1).single()
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

      // Pobieranie aktualności
      const { data: newsData } = await supabase.from('company_news').select('*').order('created_at', { ascending: false })
      if (newsData) setNewsList(newsData)

      // Pobieranie budów
      const { data: projData } = await supabase.from('projects').select('*').order('title', { ascending: true })
      if (projData && projData.length > 0) {
        setProjects(projData)
        if (!selectedProjectId) setSelectedProjectId(projData[0].id)
      }

      // Pobieranie pracowników
      const { data: profData } = await supabase.from('profiles').select('*')
      if (profData) setWorkers(profData)

      // Pobieranie zamówień
      const { data: ordData } = await supabase.from('material_requests').select('*, projects(title), profiles(full_name)').order('created_at', { ascending: false })
      if (ordData) setOrders(ordData)
    } catch (err: any) {
      console.error('Błąd ładowania danych administratora:', err)
    } finally {
      setLoading(false)
    }
  }

  // Zapisywanie Ustawień Firmy i Admina
  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          id: 1,
          name: company.name,
          nip: company.nip,
          regon: company.regon,
          krs: company.krs,
          address: company.address,
          phone: company.phone,
          email: company.email,
          logo_url: company.logo_url,
          updated_at: new Date().toISOString(),
        })

      if (!error) {
        alert('Pomyślnie zaktualizowano dane firmy, logo oraz dane administratora!')
        fetchAdminData()
      } else {
        alert('Błąd zapisu ustawień: ' + error.message)
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Dodawanie Aktualności
  const handleAddNews = async () => {
    if (!newNewsTitle || !newNewsContent) {
      alert('Wpisz tytuł i treść aktualności!')
      return
    }
    setLoading(true)

    try {
      const { error } = await supabase.from('company_news').insert({
        title: newNewsTitle,
        content: newNewsContent,
      })

      if (!error) {
        alert('Dodano aktualność!')
        setNewNewsTitle('')
        setNewNewsContent('')
        setShowAddNewsModal(false)
        fetchAdminData()
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filtrowanie i alfabetyczne sortowanie budów
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title, 'pl'))
  }, [projects, projectSearchTerm])

  const selectedProjectObj = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0]
  }, [projects, selectedProjectId])

  // Zarządzanie folderami w Realizacji
  const handleAddProjectFolder = () => {
    if (!newFolderName || !selectedProjectId) return
    setCustomProjectFolders((prev) => ({
      ...prev,
      [selectedProjectId]: [...(prev[selectedProjectId] || []), newFolderName],
    }))
    setNewFolderName('')
  }

  const handleDeleteProjectFolder = (folderNameToDelete: string) => {
    if (window.confirm(`Czy na pewno chcesz usunąć folder "${folderNameToDelete}"?`)) {
      setCustomProjectFolders((prev) => ({
        ...prev,
        [selectedProjectId]: (prev[selectedProjectId] || []).filter((f) => f !== folderNameToDelete),
      }))
    }
  }

  // Zarządzanie sekcjami w Administracji
  const handleAddAdminSection = () => {
    if (!newAdminSectionTitle) return
    if (!adminSections.includes(newAdminSectionTitle)) {
      setAdminSections((prev) => [...prev, newAdminSectionTitle])
      setActiveAdminSection(newAdminSectionTitle)
    }
    setNewAdminSectionTitle('')
    setShowAddAdminSectionModal(false)
  }

  const handleDeleteAdminSection = (sectionToDelete: string) => {
    if (window.confirm(`Czy na pewno chcesz usunąć całą zakładkę "${sectionToDelete}" wraz z jej zawartością?`)) {
      setAdminSections((prev) => prev.filter((s) => s !== sectionToDelete))
      if (activeAdminSection === sectionToDelete) {
        setActiveAdminSection(adminSections[0] || '')
      }
    }
  }

  // Zarządzanie plikami/folderami w Administracji
  const handleAddAdminItem = (isFolder: boolean) => {
    if (!newAdminItemName || !activeAdminSection) return
    const newItem = {
      id: Date.now().toString(),
      name: newAdminItemName,
      isFolder,
    }
    setAdminFiles((prev) => ({
      ...prev,
      [activeAdminSection]: [...(prev[activeAdminSection] || []), newItem],
    }))
    setNewAdminItemName('')
  }

  const handleDeleteAdminItem = (itemId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten element?')) {
      setAdminFiles((prev) => ({
        ...prev,
        [activeAdminSection]: (prev[activeAdminSection] || []).filter((item) => item.id !== itemId),
      }))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Statystyki budów wg statusu
  const projectsValuation = useMemo(() => projects.filter((p) => p.status === 'w_trakcie_wyceny' || p.status === 'pending'), [projects])
  const projectsInProgress = useMemo(() => projects.filter((p) => p.status === 'w_toku' || p.status === 'in_progress' || !p.status), [projects])
  const projectsCompleted = useMemo(() => projects.filter((p) => p.status === 'zakonczone' || p.status === 'completed'), [projects])

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* GLÓWNY PASEK BOCZNY NAVIGACJI */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Logo i Nazwa Firmy z Ustawień */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
                BC
              </div>
            )}
            <div className="overflow-hidden">
              <h1 className="font-bold text-slate-100 text-sm tracking-wide truncate" title={company.name}>
                {company.name}
              </h1>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Panel Admina
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
                <span>1. {company.name || 'Firma'}</span>
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
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                {adminSections.length}
              </span>
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
                <span>4. PRACOWNICY</span>
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
              {orders.filter((o) => o.status === 'pending').length > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                  {orders.filter((o) => o.status === 'pending').length}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800 space-y-1.5">
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

      {/* OBSZAR TREŚCI */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* NAGŁÓWEK GŁÓWNY */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {company.logo_url && <img src={company.logo_url} alt="Logo Header" className="w-7 h-7 rounded-lg object-cover" />}
            <h2 className="text-sm font-bold text-slate-100">
              {activeTab === 'company' && `1. Nazwa Firmy: ${company.name}`}
              {activeTab === 'realization' && '2. Dział Realizacji Budowlanych'}
              {activeTab === 'admin_office' && '3. Administracja & Flota & Umowy'}
              {activeTab === 'workers' && '4. Zarządzanie Kadrami'}
              {activeTab === 'orders' && '5. Zamówienia Materiałów'}
              {activeTab === 'settings' && '6. Ustawienia Systemowe i Logowanie Administratora'}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-mono">NIP: {company.nip || 'Brak'}</span>
            <span className="text-slate-700">|</span>
            <span className="text-amber-400 font-semibold">{company.email}</span>
          </div>
        </header>

        {/* ZAWARTOŚĆ DLA ZAKŁADEK */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ==========================================
              TAB 1: FIRMA (Z AKTUALNOŚCIAMI I STATYSTYKAMI)
             ========================================== */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              {/* NAGŁÓWEK NAZWY FIRMY */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    OFICJALNY PROFIL FIRMY
                  </span>
                  <h1 className="text-2xl font-black text-white tracking-wide">{company.name}</h1>
                  <p className="text-xs text-slate-400 mt-1">{company.address}</p>
                </div>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  <Edit3 size={15} /> Edytuj w Ustawieniach
                </button>
              </div>

              {/* SEKCJA: AKTUALNOŚCI */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Megaphone className="text-amber-400" size={18} /> Aktualności & Komunikaty Firmowe
                  </h3>
                  <button
                    onClick={() => setShowAddNewsModal(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
                  >
                    <Plus size={15} /> Dodaj Komunikat
                  </button>
                </div>

                {newsList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Brak dodanych aktualności.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newsList.map((item) => (
                      <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs text-amber-300">{item.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(item.created_at).toLocaleDateString('pl-PL')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SEKCJA: STATYSTYKI BUDÓW (W TRAKCIE WYCENY / W TOKU / ZAKOŃCZONE) */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 shadow-lg">
                <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <BarChart2 className="text-blue-400" size={18} /> Statystyki Budów i Zużycie Budżetu
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* KAT. 1: W TRAKCIE WYCENY */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-amber-400 uppercase">W trakcie wyceny</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                        {projectsValuation.length}
                      </span>
                    </div>

                    {projectsValuation.length === 0 ? (
                      <p className="text-[11px] text-slate-500 text-center py-3">Brak budów w tym statusie</p>
                    ) : (
                      projectsValuation.map((p) => {
                        const total = Number(p.budget_total) || 1000000
                        const spent = Number(p.budget_spent) || 0
                        const percent = Math.min(100, Math.round((spent / total) * 100))
                        return (
                          <div key={p.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1.5">
                            <h5 className="font-bold text-white truncate">{p.title}</h5>
                            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                              <span>Budżet: {total.toLocaleString()} PLN</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* KAT. 2: W TOKU */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase">W toku (Realizacja)</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                        {projectsInProgress.length}
                      </span>
                    </div>

                    {projectsInProgress.length === 0 ? (
                      <p className="text-[11px] text-slate-500 text-center py-3">Brak aktywnych budów</p>
                    ) : (
                      projectsInProgress.map((p) => {
                        const total = Number(p.budget_total) || 1000000
                        const spent = Number(p.budget_spent) || 350000
                        const percent = Math.min(100, Math.round((spent / total) * 100))
                        return (
                          <div key={p.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1.5">
                            <h5 className="font-bold text-white truncate">{p.title}</h5>
                            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                              <span>Zużyto: {spent.toLocaleString()} PLN</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* KAT. 3: ZAKOŃCZONE */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-blue-400 uppercase">Zakończone</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                        {projectsCompleted.length}
                      </span>
                    </div>

                    {projectsCompleted.length === 0 ? (
                      <p className="text-[11px] text-slate-500 text-center py-3">Brak zakończonych inwestycji</p>
                    ) : (
                      projectsCompleted.map((p) => (
                        <div key={p.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1">
                          <h5 className="font-bold text-white truncate">{p.title}</h5>
                          <p className="text-[11px] text-emerald-400 font-mono">Rozliczono: 100%</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: DZIAŁ REALIZACJI (WYSUWANY PANEL I WYSZUKIWARKA)
             ========================================== */}
          {activeTab === 'realization' && (
            <div className="flex gap-6 h-[calc(100vh-140px)]">
              {/* LEWY WYSUWANY PANEL Z BUDOWAMI */}
              <div className={`bg-slate-900 border border-slate-800 rounded-2xl flex flex-col transition-all duration-300 ${isRealizationDrawerOpen ? 'w-80 p-4' : 'w-12 p-2 items-center'}`}>
                <div className="flex justify-between items-center mb-3">
                  {isRealizationDrawerOpen && <span className="text-xs font-bold uppercase tracking-wider text-slate-400">WYBIERZ BUDOWĘ</span>}
                  <button onClick={() => setIsRealizationDrawerOpen(!isRealizationDrawerOpen)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
                    {isRealizationDrawerOpen ? <X size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>

                {isRealizationDrawerOpen && (
                  <>
                    {/* WYSZUKIWARKA Z ODPOWIEDZIĄ NA LITERKI (a, A, ad itd.) */}
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Szukaj budowy (np. A, ad)..."
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                      {filteredProjects.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">Brak wyników pasujących do "{projectSearchTerm}"</p>
                      ) : (
                        filteredProjects.map((proj) => (
                          <button
                            key={proj.id}
                            onClick={() => setSelectedProjectId(proj.id)}
                            className={`w-full p-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all ${
                              selectedProjectId === proj.id
                                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                            }`}
                          >
                            <span className="truncate">{proj.title}</span>
                            <ChevronRight size={14} className={selectedProjectId === proj.id ? 'text-slate-950' : 'text-slate-500'} />
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* PRAWY PANEL SZCZEGÓŁÓW BUDOWY */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col overflow-y-auto space-y-5">
                {selectedProjectObj ? (
                  <>
                    <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-[11px] font-bold text-amber-400 uppercase">AKTYWNA INWESTYCJA:</span>
                        <h2 className="text-xl font-bold text-white mt-0.5">{selectedProjectObj.title}</h2>
                      </div>

                      {/* 3 FOLDERY GŁÓWNE */}
                      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                        <button
                          onClick={() => setRealizationSubTab('valuations')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${realizationSubTab === 'valuations' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                        >
                          1. Wyceny i kosztorysy
                        </button>
                        <button
                          onClick={() => setRealizationSubTab('docs')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${realizationSubTab === 'docs' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                        >
                          2. Dokumentacja
                        </button>
                        <button
                          onClick={() => setRealizationSubTab('stats')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${realizationSubTab === 'stats' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                        >
                          3. Statystyki
                        </button>
                      </div>
                    </div>

                    {/* MOŻLIWOŚĆ DODAWANIA I USUWANIA FOLDERÓW Z ZAPYTANIEM 'Czy na pewno' */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <FolderPlus className="text-amber-400" size={16} /> Własne Foldery Projektu
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nazwa nowego folderu..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <button onClick={handleAddProjectFolder} className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs">
                            Dodaj Folder
                          </button>
                        </div>
                      </div>

                      {/* LISTA CUSTOM FOLDERÓW */}
                      {(customProjectFolders[selectedProjectId] || []).length > 0 && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900">
                          {(customProjectFolders[selectedProjectId] || []).map((fName, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200">
                              <span className="flex items-center gap-2 truncate font-semibold">
                                <Folder className="text-amber-400" size={16} /> {fName}
                              </span>
                              <button
                                onClick={() => handleDeleteProjectFolder(fName)}
                                className="p-1 text-slate-400 hover:text-rose-400"
                                title="Usuń folder"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PODGLĄD DOKUMENTÓW W ZALEŻNOŚCI OD ZAKŁADKI */}
                    {realizationSubTab === 'valuations' && (
                      <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                        Sekcja wycen i kosztorysów dla budowy {selectedProjectObj.title}.
                      </div>
                    )}

                    {realizationSubTab === 'docs' && (
                      <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                        Dokumenty i pliki budowlane przesyłane przez Brygadzistę oraz Pracowników.
                      </div>
                    )}

                    {realizationSubTab === 'stats' && (
                      <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                        Szczegółowa analityka zużycia roboczogodzin i materiałów.
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-500">Wybierz budowę z lewego panelu.</p>
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: ADMINISTRACJA (SWOBODNE ZARZĄDZANIE ZAKŁADKAMI I PLIKAMI)
             ========================================== */}
          {activeTab === 'admin_office' && (
            <div className="space-y-6">
              {/* PASEK ZAKŁADEK / PANELE WYSOWANYCH */}
              <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="flex gap-2 overflow-x-auto">
                  {adminSections.map((sec) => (
                    <div key={sec} className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-1">
                      <button
                        onClick={() => setActiveAdminSection(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeAdminSection === sec ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {sec}
                      </button>
                      <button
                        onClick={() => handleDeleteAdminSection(sec)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Usuń zakładkę"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddAdminSectionModal(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shrink-0"
                >
                  <Plus size={16} /> Dodaj Zakładkę / Panel
                </button>
              </div>

              {/* ZARZĄDZANIE STRUKTURĄ PLIKÓW I FOLDERÓW W WYBRANEJ ZAKŁADCE */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-sm text-white">
                    Zarządzanie plikami w sekcji: <span className="text-amber-400">{activeAdminSection}</span>
                  </h3>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nazwa pliku lub folderu..."
                      value={newAdminItemName}
                      onChange={(e) => setNewAdminItemName(e.target.value)}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button onClick={() => handleAddAdminItem(true)} className="px-3 py-1.5 bg-slate-800 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1">
                      <FolderPlus size={14} /> + Folder
                    </button>
                    <button onClick={() => handleAddAdminItem(false)} className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1">
                      <Upload size={14} /> + Plik
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(adminFiles[activeAdminSection] || []).length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">Brak plików i folderów w tej sekcji.</p>
                  ) : (
                    (adminFiles[activeAdminSection] || []).map((item) => (
                      <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200">
                        <div className="flex items-center gap-2">
                          {item.isFolder ? <Folder className="text-amber-400" size={16} /> : <File className="text-blue-400" size={16} />}
                          <span className="font-semibold">{item.name}</span>
                        </div>

                        <button onClick={() => handleDeleteAdminItem(item.id)} className="p-1 text-slate-500 hover:text-rose-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 6: USTAWIENIA (EDYCJA NAZWY FIRMY, DANYCH, LOGO, HASŁA I LOGINU ADMINA)
             ========================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl space-y-6">
              <form onSubmit={handleSaveCompanySettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Settings className="text-amber-400" size={18} /> Ustawienia Nazwy Firmy, Logo oraz Konta Admina
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Pełna Nazwa Firmy (Zmienia nagłówek i pkt 1):</label>
                    <input
                      type="text"
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">NIP:</label>
                      <input
                        type="text"
                        value={company.nip}
                        onChange={(e) => setCompany({ ...company, nip: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">REGON / KRS:</label>
                      <input
                        type="text"
                        value={company.regon}
                        onChange={(e) => setCompany({ ...company, regon: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                      />
                    </div>
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
                    <label className="block text-slate-400 mb-1">URL Logo (Link do obrazu logo):</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={company.logo_url}
                      onChange={(e) => setCompany({ ...company, logo_url: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>

                  <hr className="border-slate-800 my-4" />

                  <h4 className="font-bold text-amber-400 text-xs uppercase">Dane Logowania Administratora</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Login / Email Admina:</label>
                      <input
                        type="email"
                        value={company.email}
                        onChange={(e) => setCompany({ ...company, email: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Nowe Hasło Admina:</label>
                      <input
                        type="password"
                        value={adminCredentials.password}
                        onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all"
                >
                  Zapisz Zmiany w Ustawieniach
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: DODAWANIE AKTUALNOŚCI */}
      {showAddNewsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Dodaj Komunikat / Aktualność</h4>
              <button onClick={() => setShowAddNewsModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tytuł aktualności:</label>
                <input
                  type="text"
                  value={newNewsTitle}
                  onChange={(e) => setNewNewsTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Treść komunikatu:</label>
                <textarea
                  rows={4}
                  value={newNewsContent}
                  onChange={(e) => setNewNewsContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddNewsModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleAddNews} disabled={loading} className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
                Opublikuj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DODAWANIE SEKCI W ADMINISTRACJI */}
      {showAddAdminSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Nowy Panel / Zakładka</h4>
              <button onClick={() => setShowAddAdminSectionModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nazwa nowej zakładki (np. Umowy, Auta):</label>
                <input
                  type="text"
                  value={newAdminSectionTitle}
                  onChange={(e) => setNewAdminSectionTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddAdminSectionModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleAddAdminSection} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                Utwórz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}