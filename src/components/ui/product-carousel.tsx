'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'

interface ProductCarouselProps {
  images: string[]
  productTitle: string
  className?: string
}

export function ProductCarousel({ images, productTitle, className = '' }: ProductCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  // Se não há imagens, mostra placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`relative w-full h-64 bg-gray-100 overflow-hidden ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
            <Eye className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <span className="text-sm">Sem imagem</span>
          </div>
        </div>
      </div>
    )
  }

  // Se há apenas uma imagem, não mostra controles
  if (images.length === 1) {
    return (
      <div className={`relative w-full h-64 bg-gray-100 overflow-hidden ${className}`}>
        {images[0].startsWith('data:') ? (
          <img
            src={images[0]}
            alt={productTitle}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/placeholder-product.svg'
            }}
          />
        ) : (
          <Image
            src={images[0]}
            alt={productTitle}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/placeholder-product.svg'
            }}
          />
        )}
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovered || images.length <= 1) return
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevImage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextImage()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isHovered, images.length])

  // Handlers de touch para swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && images.length > 1) {
      nextImage()
    }
    if (isRightSwipe && images.length > 1) {
      prevImage()
    }
  }

  return (
    <div 
      ref={carouselRef}
      className={`relative w-full h-64 bg-gray-100 overflow-hidden group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={images.length > 1 ? 0 : -1}
      role={images.length > 1 ? "region" : undefined}
      aria-label={images.length > 1 ? `Galeria de imagens do produto ${productTitle}. Use as setas do teclado para navegar.` : undefined}
    >
      {/* Imagem atual */}
      {images[currentImageIndex].startsWith('data:') ? (
        <img
          src={images[currentImageIndex]}
          alt={`${productTitle} - Imagem ${currentImageIndex + 1}`}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-product.svg'
          }}
        />
      ) : (
        <Image
          src={images[currentImageIndex]}
          alt={`${productTitle} - Imagem ${currentImageIndex + 1}`}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-product.svg'
          }}
        />
      )}

      {/* Botões de navegação - aparecem no hover ou em dispositivos touch */}
      <div className="absolute inset-0 flex items-center justify-between p-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={prevImage}
          className="bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          aria-label="Imagem anterior"
          disabled={currentImageIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        
        <button
          onClick={nextImage}
          className="bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          aria-label="Próxima imagem"
          disabled={currentImageIndex === images.length - 1}
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Indicadores de imagem (pontos) */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 ${
              index === currentImageIndex
                ? 'bg-white scale-125 shadow-lg'
                : 'bg-white/60 hover:bg-white/80 hover:scale-110'
            }`}
            aria-label={`Ir para imagem ${index + 1} de ${images.length}`}
            aria-current={index === currentImageIndex ? 'true' : 'false'}
          />
        ))}
      </div>

      {/* Contador de imagens */}
      <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
        {currentImageIndex + 1}/{images.length}
      </div>
    </div>
  )
}