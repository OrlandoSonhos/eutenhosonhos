'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, ArrowLeft } from 'lucide-react'

interface Product {
  id: string
  title: string
  description: string
  price: number
  stock: number
  images: string[]
  active: boolean
  category?: {
    id: string
    name: string
  }
}

interface Category {
  id: string
  name: string
  description?: string
  active: boolean
  _count: {
    products: number
  }
}

export default function CategoryProductsPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.id as string

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true)
        
        // Buscar categoria
        const categoryResponse = await fetch(`/api/categories/${categoryId}`)
        if (!categoryResponse.ok) {
          throw new Error('Categoria não encontrada')
        }
        const categoryData = await categoryResponse.json()
        setCategory(categoryData.category)

        // Buscar produtos da categoria
        const productsResponse = await fetch(`/api/products?category=${categoryId}`)
        if (!productsResponse.ok) {
          throw new Error('Erro ao carregar produtos')
        }
        const productsData = await productsResponse.json()
        setProducts(productsData.products || [])
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setError(error instanceof Error ? error.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchCategoryAndProducts()
    }
  }, [categoryId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => router.push('/produtos')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-dark"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos produtos
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header da categoria */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/produtos"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Todos os produtos
            </Link>
          </div>
          
          {category && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-lg text-gray-600 mb-4">
                  {category.description}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {category._count.products} produto{category._count.products !== 1 ? 's' : ''} encontrado{category._count.products !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Lista de produtos */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-500 mb-8">
              Esta categoria ainda não possui produtos disponíveis.
            </p>
            <Link
              href="/produtos"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-dark"
            >
              Ver todos os produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link href={`/produtos/${product.id}`}>
                  <div className="aspect-square relative">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <ShoppingCart className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-4">
                  <Link href={`/produtos/${product.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-brand-primary transition-colors truncate">
                      {product.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-brand-primary">
                      {formatPrice(product.price)}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-brand-accent fill-current" />
                        <span className="text-sm text-gray-600 ml-1">4.5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    {product.stock > 0 ? (
                      <span className="text-sm text-success">
                        {product.stock} em estoque
                      </span>
                    ) : (
                      <span className="text-sm text-error">
                        Fora de estoque
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}