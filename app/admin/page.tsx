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
  Search,
  Plus,
  Edit3,
  Folder,
  File,
  X,
  Upload,
  BarChart2,
  Menu,
  ChevronRight,
  Megaphone,
  Trash2,
  FolderPlus,
  LogOut,
  FolderOpen,
  ArrowLeft,
  Check,
  Camera,
  HardHat,
  FileUp,
  Image,
  Eye,
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()

  // ---------------------------------------------------------------------------
  // 1. STANY NAWIGACJI I SZUFLAD
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'company' | 'inwestycje' | 'admin_office' | 'workers' | 'orders' | 'settings'>('company')
  const [isMainSidebarOpen, setIsMainSidebarOpen] = useState(false)
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false)
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Ukryte inputy dla aparatu i eksploratora plików
  const projectFileInputRef = useRef<HTMLInputElement>(null)
  const projectCameraInputRef = useRef<HTMLInputElement>(null)
  const adminFileInputRef = useRef<HTMLInputElement>(null)
  const adminCameraInputRef = useRef<HTMLInputElement>(null)

  // Gest Swipe
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  // ---------------------------------------------------------------------------
  // 2. DANE Z SUPABASE
  // ---------------------------------------------------------------------------
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

  const [projects, setProjects] = useState<any[]>([])
  const [newsList, setNewsList] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])

  // ---------------------------------------------------------------------------
  // 3. FIRMA & AKTUALNOŚCI
  // ---------------------------------------------------------------------------
  const [newNewsTitle, setNewNewsTitle] = useState('')
  const [newNewsContent, setNewNewsContent] = useState('')
  const [showAddNewsModal, setShowAddNewsModal] = useState(false)

  // ---------------------------------------------------------------------------
  // 4. INWESTYCJE
  // ---------------------------------------------------------------------------
  const [projectSearchTerm, setProjectSearchTerm] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [inwestycjeSubTab, setInwestycjeSubTab] = useState<'valuations' | 'docs' | 'stats'>('docs')

  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [newProjTitle, setNewProjTitle] = useState('')
  const [newProjLocation, setNewProjLocation] = useState('')

  // Menedżer folderów i plików w Inwestycjach
  const [projectTreeItems, setProjectTreeItems] = useState<{ [projId: string]: any[] }>({})
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [showAddFolderModal, setShowAddFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showFileChoiceModal, setShowFileChoiceModal] = useState(false)

  // ---------------------------------------------------------------------------
  // 5. ADMINISTRACJA
  // ---------------------------------------------------------------------------
  const [adminSearchTerm, setAdminSearchTerm] = useState('')
  const [adminCategories, setAdminCategories] = useState<string[]>(['Umowy i Leasingi', 'Dokumentacja BHP', 'Flota Samochodowa'])
  const [selectedAdminCategory, setSelectedAdminCategory] = useState<string>('Umowy i Leasingi')
  const [showAddAdminCatModal, setShowAddAdminCatModal] = useState(false)
  const [newAdminCatTitle, setNewAdminCatTitle] = useState('')

  const [adminTreeItems, setAdminTreeItems] = useState<{ [catName: string]: any[] }>({})
  const [currentAdminFolderId, setCurrentAdminFolderId] = useState<string | null>(null)
  const [showAddAdminFolderModal, setShowAddAdminFolderModal] = useState(false)
  const [newAdminFolderName, setNewAdminFolderName] = useState('')
  const [showAdminFileChoiceModal, setShowAdminFileChoiceModal] = useState(false)

  // ---------------------------------------------------------------------------
  // 6. PRACOWNICI
  // ---------------------------------------------------------------------------
  const [selectedWorker, setSelectedWorker] = useState<any>(null)
  const [editingWorkerRate, setEditingWorkerRate] = useState('')
  const [editingWorkerAllowance, setEditingWorkerAllowance] = useState('')
  const [editingWorkerPhone, setEditingWorkerPhone] = useState('')

  // ---------------------------------------------------------------------------
  // 7. ZAMÓWIENIA
  // ---------------------------------------------------------------------------
  const [selectedOrderModal, setSelectedOrderModal] = useState<any>(null)
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('')
  const [orderDeliveryPlace, setOrderDeliveryPlace] = useState('')
  const [orderDeliveryCarrier, setOrderDeliveryCarrier] = useState('')

  const [showCreateAdminOrderModal, setShowCreateAdminOrderModal] = useState(false)
  const [adminOrderProjId, setAdminOrderProjId] = useState('')
  const [adminOrderItemName, setAdminOrderItemName] = useState('')
  const [adminOrderQuantity, setAdminOrderQuantity] = useState('')

  // ---------------------------------------------------------------------------
  // 8. LIGHTBOX PODGLĄDU
  // ---------------------------------------------------------------------------
  const [previewFile, setPreviewFile] = useState<{ title: string; url: string } | null>(null)

  // ---------------------------------------------------------------------------
  // EFFECT: ŁADOWANIE DANYCH ORAZ BLOKADA PRZYPADKOWEGO COFANIA DO LOGOWANIA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchAdminData()

    // Blokada wyjścia do ekranu logowania przy użyciu przycisku "Wstecz" na telefonie
    window.history.pushState(null, '', window.location.href)

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      window.history.pushState(null, '', window.location.href)

      // Zamiast wylogowania, zamykamy otwarte okna w kolejności priorytetu
      if (showAddProjectModal) setShowAddProjectModal(false)
      else if (showAddFolderModal) setShowAddFolderModal(false)
      else if (showFileChoiceModal) setShowFileChoiceModal(false)
      else if (showAddAdminCatModal) setShowAddAdminCatModal(false)
      else if (showAddAdminFolderModal) setShowAddAdminFolderModal(false)
      else if (showAdminFileChoiceModal) setShowAdminFileChoiceModal(false)
      else if (showAddNewsModal) setShowAddNewsModal(false)
      else if (selectedWorker) setSelectedWorker(null)
      else if (selectedOrderModal) setSelectedOrderModal(null)
      else if (showCreateAdminOrderModal) setShowCreateAdminOrderModal(false)
      else if (previewFile) setPreviewFile(null)
      else if (isMainSidebarOpen) setIsMainSidebarOpen(false)
      else if (isProjectDrawerOpen) setIsProjectDrawerOpen(false)
      else if (isAdminDrawerOpen) setIsAdminDrawerOpen(false)
      else if (currentFolderId) setCurrentFolderId(null)
      else if (currentAdminFolderId) setCurrentAdminFolderId(null)
      else if (activeTab !== 'company') setActiveTab('company')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [
    showAddProjectModal,
    showAddFolderModal,
    showFileChoiceModal,
    showAddAdminCatModal,
    showAddAdminFolderModal,
    showAdminFileChoiceModal,
    showAddNewsModal,
    selectedWorker,
    selectedOrderModal,
    showCreateAdminOrderModal,
    previewFile,
    isMainSidebarOpen,
    isProjectDrawerOpen,
    isAdminDrawerOpen,
    currentFolderId,
    currentAdminFolderId,
    activeTab,
  ])

  // Obsługa gestu SWIPE
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
    setLoading(true)
    try {
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
      const { data: vacData } = await supabase.from('vacation_requests').select('*, profiles(full_name)').order('created_at', { ascending: false })
      if (vacData) setLeaveRequests(vacData)

      if (profData) setWorkers(profData)

      const { data: ordData } = await supabase.from('material_requests').select('*, projects(title), profiles(full_name)').order('created_at', { ascending: false })
      if (ordData) setOrders(ordData)
    } catch (err: any) {
      console.error('Błąd pobierania danych:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- USTAWIENIA FIRMY ---
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
        alert('Zaktualizowano dane firmy!')
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

  // --- AKTUALNOŚCI ---
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

  // --- NAPRAWIONE DODAWANIE BUDOWY ---
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjTitle.trim()) {
      alert('Proszę podać nazwę budowy!')
      return
    }

    setLoading(true)

    try {
      const payload = {
        title: newProjTitle.trim(),
        location: newProjLocation.trim() || 'Plac Budowy',
        status: 'w_toku',
      }

      const { data, error } = await supabase.from('projects').insert([payload]).select().single()

      if (error) {
        // Próba zapisu awaryjnego (tylko wymagane pola)
        const fallback = await supabase.from('projects').insert([{ title: newProjTitle.trim() }]).select().single()
        if (fallback.data) {
          alert('Dodano nową inwestycję!')
          setProjects((prev) => [...prev, fallback.data])
          setSelectedProjectId(fallback.data.id)
          setShowAddProjectModal(false)
          setNewProjTitle('')
          setNewProjLocation('')
        } else {
          alert('Błąd dodawania budowy: ' + error.message)
        }
      } else if (data) {
        alert('Dodano nową inwestycję!')
        setProjects((prev) => [...prev, data])
        setSelectedProjectId(data.id)
        setShowAddProjectModal(false)
        setNewProjTitle('')
        setNewProjLocation('')
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- INWESTYCJE: FOLDERY I PLIKI ---
  const handleCreateProjectFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim() || !selectedProjectId) return

    const now = new Date()
    const formattedDate = now.toLocaleDateString('pl-PL') + ' ' + now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      isFolder: true,
      parentId: currentFolderId,
      createdAt: formattedDate,
    }

    setProjectTreeItems((prev) => ({
      ...prev,
      [selectedProjectId]: [...(prev[selectedProjectId] || []), newFolder],
    }))

    setNewFolderName('')
    setShowAddFolderModal(false)
  }

  const handleUploadProjectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedProjectId) return

    setLoading(true)
    setShowFileChoiceModal(false)
    const file = files[0]
    const now = new Date()
    const formattedDate = now.toLocaleDateString('pl-PL') + ' ' + now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `projects/${selectedProjectId}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`

      const { error: uploadErr } = await supabase.storage.from('project-photos').upload(fileName, file)
      let publicUrl = ''

      if (!uploadErr) {
        const { data } = supabase.storage.from('project-photos').getPublicUrl(fileName)
        publicUrl = data?.publicUrl || ''
      }

      const newFileItem = {
        id: Date.now().toString(),
        name: file.name,
        isFolder: false,
        parentId: currentFolderId,
        createdAt: formattedDate,
        fileUrl: publicUrl,
      }

      setProjectTreeItems((prev) => ({
        ...prev,
        [selectedProjectId]: [...(prev[selectedProjectId] || []), newFileItem],
      }))
    } catch (err: any) {
      alert('Błąd wgrywania pliku: ' + err.message)
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  const handleDeleteProjectTreeItem = (itemId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten element?')) {
      setProjectTreeItems((prev) => ({
        ...prev,
        [selectedProjectId]: (prev[selectedProjectId] || []).filter((item) => item.id !== itemId && item.parentId !== itemId),
      }))
    }
  }

  const currentProjectFolderItems = useMemo(() => {
    if (!selectedProjectId) return []
    const allItems = projectTreeItems[selectedProjectId] || []
    return allItems.filter((item) => item.parentId === currentFolderId)
  }, [projectTreeItems, selectedProjectId, currentFolderId])

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title, 'pl'))
  }, [projects, projectSearchTerm])

  const selectedProjectObj = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0]
  }, [projects, selectedProjectId])

  // --- ADMINISTRACJA: KATEGORIE, FOLDERY I PLIKI ---
  const handleCreateAdminCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminCatTitle.trim()) return

    if (!adminCategories.includes(newAdminCatTitle.trim())) {
      setAdminCategories((prev) => [...prev, newAdminCatTitle.trim()])
      setSelectedAdminCategory(newAdminCatTitle.trim())
    }
    setNewAdminCatTitle('')
    setShowAddAdminCatModal(false)
  }

  const handleCreateAdminFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminFolderName.trim() || !selectedAdminCategory) return

    const now = new Date()
    const formattedDate = now.toLocaleDateString('pl-PL') + ' ' + now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

    const newFolder = {
      id: Date.now().toString(),
      name: newAdminFolderName.trim(),
      isFolder: true,
      parentId: currentAdminFolderId,
      createdAt: formattedDate,
    }

    setAdminTreeItems((prev) => ({
      ...prev,
      [selectedAdminCategory]: [...(prev[selectedAdminCategory] || []), newFolder],
    }))

    setNewAdminFolderName('')
    setShowAddAdminFolderModal(false)
  }

  const handleUploadAdminFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedAdminCategory) return

    setLoading(true)
    setShowAdminFileChoiceModal(false)
    const file = files[0]
    const now = new Date()
    const formattedDate = now.toLocaleDateString('pl-PL') + ' ' + now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `admin/${selectedAdminCategory}/${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`

      const { error: uploadErr } = await supabase.storage.from('project-photos').upload(fileName, file)
      let publicUrl = ''

      if (!uploadErr) {
        const { data } = supabase.storage.from('project-photos').getPublicUrl(fileName)
        publicUrl = data?.publicUrl || ''
      }

      const newFileItem = {
        id: Date.now().toString(),
        name: file.name,
        isFolder: false,
        parentId: currentAdminFolderId,
        createdAt: formattedDate,
        fileUrl: publicUrl,
      }

      setAdminTreeItems((prev) => ({
        ...prev,
        [selectedAdminCategory]: [...(prev[selectedAdminCategory] || []), newFileItem],
      }))
    } catch (err: any) {
      alert('Błąd wgrywania pliku: ' + err.message)
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  const handleDeleteAdminTreeItem = (itemId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten element?')) {
      setAdminTreeItems((prev) => ({
        ...prev,
        [selectedAdminCategory]: (prev[selectedAdminCategory] || []).filter((item) => item.id !== itemId && item.parentId !== itemId),
      }))
    }
  }

  const currentAdminFolderItems = useMemo(() => {
    if (!selectedAdminCategory) return []
    const allItems = adminTreeItems[selectedAdminCategory] || []
    return allItems.filter((item) => item.parentId === currentAdminFolderId)
  }, [adminTreeItems, selectedAdminCategory, currentAdminFolderId])

  const filteredAdminCategories = useMemo(() => {
    return adminCategories.filter((cat) => cat.toLowerCase().includes(adminSearchTerm.toLowerCase()))
  }, [adminCategories, adminSearchTerm])

  // --- PRACOWNICI ---
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
        alert('Zaktualizowano dane pracownika!')
        setSelectedWorker(null)
        fetchAdminData()
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
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

  // --- ZAMÓWIENIA ---
  const handleApproveOrderModal = (order: any) => {
    setSelectedOrderModal(order)
    setOrderDeliveryDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0])
    setOrderDeliveryPlace(order.projects?.title || 'Plac budowy')
    setOrderDeliveryCarrier('Hurtownia Budowlana Express')
  }

  const handleSaveOrderApprovalSubmit = async () => {
    if (!selectedOrderModal) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('material_requests')
        .update({
          status: 'Potwierdzone',
          delivery_details: {
            date: orderDeliveryDate,
            place: orderDeliveryPlace,
            carrier: orderDeliveryCarrier,
          },
        })
        .eq('id', selectedOrderModal.id)

      if (!error) {
        alert('Zamówienie zostało potwierdzone!')
        setSelectedOrderModal(null)
        fetchAdminData()
      }
    } catch (err: any) {
      alert('Błąd: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdminOrderSubmit = async () => {
    if (!adminOrderItemName || !adminOrderProjId) return
    setLoading(true)
    try {
      const { error } = await supabase.from('material_requests').insert({
        project_id: adminOrderProjId,
        item_name: adminOrderItemName,
        quantity: adminOrderQuantity,
        status: 'pending',
      })

      if (!error) {
        alert('Utworzono zamówienie materiałów!')
        setShowCreateAdminOrderModal(false)
        setAdminOrderItemName('')
        setAdminOrderQuantity('')
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
      {/* Pasek gestu Swipe przy lewej krawędzi */}
      <div
        onClick={() => setIsMainSidebarOpen(true)}
        className="fixed top-0 left-0 bottom-0 w-3 z-40 bg-amber-500/20 hover:bg-amber-500/50 transition-all cursor-pointer"
        title="Przesuń w prawo, aby otworzyć menu główne"
      />

      {isMainSidebarOpen && (
        <div onClick={() => setIsMainSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity" />
      )}

      {/* UKRYTE INPUTY DLA APARATU I PLIKÓW - INWESTYCJE */}
      <input type="file" ref={projectFileInputRef} onChange={handleUploadProjectFile} className="hidden" />
      <input type="file" accept="image/*" capture="environment" ref={projectCameraInputRef} onChange={handleUploadProjectFile} className="hidden" />

      {/* UKRYTE INPUTY DLA APARATU I PLIKÓW - ADMINISTRACJA */}
      <input type="file" ref={adminFileInputRef} onChange={handleUploadAdminFile} className="hidden" />
      <input type="file" accept="image/*" capture="environment" ref={adminCameraInputRef} onChange={handleUploadAdminFile} className="hidden" />

      {/* GŁÓWNY PASEK BOCZNY NAVIGACJI */}
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
                <span>1. Firma</span>
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
            <span>6. Ustawienia</span>
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

      {/* OBSZAR TREŚCI GŁÓWNEJ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        <header className="bg-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMainSidebarOpen(true)}
              className="p-2 bg-slate-800 text-amber-400 rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-bold"
            >
              <Menu size={16} /> Menu
            </button>

            <h2 className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-none">
              {activeTab === 'company' && company.name}
              {activeTab === 'inwestycje' && (selectedProjectObj?.title || 'INWESTYCJE')}
              {activeTab === 'admin_office' && selectedAdminCategory}
              {activeTab === 'workers' && '4. PRACOWNICI'}
              {activeTab === 'orders' && '5. ZAMÓWIENIA MATERIAŁÓW'}
              {activeTab === 'settings' && '6. USTAWIENIA SYSTEMOWE'}
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
                          1. Wyceny
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

                  {/* PRZYCISKI AKCJI I LISTA ELEMENTÓW */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        {currentFolderId && (
                          <button
                            onClick={() => setCurrentFolderId(null)}
                            className="p-1.5 bg-slate-800 text-amber-400 rounded-lg hover:bg-slate-700"
                            title="Wróć do katalogu głównego"
                          >
                            <ArrowLeft size={16} />
                          </button>
                        )}
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <FolderOpen className="text-amber-400" size={16} /> Ścieżka: {currentFolderId ? 'Wewnątrz podfolderu' : 'Katalog Główny'}
                        </span>
                      </div>

                      {/* BEZPOŚREDNIE PRZYCISKI AKCJI */}
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setShowAddFolderModal(true)}
                          className="px-3.5 py-2 bg-slate-800 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 hover:bg-slate-750"
                        >
                          <FolderPlus size={16} /> + Dodaj Folder
                        </button>

                        <button
                          onClick={() => setShowFileChoiceModal(true)}
                          className="px-3.5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:bg-amber-400"
                        >
                          <Plus size={16} /> + Dodaj Plik
                        </button>
                      </div>
                    </div>

                    {/* LISTA ELEMENTÓW */}
                    <div className="space-y-2">
                      {currentProjectFolderItems.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">Katalog jest pusty. Użyj przycisków powyżej, aby dodać folder lub plik.</p>
                      ) : (
                        currentProjectFolderItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200 hover:border-slate-700 transition-all"
                          >
                            {item.isFolder ? (
                              <div
                                onClick={() => setCurrentFolderId(item.id)}
                                className="flex items-center gap-2.5 font-bold text-amber-300 hover:underline cursor-pointer"
                              >
                                <Folder className="text-amber-400 shrink-0" size={18} />
                                <div>
                                  <p className="text-white font-bold">{item.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono font-normal">Utworzono: {item.createdAt}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5 font-medium">
                                <File className="text-blue-400 shrink-0" size={18} />
                                <div>
                                  <p className="text-slate-200 font-semibold">{item.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">Dodano: {item.createdAt}</p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {item.fileUrl && (
                                <button
                                  onClick={() => setPreviewFile({ title: item.name, url: item.fileUrl })}
                                  className="p-1.5 bg-slate-800 text-amber-400 font-semibold rounded-lg text-[11px]"
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              <button onClick={() => handleDeleteProjectTreeItem(item.id)} className="p-1.5 text-slate-500 hover:text-rose-400">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADMINISTRACJA */}
          {activeTab === 'admin_office' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    {currentAdminFolderId && (
                      <button onClick={() => setCurrentAdminFolderId(null)} className="p-1.5 bg-slate-800 text-amber-400 rounded-lg">
                        <ArrowLeft size={16} />
                      </button>
                    )}
                    <h3 className="font-bold text-xs text-white flex items-center gap-2">
                      <Folder className="text-amber-400" size={16} /> Kategoria: <span className="text-amber-400">{selectedAdminCategory}</span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowAddAdminFolderModal(true)}
                      className="px-3.5 py-2 bg-slate-800 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      <FolderPlus size={16} /> + Dodaj Folder
                    </button>

                    <button
                      onClick={() => setShowAdminFileChoiceModal(true)}
                      className="px-3.5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Plus size={16} /> + Dodaj Plik
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentAdminFolderItems.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">Katalog jest pusty.</p>
                  ) : (
                    currentAdminFolderItems.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200">
                        {item.isFolder ? (
                          <div
                            onClick={() => setCurrentAdminFolderId(item.id)}
                            className="flex items-center gap-2.5 font-bold text-amber-300 hover:underline cursor-pointer"
                          >
                            <Folder className="text-amber-400 shrink-0" size={18} />
                            <div>
                              <p className="text-white font-bold">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono font-normal">Utworzono: {item.createdAt}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 font-semibold">
                            <File className="text-blue-400 shrink-0" size={18} />
                            <div>
                              <p className="text-slate-200 font-semibold">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">Dodano: {item.createdAt}</p>
                            </div>
                          </div>
                        )}

                        <button onClick={() => handleDeleteAdminTreeItem(item.id)} className="p-1.5 text-slate-500 hover:text-rose-400">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRACOWNICI */}
          {activeTab === 'workers' && (
            <div className="space-y-5">
              {leaveRequests.filter((l) => l.status === 'pending').length > 0 && (
                <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs text-amber-300">Wnioski Urlopowe (Oczekujące)</h4>
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

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-300">
                  Lista Wszystkich Pracowników ({workers.length})
                </div>

                <div className="divide-y divide-slate-800">
                  {workers.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => {
                        setSelectedWorker(w)
                        setEditingWorkerRate(w.hourly_rate || '35')
                        setEditingWorkerAllowance(w.daily_allowance || '0')
                        setEditingWorkerPhone(w.phone || '')
                      }}
                      className="p-4 hover:bg-slate-850 cursor-pointer flex justify-between items-center transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-white">{w.full_name}</h4>
                        <p className="text-xs text-slate-400">{w.role === 'foreman' ? 'Brygadzista' : 'Pracownik'}</p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-emerald-400 font-bold">{w.hourly_rate || 35} PLN/h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ZAMÓWIENIA */}
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
                  <Plus size={16} /> Dodaj Własne
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

                    {ord.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleApproveOrderModal(ord)}
                          className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
                        >
                          Zatwierdź & Dostawa
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
              <h3 className="font-bold text-xs text-white border-b border-slate-800 pb-3">Ustawienia Nazwy Firmy, Logo i Admina</h3>
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
              <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg">
                Zapisz Ustawienia
              </button>
            </form>
          )}
        </div>
      </div>

      {/* SZUFLADA WYBORU INWESTYCJI */}
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id)
                      setCurrentFolderId(null)
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

      {/* SZUFLADA WYBORU KATEGORII ADMINISTRACJI */}
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

              <div className="flex-1 overflow-y-auto space-y-1.5">
                {filteredAdminCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedAdminCategory(cat)
                      setCurrentAdminFolderId(null)
                      setIsAdminDrawerOpen(false)
                    }}
                    className={`w-full p-3 rounded-xl text-left text-xs font-semibold flex justify-between items-center ${
                      selectedAdminCategory === cat ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DODAWANIE BUDOWY */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateProjectSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Dodaj Nową Budowę</h4>
              <button type="button" onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nazwa Inwestycji / Budowy *</label>
                <input
                  type="text"
                  required
                  placeholder="np. Osiedle Słoneczne Etap 2"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Lokalizacja</label>
                <input
                  type="text"
                  placeholder="np. Warszawa, ul. Prosta 12"
                  value={newProjLocation}
                  onChange={(e) => setNewProjLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAddProjectModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs">
                Anuluj
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md">
                {loading ? 'Tworzenie...' : 'Utwórz Budowę'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DODAWANIE FOLDERU W INWESTYCJACH */}
      {showAddFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateProjectFolderSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Nowy Folder Budowy</h4>
              <button type="button" onClick={() => setShowAddFolderModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="block text-slate-400 mb-1 font-semibold">Nazwa Folderu:</label>
              <input
                type="text"
                required
                placeholder="np. Kosztorysy_2026..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddFolderModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs">
                Anuluj
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md">
                Utwórz Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: WYBÓR ŹRÓDŁA PLIKU (INWESTYCJE) */}
      {showFileChoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Dodaj Plik / Zdjęcie</h4>
              <button onClick={() => setShowFileChoiceModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => projectCameraInputRef.current?.click()}
                className="w-full p-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-md"
              >
                <Camera size={18} /> Zrób Zdjęcie Aparatem
              </button>

              <button
                onClick={() => projectFileInputRef.current?.click()}
                className="w-full p-3.5 bg-slate-800 hover:bg-slate-750 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 border border-slate-700"
              >
                <Upload size={18} /> Wybierz z Pamięci / Dysku
              </button>
            </div>

            <button onClick={() => setShowFileChoiceModal(false)} className="w-full py-2 bg-slate-950 text-slate-400 rounded-xl text-xs mt-2">
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* MODAL: DODAWANIE KATEGORII ADMINISTRACJI */}
      {showAddAdminCatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateAdminCategorySubmit} className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Nowa Kategoria Administracji</h4>
              <button type="button" onClick={() => setShowAddAdminCatModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Nazwa kategorii..."
              value={newAdminCatTitle}
              onChange={(e) => setNewAdminCatTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddAdminCatModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs">
                Anuluj
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                Dodaj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DODAWANIE FOLDERU W ADMINISTRACJI */}
      {showAddAdminFolderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateAdminFolderSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Nowy Folder Administracyjny</h4>
              <button type="button" onClick={() => setShowAddAdminFolderModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Nazwa folderu..."
              value={newAdminFolderName}
              onChange={(e) => setNewAdminFolderName(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddAdminFolderModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs">
                Anuluj
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
                Utwórz
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: WYBÓR ŹRÓDŁA PLIKU (ADMINISTRACJA) */}
      {showAdminFileChoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Dodaj Dokument / Plik</h4>
              <button onClick={() => setShowAdminFileChoiceModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => adminCameraInputRef.current?.click()}
                className="w-full p-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-md"
              >
                <Camera size={18} /> Zrób Zdjęcie Aparatem
              </button>

              <button
                onClick={() => adminFileInputRef.current?.click()}
                className="w-full p-3.5 bg-slate-800 hover:bg-slate-750 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 border border-slate-700"
              >
                <Upload size={18} /> Wybierz z Pamięci / Dysku
              </button>
            </div>

            <button onClick={() => setShowAdminFileChoiceModal(false)} className="w-full py-2 bg-slate-950 text-slate-400 rounded-xl text-xs mt-2">
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDYCJA PRACOWNIKA */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-white">Profil: {selectedWorker.full_name}</h4>
              <button onClick={() => setSelectedWorker(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Stawka [PLN/h]:</label>
                <input
                  type="number"
                  value={editingWorkerRate}
                  onChange={(e) => setEditingWorkerRate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Dieta Dzienna [PLN]:</label>
                <input
                  type="number"
                  value={editingWorkerAllowance}
                  onChange={(e) => setEditingWorkerAllowance(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
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
            <div className="flex gap-2">
              <button onClick={() => setSelectedWorker(null)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleSaveWorkerChanges} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DOSTAWA ZAMÓWIENIA */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-3">Potwierdź Dostawę Zamówienia</h4>
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
                <label className="block text-slate-400 mb-1">Dostawca / Hurtownia:</label>
                <input
                  type="text"
                  value={orderDeliveryCarrier}
                  onChange={(e) => setOrderDeliveryCarrier(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedOrderModal(null)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleSaveOrderApprovalSubmit} className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs">
                Zatwierdź
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ZAMÓWIENIE PRZEZ ADMINA */}
      {showCreateAdminOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-3">Nowe Zamówienie Materiałów</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Budowa:</label>
                <select
                  value={adminOrderProjId}
                  onChange={(e) => setAdminOrderProjId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="">Wybierz...</option>
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
                  value={adminOrderItemName}
                  onChange={(e) => setAdminOrderItemName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Ilość:</label>
                <input
                  type="text"
                  value={adminOrderQuantity}
                  onChange={(e) => setAdminOrderQuantity(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCreateAdminOrderModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleCreateAdminOrderSubmit} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">
                Zamów
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AKTUALNOŚCI */}
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
              <button onClick={() => setShowAddNewsModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs">
                Anuluj
              </button>
              <button onClick={handleAddNews} className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">
                Dodaj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PODGLĄDU PLIKÓW */}
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
            <div className="p-3.5 bg-slate-800 border-t border-slate-700">
              <button onClick={() => setPreviewFile(null)} className="w-full py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs">
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}