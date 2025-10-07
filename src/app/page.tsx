import Link from "next/link"
import { ProductGrid } from "@/components/product-grid"
import { HeroSection } from "@/components/hero-section"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Produtos em Destaque */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-lg text-gray-600">
              Descubra nossa seleção especial de produtos
            </p>
          </div>
          
          <ProductGrid />
          
          <div className="text-center mt-12">
            <Link
              href="/produtos"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Ver Todos os Produtos
            </Link>
          </div>
        </div>
      </section>

      {/* Seção de Cupons */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cupons Pré-pagos
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Compre cupons com desconto e economize nas suas compras
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: 'R$ 25', price: 'R$ 5', discount: '80%' },
              { value: 'R$ 50', price: 'R$ 10', discount: '80%' },
              { value: 'R$ 100', price: 'R$ 20', discount: '80%' },
              { value: 'R$ 200', price: 'R$ 40', discount: '80%' }
            ].map((coupon, index) => (
              <div key={index} className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white text-center">
                <div className="text-2xl font-bold mb-2">{coupon.value}</div>
                <div className="text-sm opacity-90 mb-4">por apenas {coupon.price}</div>
                <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium mb-4">
                  {coupon.discount} OFF
                </div>
                <Link
                  href="/cupons"
                  className="block w-full bg-white text-indigo-600 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  Comprar
                </Link>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              href="/cupons"
              className="inline-flex items-center px-6 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
            >
              Ver Todos os Cupons
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
