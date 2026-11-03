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
  Menu,
  ArrowLeft,
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()

  // Główne nawigacje i szuflady (Drawers)
  const [activeTab, setActiveTab] = useState<'company' | 'realization' | 'admin_office' | 'workers' | 'orders' | 'settings'>('company')
  const [isMainSidebarOpen, setIsMainSidebarOpen] = useState(false)
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false)

  // Gest Swipe
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

  // Aktualności
  const [newNewsTitle, setNewNewsTitle] = useState('')
  const [newNewsContent, setNewNewsContent] = useState('')
  const [showAddNewsModal, setShowAddNewsModal] = useState(false)

  // Dział Realizacji - Budowy & wyszukiwarka
  const [projectSearchTerm, setProjectSearchTerm] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [realizationSubTab, setRealizationSubTab] = useState<'valuations' | 'docs' | 'stats'>('docs')

  // Custom Foldery
  const [customProjectFolders, setCustomProjectFolders] = useState<{ [projId: string]: string[] }>({})
  const [newFolderName, setNewFolderName] = useState('')

  // Administracja - Zakładki i Pliki
  const [adminSections, setAdminSections] = useState<string[]>(['Umowy', 'Dokumenty pracowników', 'Auta / Flota'])
  const [activeAdminSection, setActiveAdminSection] = useState<string>('Umowy')
  const [newAdminSectionTitle, setNewAdminSectionTitle] = useState('')
  const [showAddAdminSectionModal, setShowAddAdminSectionModal] = useState(false)

  const [adminFiles, setAdminFiles] = useState<{ [section: string]: { id: string; name: string; isFolder: boolean }[] }>({
    'Umowy': [
      { id: '1', name: 'Umowy Podwykonawcze 2026', isFolder: true },
      { id: '2', name: 'Umowa_Generalna_2026.pdf', isFolder: false },
    ],
    'Dokumenty pracowników': [
      { id: '3', name: 'Szkolenia_BHP', isFolder: true },
    ],
    'Auta / Flota': [
      { id: '5', name: 'Karty_Paliwowe_Sprinter.pdf', isFolder: false },
    ],
  })
  const [newAdminItemName, setNewAdminItemName] = useState('')

  useEffect(() => {
    fetchAdminData()
  }, [])

  // Obsługa gestu swipe z lewej krawędzi
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = touchEndX.current - touchStartX.current

    // Przesunięcie palca od lewej krawędzi w prawo (< 50px) otwiera główne menu
    if (touchStartX.current < 50 && diffX > 60) {
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

      const { data: newsData } = await supabase.from('company_news').select('*').order('created_at', { ascending: false })
      if (newsData) setNewsList(newsData)

      const { data: projData } = await supabase.from('projects').select('*').order('title', { ascending: true })
      if (projData && projData.length > 0) {
        setProjects(projData)
        if (!selectedProjectId) setSelectedProjectId(projData[0].id)
      }

      const { data: profData } = await supabase.from('profiles').select('*')
      if (profData) setWorkers(profData)

      const { data: ordData } = await supabase.from('material_requests').select('*, projects(title), profiles(full_name)').order('created_at', { ascending: false })
      if (ordData) setOrders(ordData)
    } catch (err: any) {
      console.error('Błąd ładowania danych administratora:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('company_settings').upsert({
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
        alert('Zaktualizowano dane firmy i logo!')
        fetchAdminData()
      } else {
        alert('Błąd: ' + error.message)
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNews = async () => {
    if (!newNewsTitle || !newNewsContent) return
    setLoading(true)

    try {
      const { error } = await supabase.from('company_news').insert({
        title: newNewsTitle,
        content: newNewsContent,
      })

      if (!error) {
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

  // Wyszukiwanie i alfabetyczny podgląd budów
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title, 'pl'))
  }, [projects, projectSearchTerm])

  const selectedProjectObj = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0]
  }, [projects, selectedProjectId])

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId)
    setIsProjectDrawerOpen(false) // Zamknij pasek wyboru
    setIsMainSidebarOpen(false) // Schowaj główne zakładki na mobilkach
  }

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
    if (window.confirm(`Czy na pewno chcesz usunąć zakładkę "${sectionToDelete}"?`)) {
      setAdminSections((prev) => prev.filter((s) => s !== sectionToDelete))
      if (activeAdminSection === sectionToDelete) {
        setActiveAdminSection(adminSections[0] || '')
      }
    }
  }

  const handleAddAdminItem = (isFolder: boolean) => {
    if (!newAdminItemName || !activeAdminSection) return
    const newItem = { id: Date.now().toString(), name: newAdminItemName, isFolder }
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

  const projectsValuation = useMemo(() => projects.filter((p) => p.status === 'w_trakcie_wyceny' || p.status === 'pending'), [projects])
  const projectsInProgress = useMemo(() => projects.filter((p) => p.status === 'w_toku' || p.status === 'in_progress' || !p.status), [projects])
  const projectsCompleted = useMemo(() => projects.filter((p) => p.status === 'zakonczone' || p.status === 'completed'), [projects])

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehaviorX: 'none', touchAction: 'pan-y' }}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col relative overflow-x-hidden select-none"
    >
      {/* Pasek aktywacyjny swipe przy lewej krawędzi */}
      <div
        onClick={() => setIsMainSidebarOpen(true)}
        className="fixed top-0 left-0 bottom-0 w-3 z-40 bg-amber-500/20 hover:bg-amber-500/50 transition-all cursor-pointer"
        title="Przesuń w prawo, aby otworzyć menu główne"
      />

      {/* Tło dla wysuniętego menu */}
      {isMainSidebarOpen && (
        <div onClick={() => setIsMainSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity" />
      )}

      {/* PASEK BOCZNY GŁÓWNEGO MENU (WYSUWANY I STACJONARNY) */}
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
                setActiveTab('realization')
                setIsMainSidebarOpen(false)
                setIsProjectDrawerOpen(true) // Otwórz szufladę wyboru budowy po wejściu
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'realization' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardHat size={16} />
                <span>2. DZIAŁ REALIZACJI</span>
              </div>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('admin_office')
                setIsMainSidebarOpen(false)
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

      {/* OBSZAR GŁÓWNY APLIKACJI */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* MOBILNY NAGŁÓWEK Z PRZYCISKIEM MENU */}
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
              {activeTab === 'realization' && (selectedProjectObj?.title || 'Dział Realizacji')}
              {activeTab === 'admin_office' && '3. Administracja'}
              {activeTab === 'workers' && '4. Pracownicy'}
              {activeTab === 'orders' && '5. Zamówienia'}
              {activeTab === 'settings' && '6. Ustawienia'}
            </h2>
          </div>

          {activeTab === 'realization' && (
            <button
              onClick={() => setIsProjectDrawerOpen(true)}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md"
            >
              Zmień Budowę
            </button>
          )}
        </header>

        {/* TREŚĆ GŁÓWNA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* ==========================================
              TAB 1: FIRMA & AKTUALNOŚCI
             ========================================== */}
          {activeTab === 'company' && (
            <div className="space-y-5">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">PROFIL FIRMY</span>
                  <h1 className="text-xl font-black text-white">{company.name}</h1>
                  <p className="text-xs text-slate-400 mt-0.5">{company.address}</p>
                </div>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Edytuj
                </button>
              </div>

              {/* SEKCJA: AKTUALNOŚCI */}
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

                {newsList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">Brak komunikatów.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newsList.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs text-amber-300">{item.title}</h4>
                          <span className="text-[9px] text-slate-500 font-mono">{new Date(item.created_at).toLocaleDateString('pl-PL')}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* STATYSTYKI BUDÓW */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                <h3 className="font-bold text-xs text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <BarChart2 className="text-blue-400" size={16} /> Statystyki Budów i Budżetu
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-amber-400 uppercase">W trakcie wyceny ({projectsValuation.length})</span>
                    {projectsValuation.map((p) => (
                      <div key={p.id} className="p-2.5 bg-slate-900 rounded-lg text-xs space-y-1">
                        <h5 className="font-bold text-white truncate">{p.title}</h5>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase">W toku ({projectsInProgress.length})</span>
                    {projectsInProgress.map((p) => (
                      <div key={p.id} className="p-2.5 bg-slate-900 rounded-lg text-xs space-y-1">
                        <h5 className="font-bold text-white truncate">{p.title}</h5>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-blue-400 uppercase">Zakończone ({projectsCompleted.length})</span>
                    {projectsCompleted.map((p) => (
                      <div key={p.id} className="p-2.5 bg-slate-900 rounded-lg text-xs space-y-1">
                        <h5 className="font-bold text-white truncate">{p.title}</h5>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: DZIAŁ REALIZACJI (WYCENTROWANA BUDOWA I PODZAKŁADKI)
             ========================================== */}
          {activeTab === 'realization' && (
            <div className="space-y-5">
              {selectedProjectObj && (
                <div className="space-y-4">
                  {/* NAGŁÓWEK WYBRANEJ BUDOWY Z WYCENTROWANĄ NAZWĄ */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl text-center space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">AKTUALNA BUDOWA</span>
                      <h2 className="text-lg md:text-xl font-black text-white mt-0.5">{selectedProjectObj.title}</h2>
                    </div>

                    {/* WYCENTROWANE PODZAKŁADKI BEZPOŚREDNIO POD NAZWĄ BUDOWY */}
                    <div className="flex justify-center pt-1">
                      <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs w-full max-w-md">
                        <button
                          onClick={() => setRealizationSubTab('valuations')}
                          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all text-center ${
                            realizationSubTab === 'valuations' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
                          }`}
                        >
                          1. Wyceny i kosztorysy
                        </button>
                        <button
                          onClick={() => setRealizationSubTab('docs')}
                          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all text-center ${
                            realizationSubTab === 'docs' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
                          }`}
                        >
                          2. Dokumentacja
                        </button>
                        <button
                          onClick={() => setRealizationSubTab('stats')}
                          className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all text-center ${
                            realizationSubTab === 'stats' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'
                          }`}
                        >
                          3. Statystyki
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CUSTOM FOLDERY Z OPCJĄ DODAWANIA I USUWANIA */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <FolderPlus className="text-amber-400" size={16} /> Foldery Budowy
                      </span>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="Nazwa nowego folderu..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="flex-1 sm:w-48 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                        <button onClick={handleAddProjectFolder} className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
                          Dodaj
                        </button>
                      </div>
                    </div>

                    {(customProjectFolders[selectedProjectId] || []).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                        {(customProjectFolders[selectedProjectId] || []).map((fName, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200">
                            <span className="flex items-center gap-2 truncate font-semibold">
                              <Folder className="text-amber-400" size={15} /> {fName}
                            </span>
                            <button onClick={() => handleDeleteProjectFolder(fName)} className="p-1 text-slate-400 hover:text-rose-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ZAWARTOŚĆ DOKUMENTACJI / WYCEN */}
                  {realizationSubTab === 'valuations' && (
                    <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-400 text-center">
                      Kosztorysy i wyceny przygotowane dla budowy {selectedProjectObj.title}.
                    </div>
                  )}

                  {realizationSubTab === 'docs' && (
                    <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-400 text-center">
                      Pliki i zdjęcia nadesłane przez Brygadzistów oraz Pracowników.
                    </div>
                  )}

                  {realizationSubTab === 'stats' && (
                    <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-400 text-center">
                      Statystyki postępu roboczogodzin dla tej budowy.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 3: ADMINISTRACJA (SWOBODNE ZAKŁADKI)
             ========================================== */}
          {activeTab === 'admin_office' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl border border-slate-800 overflow-x-auto gap-2">
                <div className="flex gap-2">
                  {adminSections.map((sec) => (
                    <div key={sec} className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
                      <button
                        onClick={() => setActiveAdminSection(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeAdminSection === sec ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                        }`}
                      >
                        {sec}
                      </button>
                      <button onClick={() => handleDeleteAdminSection(sec)} className="p-1 text-slate-500 hover:text-rose-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddAdminSectionModal(true)}
                  className="px-3 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus size={15} /> Nowa Zakładka
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-xs text-white">
                    Sekcja: <span className="text-amber-400">{activeAdminSection}</span>
                  </h3>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Nazwa pliku/folderu..."
                      value={newAdminItemName}
                      onChange={(e) => setNewAdminItemName(e.target.value)}
                      className="flex-1 sm:w-48 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                    <button onClick={() => handleAddAdminItem(true)} className="px-2.5 py-1.5 bg-slate-800 text-amber-300 font-bold rounded-xl text-xs">
                      + Folder
                    </button>
                    <button onClick={() => handleAddAdminItem(false)} className="px-2.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
                      + Plik
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(adminFiles[activeAdminSection] || []).map((item) => (
                    <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200">
                      <div className="flex items-center gap-2">
                        {item.isFolder ? <Folder className="text-amber-400" size={16} /> : <File className="text-blue-400" size={16} />}
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <button onClick={() => handleDeleteAdminItem(item.id)} className="p-1 text-slate-500 hover:text-rose-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 6: USTAWIENIA
             ========================================== */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveCompanySettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-2xl">
              <h3 className="font-bold text-xs text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Settings className="text-amber-400" size={16} /> Ustawienia Nazwy Firmy i Konta Admina
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Pełna Nazwa Firmy:</label>
                  <input
                    type="text"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Adres Siedziby:</label>
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
                    placeholder="https://..."
                    value={company.logo_url}
                    onChange={(e) => setCompany({ ...company, logo_url: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg">
                Zapisz Ustawienia
              </button>
            </form>
          )}
        </div>
      </div>

      {/* WYSUWANA SZUFLADA DLA WYBORU BUDÓW (DZIAŁ REALIZACJI) */}
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

              {/* WYSZUKIWARKA BUDÓW (A, ad itp.) */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Szukaj budowy..."
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProject(p.id)}
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

      {/* MODAL AKTUALNOŚCI */}
      {showAddNewsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Dodaj Komunikat</h4>
              <button onClick={() => setShowAddNewsModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Tytuł..."
                value={newNewsTitle}
                onChange={(e) => setNewNewsTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <textarea
                rows={3}
                placeholder="Treść..."
                value={newNewsContent}
                onChange={(e) => setNewNewsContent(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowAddNewsModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleAddNews} className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SEKCYI ADMINISTRACJI */}
      {showAddAdminSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Nowa Zakładka</h4>
              <button onClick={() => setShowAddAdminSectionModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Nazwa zakładki..."
              value={newAdminSectionTitle}
              onChange={(e) => setNewAdminSectionTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />

            <div className="flex gap-2">
              <button onClick={() => setShowAddAdminSectionModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleAddAdminSection} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                Stwórz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}