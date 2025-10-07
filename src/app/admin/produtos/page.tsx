'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: string
  title: string
  description: string
  price_cents: number
  stock: number
  images: string[]
  active: boolean
  created_at: string
  sales_count: number
}

interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Verificar autenticação
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/login')
      return
    }
  }, [session, status, router])

  // Carregar produtos
  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(activeFilter !== 'all' && { active: (activeFilter === 'active').toString() })
      })

      const response = await fetch(`/api/admin/products?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos')
      }

      const data: ProductsResponse = await response.json()
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setError('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      loadProducts()
    }
  }, [session, currentPage, searchTerm, activeFilter])

  // Excluir produto
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir produto')
      }

      await loadProducts()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert(error instanceof Error ? error.message : 'Erro ao excluir produto')
    }
  }

  // Alternar status do produto
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Erro ao alterar status do produto')
      }

      await loadProducts()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status do produto')
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h1>
          <p className="text-gray-600">Gerencie todos os produtos da loja</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Novo Produto
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de status */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de produtos */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <Image
                          src={product.images[0] || '/placeholder-product.jpg'}
                          alt={product.title}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(product.price_cents)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`${product.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sales_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleProductStatus(product.id, product.active)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/produtos/${product.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/produtos/${product.id}/editar`}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
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
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span>
                  {' '}até{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>
                  {' '}de{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Nenhum produto encontrado</div>
          <Link
            href="/admin/produtos/novo"
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Criar primeiro produto
          </Link>
        </div>
      )}
    </div>
  )
}