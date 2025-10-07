'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ShoppingCartIcon
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
  total_revenue: number
  order_items: Array<{
    id: string
    quantity: number
    price_cents: number
    order: {
      id: string
      status: string
      created_at: string
      user: {
        name: string
        email: string
      }
    }
  }>
}

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Carregar produto
  useEffect(() => {
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/login')
      return
    }

    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Produto não encontrado')
        }

        const data = await response.json()
        setProduct(data.product)
      } catch (error) {
        console.error('Erro ao carregar produto:', error)
        setError('Erro ao carregar produto')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [session, params.id, router])

  // Excluir produto
  const handleDeleteProduct = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir produto')
      }

      router.push('/admin/produtos')
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert(error instanceof Error ? error.message : 'Erro ao excluir produto')
    }
  }

  // Alternar status do produto
  const toggleProductStatus = async () => {
    if (!product) return

    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: !product.active })
      })

      if (!response.ok) {
        throw new Error('Erro ao alterar status do produto')
      }

      const data = await response.json()
      setProduct(data.product)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error || 'Produto não encontrado'}</div>
        <Link
          href="/admin/produtos"
          className="text-blue-600 hover:text-blue-800"
        >
          Voltar para produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/produtos"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <p className="text-gray-600">Detalhes do produto</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleProductStatus}
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              product.active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {product.active ? 'Ativo' : 'Inativo'}
          </button>
          <Link
            href={`/admin/produtos/${product.id}/editar`}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
          >
            <PencilIcon className="h-5 w-5" />
          </Link>
          <button
            onClick={handleDeleteProduct}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Preço</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price_cents)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CubeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Estoque</p>
              <p className="text-2xl font-bold text-gray-900">{product.stock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingCartIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vendas</p>
              <p className="text-2xl font-bold text-gray-900">{product.sales_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(product.total_revenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do produto */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <p className="mt-1 text-sm text-gray-900">{product.title}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <p className="mt-1 text-sm text-gray-900">{product.description}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Criado em</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(product.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Imagens */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagens</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {product.images.map((image, index) => (
              <div key={index} className="relative">
                <Image
                  src={image}
                  alt={`${product.title} - Imagem ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico de vendas */}
      {product.order_items.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Histórico de Vendas</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {product.order_items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link href={`/admin/pedidos/${item.order.id}`}>
                        #{item.order.id.slice(-8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.order.user.name}</div>
                      <div className="text-sm text-gray-500">{item.order.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(item.price_cents * item.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.order.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : item.order.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.order.status === 'PAID' ? 'Pago' : 
                         item.order.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}