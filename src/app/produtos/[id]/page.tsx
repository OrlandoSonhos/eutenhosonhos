'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Plus, Minus, Star, Shield, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
      } else {
        router.push('/produtos')
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error)
      router.push('/produtos')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity)
    }
  }

  const addToCart = async () => {
    if (!product) return

    setAddingToCart(true)
    try {
      // Buscar carrinho atual do localStorage
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
      
      // Verificar se o produto já está no carrinho
      const existingItemIndex = currentCart.findIndex((item: { id: string }) => item.id === product.id)
      
      if (existingItemIndex >= 0) {
        // Atualizar quantidade
        currentCart[existingItemIndex].quantity += quantity
      } else {
        // Adicionar novo item
        currentCart.push({
          id: product.id,
          title: product.title,
          price_cents: product.price_cents,
          quantity: quantity,
          stock: product.stock
        })
      }
      
      // Salvar no localStorage
      localStorage.setItem('cart', JSON.stringify(currentCart))
      
      // Disparar evento customizado para atualizar o header
      window.dispatchEvent(new Event('cartUpdated'))
      
      // Feedback visual
      alert('Produto adicionado ao carrinho!')
      
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
      alert('Erro ao adicionar produto ao carrinho')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
          <Link
            href="/produtos"
            className="text-brand-primary hover:text-brand-primary/80"
          >
            Voltar para produtos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/produtos"
            className="inline-flex items-center text-brand-primary hover:text-brand-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para produtos
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-lg">Imagem do produto</span>
              </div>
              
              {/* Thumbnail images placeholder */}
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-100 rounded border-2 border-transparent hover:border-indigo-500 cursor-pointer"
                  />
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                
                {/* Rating placeholder */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">(4.8) • 127 avaliações</span>
                </div>

                <div className="text-3xl font-bold text-brand-primary mb-4">
                  {formatCurrency(product.price_cents)}
                </div>

                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                {product.stock > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-success font-medium">
                      {product.stock} unidades em estoque
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-error rounded-full"></div>
                <span className="text-error font-medium">Produto esgotado</span>
                  </>
                )}
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-semibold w-12 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.stock}
                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={addToCart}
                    disabled={addingToCart}
                    className="w-full bg-brand-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-brand-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {addingToCart ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Adicionar ao Carrinho
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Features */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Vantagens da compra
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-success mr-3" />
                    <span className="text-gray-700">Garantia de 1 ano</span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="w-5 h-5 text-brand-primary mr-3" />
                    <span className="text-gray-700">Frete grátis acima de R$ 200</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-brand-accent mr-3" />
                    <span className="text-gray-700">Use seus cartões de desconto para economizar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Produtos Relacionados
          </h2>
          <div className="text-center py-8 text-gray-500">
            <p>Produtos relacionados serão exibidos aqui</p>
          </div>
        </div>
      </div>
    </div>
  )
}