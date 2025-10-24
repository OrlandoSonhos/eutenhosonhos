'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ProductCarousel } from '@/components/ui/product-carousel'

interface Product {
  id: string
  title: string
  description: string
  price_cents: number
  stock: number
  images: string // JSON string
}

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products?limit=12')
        const data = await response.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
            <div className="w-full h-64 bg-gray-300"></div>
            <div className="p-6">
              <div className="h-5 bg-gray-300 rounded mb-3"></div>
              <div className="h-4 bg-gray-300 rounded mb-4"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100 group"
        >
          <div className="relative">
            <ProductCarousel
              images={(() => {
                try {
                  return JSON.parse(product.images) as string[]
                } catch {
                  return []
                }
              })()}
              productTitle={product.title}
            />
            
            {/* Overlay com botões */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Link
                href={`/produtos/${product.id}`}
                className="bg-white text-brand-primary px-6 py-3 rounded-full font-semibold hover:bg-brand-primary hover:text-white transition-all duration-300 flex items-center shadow-lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Produto
              </Link>
            </div>

            {/* Badge de estoque */}
            {product.stock <= 5 && product.stock > 0 && (
              <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                Últimas {product.stock} unidades
              </div>
            )}
            {product.stock === 0 && (
              <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                Esgotado
              </div>
            )}
          </div>
          
          <div className="p-6">
            <div className="flex items-center mb-2">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-2">(4.8)</span>
            </div>
            
            <h3 className="font-bold text-gray-900 mb-3 text-lg group-hover:text-brand-primary transition-colors line-clamp-2 leading-tight min-h-[3.5rem]">
              {product.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-brand-primary">
                  {formatCurrency(product.price_cents)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(Math.round(product.price_cents * 1.3))}
                </span>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  23% OFF
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center">
                <ShoppingCart className="w-4 h-4 mr-1" />
                {product.stock > 0 ? `${product.stock} disponível` : 'Indisponível'}
              </span>
              <Link
                href={`/produtos/${product.id}`}
                className="bg-brand-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-primary-dark transition-colors text-sm"
              >
                Comprar
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}