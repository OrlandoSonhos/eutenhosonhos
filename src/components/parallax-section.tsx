'use client'

import { useEffect, useRef } from 'react'

interface ParallaxSectionProps {
  children: React.ReactNode
  speed?: number
  className?: string
  backgroundImage?: string
}

export function ParallaxSection({ 
  children, 
  speed = 0.5, 
  className = '',
  backgroundImage 
}: ParallaxSectionProps) {
  const parallaxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!parallaxRef.current) return

      const scrolled = window.pageYOffset
      const parallax = parallaxRef.current
      const yPos = -(scrolled * speed)
      
      parallax.style.transform = `translateY(${yPos}px)`
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={parallaxRef}
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}