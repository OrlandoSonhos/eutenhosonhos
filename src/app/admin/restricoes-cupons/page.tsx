'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Category {
  id: string
  name: string
  description?: string
}

interface DiscountCoupon {
  id: string
  type: string
  discount_percent: number
  is_active: boolean
}

interface CouponRestriction {
  id: string
  coupon_id: string
  category_id: string
  restriction_type: 'ONLY_CATEGORIES' | 'EXCLUDE_CATEGORIES'
  created_at: string
  coupon: DiscountCoupon
  category: Category
}

interface CreateRestrictionData {
  coupon_id: string
  category_id: string
  restriction_type: 'ONLY_CATEGORIES' | 'EXCLUDE_CATEGORIES'
}

export default function CouponRestrictionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [restrictions, setRestrictions] = useState<CouponRestriction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState<CreateRestrictionData>({
    coupon_id: '',
    category_id: '',
    restriction_type: 'ONLY_CATEGORIES'
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !(session as any).user || (session as any).user.role !== 'ADMIN') {
      router.push('/admin/login')
      return
    }
    fetchData()
  }, [session, status])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchRestrictions(),
        fetchCategories(),
        fetchCoupons()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const fetchRestrictions = async () => {
    try {
      const response = await fetch('/api/admin/coupon-restrictions')
      if (!response.ok) throw new Error('Erro ao buscar restrições')
      const data = await response.json()
      setRestrictions(data.restrictions || [])
    } catch (error) {
      console.error('Erro ao buscar restrições:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Erro ao buscar categorias')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
  }

  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/discount-coupons?limit=100')
      if (!response.ok) throw new Error('Erro ao buscar cupons')
      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      console.error('Erro ao buscar cupons:', error)
    }
  }

  const handleCreateRestriction = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.coupon_id || !formData.category_id) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const response = await fetch('/api/admin/coupon-restrictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar restrição')
      }

      toast.success('Restrição criada com sucesso!')
      setShowCreateModal(false)
      setFormData({
        coupon_id: '',
        category_id: '',
        restriction_type: 'ONLY_CATEGORIES'
      })
      fetchRestrictions()
    } catch (error: any) {
      console.error('Erro ao criar restrição:', error)
      toast.error(error.message || 'Erro ao criar restrição')
    }
  }

  const handleDeleteRestriction = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta restrição?')) return

    try {
      const response = await fetch(`/api/admin/coupon-restrictions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir restrição')
      }

      toast.success('Restrição excluída com sucesso!')
      fetchRestrictions()
    } catch (error: any) {
      console.error('Erro ao excluir restrição:', error)
      toast.error(error.message || 'Erro ao excluir restrição')
    }
  }

  const getRestrictionTypeLabel = (type: string) => {
    switch (type) {
      case 'ONLY_CATEGORIES':
        return 'Apenas nestas categorias'
      case 'EXCLUDE_CATEGORIES':
        return 'Excluir estas categorias'
      default:
        return type
    }
  }

  const getRestrictionTypeColor = (type: string) => {
    switch (type) {
      case 'ONLY_CATEGORIES':
        return 'bg-green-100 text-green-800'
      case 'EXCLUDE_CATEGORIES':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restrições de Cupons</h1>
          <p className="text-gray-600 mt-2">Gerencie restrições de uso de cupons por categoria</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Nova Restrição
        </button>
      </div>

      {/* Lista de Restrições */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cupom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Restrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {restrictions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma restrição encontrada
                  </td>
                </tr>
              ) : (
                restrictions.map((restriction) => (
                  <tr key={restriction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {restriction.coupon.type}
                        </div>
                        <div className="text-sm text-gray-500">
                          {restriction.coupon.discount_percent}% de desconto
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{restriction.category.name}</div>
                      {restriction.category.description && (
                        <div className="text-sm text-gray-500">{restriction.category.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRestrictionTypeColor(restriction.restriction_type)}`}>
                        {getRestrictionTypeLabel(restriction.restriction_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(restriction.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteRestriction(restriction.id)}
                        className="text-red-600 hover:text-red-900 ml-4"
                        title="Excluir restrição"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Restrição de Cupom</h3>
              <form onSubmit={handleCreateRestriction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cupom *
                  </label>
                  <select
                    value={formData.coupon_id}
                    onChange={(e) => setFormData({ ...formData, coupon_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione um cupom</option>
                    {coupons.filter(c => c.is_active).map((coupon) => (
                      <option key={coupon.id} value={coupon.id}>
                        {coupon.type} - {coupon.discount_percent}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Restrição *
                  </label>
                  <select
                    value={formData.restriction_type}
                    onChange={(e) => setFormData({ ...formData, restriction_type: e.target.value as 'ONLY_CATEGORIES' | 'EXCLUDE_CATEGORIES' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="ONLY_CATEGORIES">Apenas nestas categorias</option>
                    <option value="EXCLUDE_CATEGORIES">Excluir estas categorias</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Criar Restrição
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