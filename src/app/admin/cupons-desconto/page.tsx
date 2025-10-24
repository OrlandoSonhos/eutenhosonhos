'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface DiscountCoupon {
  id: string
  code: string
  discount_percent: number
  type: 'PERMANENT_25' | 'SPECIAL_50'
  sale_price_cents?: number
  is_active: boolean
  valid_from?: string
  valid_until?: string
  max_uses?: number
  current_uses: number
  uses_count: number
  is_expired: boolean
  is_not_started: boolean
  created_at: string
  updated_at: string
}

interface CreateCouponData {
  discount_percent: number
  type: 'PERMANENT_25' | 'SPECIAL_50'
  sale_price_cents?: number
  is_active: boolean
  valid_from?: string
  valid_until?: string
  max_uses?: number
}

interface EditCouponData extends CreateCouponData {
  // Código não é editável, é gerado automaticamente
}

export default function DiscountCouponsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<DiscountCoupon | null>(null)
  const [formData, setFormData] = useState<CreateCouponData>({
    discount_percent: 25,
    type: 'PERMANENT_25',
    sale_price_cents: undefined,
    is_active: true,
    valid_from: '',
    valid_until: '',
    max_uses: undefined
  })
  const [editFormData, setEditFormData] = useState<EditCouponData>({
    discount_percent: 25,
    type: 'PERMANENT_25',
    sale_price_cents: undefined,
    is_active: true,
    valid_from: '',
    valid_until: '',
    max_uses: undefined
  })

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    active: '',
    type: ''
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      router.push('/admin/login')
      return
    }
    fetchCoupons()
  }, [session, status, pagination.page, filters])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.active && { active: filters.active }),
        ...(filters.type && { type: filters.type })
      })

      const response = await fetch(`/api/admin/discount-coupons?${params}`)
      const data = await response.json()

      if (response.ok) {
        setCoupons(data.coupons)
        setPagination(prev => ({ ...prev, ...data.pagination }))
      } else {
        toast.error(data.error || 'Erro ao carregar cupons')
      }
    } catch (error) {
      toast.error('Erro ao carregar cupons')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Preparar dados com formato correto de datas
      const dataToSend = {
        ...editFormData,
        valid_from: editFormData.valid_from ? new Date(editFormData.valid_from).toISOString() : undefined,
        valid_until: editFormData.valid_until ? new Date(editFormData.valid_until).toISOString() : undefined
      }

      // Remover campos undefined
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key as keyof typeof dataToSend] === undefined) {
          delete dataToSend[key as keyof typeof dataToSend]
        }
      })

      const response = await fetch('/api/admin/discount-coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Cartão criado com sucesso!')
        setShowCreateModal(false)
        resetForm()
        fetchCoupons()
      } else {
        toast.error(data.error || 'Erro ao criar cartão')
      }
    } catch (error) {
      toast.error('Erro ao criar cartão')
      console.error(error)
    }
  }

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCoupon) return

    try {
      // Preparar dados com formato correto de datas (código não é editável)
      const dataToSend = {
        ...editFormData,
        valid_from: editFormData.valid_from ? new Date(editFormData.valid_from).toISOString() : undefined,
        valid_until: editFormData.valid_until ? new Date(editFormData.valid_until).toISOString() : undefined
      }

      // Remover campos undefined
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key as keyof typeof dataToSend] === undefined) {
          delete dataToSend[key as keyof typeof dataToSend]
        }
      })

      const response = await fetch(`/api/admin/discount-coupons/${selectedCoupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Cartão atualizado com sucesso!')
        setShowEditModal(false)
        setSelectedCoupon(null)
        resetForm()
        fetchCoupons()
      } else {
        toast.error(data.error || 'Erro ao atualizar cartão')
      }
    } catch (error) {
      toast.error('Erro ao atualizar cartão')
      console.error('Erro na requisição:', error)
    }
  }

  const handleDeleteCoupon = async (coupon: DiscountCoupon) => {
    if (!confirm(`Tem certeza que deseja deletar o cartão ${coupon.code}?`)) return

    try {
      const response = await fetch(`/api/admin/discount-coupons/${coupon.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Cartão deletado com sucesso!')
        fetchCoupons()
      } else {
        toast.error(data.error || 'Erro ao deletar cartão')
      }
    } catch (error) {
      toast.error('Erro ao deletar cartão')
      console.error(error)
    }
  }

  const resetForm = () => {
    setFormData({
      discount_percent: 25,
      type: 'PERMANENT_25',
      sale_price_cents: undefined,
      is_active: true,
      valid_from: '',
      valid_until: '',
      max_uses: undefined
    })
    setEditFormData({
      discount_percent: 25,
      type: 'PERMANENT_25',
      sale_price_cents: undefined,
      is_active: true,
      valid_from: '',
      valid_until: '',
      max_uses: undefined
    })
  }

  const openEditModal = (coupon: DiscountCoupon) => {
    setSelectedCoupon(coupon)
    
    // Para cupons especiais, definir datas padrão se não existirem
    let validFrom = ''
    let validUntil = ''
    
    if (coupon.type === 'SPECIAL_50') {
      if (coupon.valid_from) {
        validFrom = new Date(coupon.valid_from).toISOString().slice(0, 16)
      } else {
        // Data padrão: hoje
        validFrom = new Date().toISOString().slice(0, 16)
      }
      
      if (coupon.valid_until) {
        validUntil = new Date(coupon.valid_until).toISOString().slice(0, 16)
      } else {
        // Data padrão: 7 dias a partir de hoje
        const defaultEndDate = new Date()
        defaultEndDate.setDate(defaultEndDate.getDate() + 7)
        validUntil = defaultEndDate.toISOString().slice(0, 16)
      }
    } else {
      validFrom = coupon.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : ''
      validUntil = coupon.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : ''
    }
    
    setEditFormData({
      discount_percent: coupon.discount_percent,
      type: coupon.type,
      sale_price_cents: coupon.sale_price_cents || undefined,
      is_active: coupon.is_active,
      valid_from: validFrom,
      valid_until: validUntil,
      max_uses: coupon.max_uses || undefined
    })
    setShowEditModal(true)
  }

  const getStatusBadge = (coupon: DiscountCoupon) => {
    if (!coupon.is_active) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inativo</span>
    }
    if (coupon.is_expired) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expirado</span>
    }
    if (coupon.is_not_started) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Aguardando</span>
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativo</span>
  }

  const getTypeBadge = (type: string) => {
    return type === 'PERMANENT_25' 
      ? <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">25% Permanente</span>
      : <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">50% Especial</span>
  }

  // Loading de autenticação
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  // Não autenticado
  if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
    return null // O useEffect já fez o redirect
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartões de Desconto</h1>
          <p className="text-gray-600">Gerencie cartões de 25% e 50% de desconto</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary/90 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Novo Cartão
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Código do cartão..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.active}
              onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">Todos</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">Todos</option>
              <option value="PERMANENT_25">25% Permanente</option>
              <option value="SPECIAL_50">50% Especial</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ search: '', active: '', type: '' })
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando cupons...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Desconto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço de Venda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validade
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons.map((coupon) => (
                    <tr 
                      key={coupon.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openEditModal(coupon)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(coupon.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{coupon.discount_percent}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coupon.sale_price_cents ? `R$ ${(coupon.sale_price_cents / 100).toFixed(2)}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(coupon)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coupon.uses_count}
                          {coupon.max_uses && ` / ${coupon.max_uses}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {coupon.valid_from && coupon.valid_until ? (
                            <>
                              {new Date(coupon.valid_from).toLocaleDateString('pt-BR')} - {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}
                            </>
                          ) : (
                            'Permanente'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(coupon)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCoupon(coupon)
                            }}
                            className="text-red-600 hover:text-red-900"
                            disabled={coupon.uses_count > 0}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
                      <span className="font-medium">{pagination.total}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.page
                              ? 'z-10 bg-brand-primary border-brand-primary text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Próximo
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Criar Cartão */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Cartão</h3>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => {
                      const type = e.target.value as 'PERMANENT_25' | 'SPECIAL_50'
                      setEditFormData(prev => ({ 
                        ...prev, 
                        type,
                        discount_percent: type === 'PERMANENT_25' ? 25 : 50
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="PERMANENT_25">25% Permanente</option>
                    <option value="SPECIAL_50">50% Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.sale_price_cents ? (editFormData.sale_price_cents / 100).toFixed(2) : ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditFormData(prev => ({ 
                        ...prev, 
                        sale_price_cents: value ? Math.round(parseFloat(value) * 100) : undefined
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Ex: 10.00"
                  />
                </div>

                {editFormData.type === 'SPECIAL_50' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                      <input
                        type="datetime-local"
                        required
                        value={editFormData.valid_from}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                      <input
                        type="datetime-local"
                        required
                        value={editFormData.valid_until}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Usos (opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Cartão ativo
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
                  >
                    Criar Cartão
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Cartão */}
      {showEditModal && selectedCoupon && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Cartão</h3>
              <form onSubmit={handleUpdateCoupon} className="space-y-4">


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => {
                      const type = e.target.value as 'PERMANENT_25' | 'SPECIAL_50'
                      setEditFormData(prev => ({ 
                        ...prev, 
                        type,
                        discount_percent: type === 'PERMANENT_25' ? 25 : 50
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="PERMANENT_25">25% Permanente</option>
                    <option value="SPECIAL_50">50% Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.sale_price_cents ? (editFormData.sale_price_cents / 100).toFixed(2) : ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditFormData(prev => ({ 
                        ...prev, 
                        sale_price_cents: value ? Math.round(parseFloat(value) * 100) : undefined
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Ex: 10.00"
                  />
                </div>

                {editFormData.type === 'SPECIAL_50' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                      <input
                        type="datetime-local"
                        required
                        value={editFormData.valid_from}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                      <input
                        type="datetime-local"
                        required
                        value={editFormData.valid_until}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Usos (opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.max_uses || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, max_uses: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={editFormData.is_active}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                  />
                  <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-900">
                    Cartão ativo
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedCoupon(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}