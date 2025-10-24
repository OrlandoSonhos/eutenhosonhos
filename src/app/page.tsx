'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, Filter, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ProductCarousel } from '@/components/ui/product-carousel'

interface Product {
  id: string
  title: string
  description: string
  price_cents: number
  stock: number
  images: string[]
  active: boolean
  created_at: string
}

interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface Category {
  id: string
  name: string
  description: string
  _count?: {
    products: number
  }
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true)
      const response = await fetch('/api/categories?includeCount=true')
      if (response.ok) {
        const data = await response.json()

        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (search) params.append('search', search)
      if (selectedCategory) params.append('category', selectedCategory)

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data: ProductsResponse = await response.json()
        setProducts(data.products)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, selectedCategory])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchProducts()
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setPagination(prev => ({ ...prev, page: 1 }))
    setSidebarOpen(false) // Fechar sidebar no mobile após seleção
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSearch('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Nossos Produtos
          </h1>
          <p className="text-gray-600">
            Descubra nossa seleção de produtos e use seus cartões de desconto para economizar!
          </p>
        </div>

        {/* Search and Mobile Filter Button */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors"
              >
                Buscar
              </button>
            </form>
            
            {/* Mobile Filter Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </button>
            
            {/* Clear Filters Button */}
            {(selectedCategory || search) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpar Filtros
              </button>
            )}
          </div>
          
          {/* Active Filters */}
          {selectedCategory && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-primary text-white">
                {categories.find(cat => cat.id === selectedCategory)?.name}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="ml-2 hover:bg-brand-primary-dark rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias</h3>
              
              {categoriesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedCategory 
                        ? 'bg-brand-primary text-white' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Todas as categorias
                  </button>
                  
                  {Array.isArray(categories) && categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                        selectedCategory === category.id 
                          ? 'bg-brand-primary text-white' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{category.name}</span>
                      {category._count && (
                        <span className="text-sm opacity-75">
                          {category._count.products}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
              <div className="relative bg-white w-80 max-w-sm p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Categorias</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {categoriesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleCategoryChange('')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        !selectedCategory 
                          ? 'bg-brand-primary text-white' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      Todas as categorias
                    </button>
                    
                    {Array.isArray(categories) && categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                          selectedCategory === category.id 
                            ? 'bg-brand-primary text-white' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{category.name}</span>
                        {category._count && (
                          <span className="text-sm opacity-75">
                            {category._count.products}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar sua busca ou navegue por todas as categorias.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <ProductCarousel
                      images={product.images && product.images.length > 0 ? product.images : []}
                      productTitle={product.title}
                      className="h-48"
                    />
                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute top-2 right-2 bg-warning text-white px-2 py-1 rounded text-xs font-medium z-10">
                        Últimas unidades
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute top-2 right-2 bg-error text-white px-2 py-1 rounded text-xs font-medium z-10">
                        Esgotado
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <Link href={`/produtos/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 hover:text-brand-primary transition-colors line-clamp-2 leading-tight min-h-[3.5rem]">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-brand-primary">
                        {formatCurrency(product.price_cents)}
                      </div>
                      <Link
                        href={`/produtos/${product.id}`}
                        className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-dark transition-colors flex items-center text-sm"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Ver
                      </Link>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {product.stock > 0 ? `${product.stock} em estoque` : 'Produto esgotado'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg ${
                          page === pagination.page
                            ? 'bg-brand-primary text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}
