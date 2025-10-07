import Link from 'next/link'
import { ShoppingBag, Gift } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Eu tenho <span className="text-yellow-300">Sonhos</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-indigo-100">
            Realize seus sonhos com nossa loja online e cupons exclusivos
          </p>
          <p className="text-lg mb-12 text-indigo-200 max-w-2xl mx-auto">
            Descubra produtos incríveis e economize com nossos cupons pré-pagos. 
            Compre cupons com desconto e use quando quiser!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/produtos"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Ver Produtos
            </Link>
            <Link
              href="/cupons"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors"
            >
              <Gift className="w-5 h-5 mr-2" />
              Comprar Cupons
            </Link>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </div>
    </section>
  )
}