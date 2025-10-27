'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star, Eye } from 'lucide-react'
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

interface FeaturedProductsCarouselProps {
  className?: string
}

export function FeaturedProductsCarousel({ className = '' }: FeaturedProductsCarouselProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null)

  // Buscar produtos em destaque
  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const response = await fetch('/api/products/featured')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Erro ao carregar produtos em destaque:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  // Auto-slide functionality
  useEffect(() => {
    if (products.length <= 1 || isHovered || isTransitioning) return

    autoSlideRef.current = setInterval(() => {
      const newIndex = (currentIndex + 1) % products.length
      handleSlideChange(newIndex)
    }, 8000)

    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current)
      }
    }
  }, [products.length, isHovered, isTransitioning, currentIndex])

  const handleSlideChange = (newIndex: number) => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setCurrentIndex(newIndex)
    
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }

  const nextSlide = () => {
    const newIndex = (currentIndex + 1) % products.length
    handleSlideChange(newIndex)
  }

  const prevSlide = () => {
    const newIndex = (currentIndex - 1 + products.length) % products.length
    handleSlideChange(newIndex)
  }

  const goToSlide = (index: number) => {
    if (index !== currentIndex) {
      handleSlideChange(index)
    }
  }

  if (loading) {
    return (
      <div className={`w-full aspect-[16/9] xs:aspect-[16/8] sm:aspect-[16/7] md:aspect-[16/6] lg:aspect-[16/5] xl:aspect-[16/4] bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl sm:rounded-2xl animate-pulse ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 text-xs xs:text-sm sm:text-base">Carregando produtos em destaque...</div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  const currentProduct = products[currentIndex]

  return (
    <div 
      ref={carouselRef}
      className={`
          relative w-full 
          aspect-[16/9] xs:aspect-[16/8] sm:aspect-[16/6] md:aspect-[16/4] lg:aspect-[16/3]
          min-h-[180px] xs:min-h-[200px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[350px]
          bg-gradient-to-br from-slate-50 via-white to-blue-50/30
          rounded-xl sm:rounded-2xl 
          overflow-hidden 
          border border-white/20
          ${className}
        `}
      style={{
        boxShadow: `
          0 20px 25px -5px rgba(0, 0, 0, 0.1),
          0 10px 10px -5px rgba(0, 0, 0, 0.04),
          inset 0 1px 0 rgba(255, 255, 255, 0.6)
        `,
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
      onMouseEnter={() => {
        setIsHovered(true)
        if (carouselRef.current) {
          carouselRef.current.style.boxShadow = `
            0 25px 50px -12px rgba(0, 0, 0, 0.15),
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8)
          `
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        if (carouselRef.current) {
          carouselRef.current.style.boxShadow = `
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.6)
          `
        }
      }}
    >
      {/* Enhanced Background with Better Visual Design */}
      <div 
        className="absolute inset-0 transition-all duration-500 ease-out" 
        style={{
          transform: isHovered ? 'scale(1.02)' : 'scale(1.01)',
          opacity: isTransitioning ? 0.8 : 1,
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {currentProduct.images && currentProduct.images.length > 0 ? (
          <Image
            src={currentProduct.images[0]}
            alt={currentProduct.title}
            fill
            className="object-cover transition-all duration-500 ease-out"
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
            style={{
              opacity: 0.12,
              filter: 'brightness(1.2) saturate(0.6) blur(2px) contrast(1.1)',
              transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-50/80 via-white to-blue-50/60" />
        )}
        
        {/* Enhanced Multi-layer Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/98 via-white/95 to-blue-50/98" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-blue-100/30" />
        
        {/* Sophisticated Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(45, 125, 142, 0.08) 0%, transparent 40%), 
              radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
              radial-gradient(circle at 60% 20%, rgba(16, 185, 129, 0.04) 0%, transparent 30%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
            `
          }}
        />
        
        {/* Premium Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/98 via-white/92 to-white/85 transition-opacity duration-500 ease-out" />
        
        {/* Subtle Inner Glow */}
        <div 
          className="absolute inset-0 rounded-xl sm:rounded-2xl"
          style={{
            boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -1px 2px rgba(0, 0, 0, 0.05)'
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative h-full flex flex-col sm:flex-row items-center justify-between p-2 xs:p-3 sm:p-4 gap-2 sm:gap-4">
        {/* Product Information */}
        <div 
          className="flex-1 w-full sm:max-w-[55%] space-y-1 xs:space-y-1.5 sm:space-y-2 text-center sm:text-left"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateX(-20px) scale(0.95)' : 'translateX(0) scale(1)',
            transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          <h2 
            className="text-slate-800 font-semibold text-sm xs:text-base sm:text-lg md:text-xl leading-tight"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(-10px) scale(0.98)' : 'translateY(0) scale(1)',
              transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transitionDelay: isTransitioning ? '0ms' : '100ms'
            }}
          >
            {currentProduct.title}
          </h2>
          
          <p 
            className="text-slate-600 text-xs xs:text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-2"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(-8px) scale(0.98)' : 'translateY(0) scale(1)',
              transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transitionDelay: isTransitioning ? '0ms' : '200ms'
            }}
          >
            {currentProduct.description}
          </p>
          
          <div 
            className="flex flex-col xs:flex-row xs:items-center xs:justify-center sm:justify-start gap-1 xs:gap-2 sm:gap-3"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(-6px) scale(0.98)' : 'translateY(0) scale(1)',
              transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transitionDelay: isTransitioning ? '0ms' : '300ms'
            }}
          >
            <span className="text-teal-600 font-bold text-base xs:text-lg sm:text-xl md:text-2xl" style={{color: '#2d7d8e'}}>
              {formatCurrency(currentProduct.price_cents)}
            </span>
            <span 
              className="text-teal-700 px-2 py-1 rounded-full text-xs xs:text-sm font-medium inline-block"
              style={{
                color: '#1e5a68',
                background: 'linear-gradient(135deg, rgba(240, 253, 250, 0.9) 0%, rgba(204, 251, 241, 0.8) 100%)',
                border: '1px solid rgba(45, 125, 142, 0.2)',
                boxShadow: '0 2px 4px rgba(45, 125, 142, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {currentProduct.stock} em estoque
            </span>
          </div>
          
          {/* Action Buttons */}
          <div 
            className="flex flex-col xs:flex-row gap-2 mt-2 xs:mt-3"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(-4px) scale(0.98)' : 'translateY(0) scale(1)',
              transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transitionDelay: isTransitioning ? '0ms' : '400ms'
            }}
          >
            <Link href={`/produtos/${currentProduct.id}`} className="flex-1 xs:flex-none">
              <button 
                className="w-full xs:w-auto px-3 xs:px-4 py-2 text-slate-700 border border-slate-200/60 rounded-lg text-xs xs:text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 0.9) 100%)'
                  e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                }}
              >
                Ver Produto
              </button>
            </Link>
            <button 
              className="w-full xs:w-auto px-3 xs:px-4 py-2 text-white rounded-lg text-xs xs:text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, #2d7d8e 0%, #1e5a68 100%)',
                boxShadow: '0 4px 6px -1px rgba(45, 125, 142, 0.3), 0 2px 4px -1px rgba(45, 125, 142, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #1e5a68 0%, #164e57 100%)'
                e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(45, 125, 142, 0.4), 0 4px 6px -1px rgba(45, 125, 142, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2d7d8e 0%, #1e5a68 100%)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(45, 125, 142, 0.3), 0 2px 4px -1px rgba(45, 125, 142, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
              }}
            >
              Comprar Agora
            </button>
          </div>
        </div>
        
        {/* Product Image */}
        <div 
          className="flex-shrink-0 w-full sm:w-auto sm:max-w-[40%] flex justify-center items-center order-first sm:order-last"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateX(20px) scale(0.9)' : 'translateX(0) scale(1)',
            transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          <div className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48">
            {currentProduct.images && currentProduct.images.length > 0 ? (
              <Image
                src={currentProduct.images[0]}
                alt={currentProduct.title}
                fill
                className="object-contain"
                style={{
                  transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                sizes="(max-width: 480px) 80px, (max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center rounded-lg">
                <Eye className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-500" />
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Dots Indicator */}
      {products.length > 1 && (
        <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 sm:gap-1.5 z-10">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full disabled:cursor-not-allowed ${
                index === currentIndex
                  ? 'bg-teal-500'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
              style={{
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (index !== currentIndex) {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = index === currentIndex ? 'scale(1.2)' : 'scale(1)'
              }}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {products.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200/30 overflow-hidden z-10">
          <div 
            className="h-full transition-all duration-300 ease-linear"
            style={{ width: `${((currentIndex + 1) / products.length) * 100}%`, backgroundColor: '#2d7d8e' }}
          />
        </div>
      )}
    </div>
  )
}