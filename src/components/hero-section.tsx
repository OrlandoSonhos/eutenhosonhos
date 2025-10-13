import Link from 'next/link'
import { ShoppingBag, Gift } from 'lucide-react'
import { ParallaxSection } from './parallax-section'

export function HeroSection() {
  return (
    <section className="bg-brand-gradient relative min-h-screen flex items-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Realize seus sonhos com nossa loja online e cartões de desconto exclusivos
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Descubra produtos incríveis e economize com nossos cartões de desconto.
              Compre cartões com desconto e use quando quiser!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/produtos"
                className="inline-flex items-center px-8 py-4 bg-white text-brand-primary font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Ver Produtos
              </Link>
              <Link
                href="/cupons"
                className="btn-accent px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 inline-flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Gift className="w-5 h-5 mr-2" />
                Comprar Cartões
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}