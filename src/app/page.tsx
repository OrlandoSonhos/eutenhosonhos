import Link from "next/link"
import { ProductGrid } from "@/components/product-grid"
import { HeroSection } from "@/components/hero-section"
import { ParallaxSection } from "@/components/parallax-section"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Eu tenho Sonhos - Cartões de Desconto e Leilões Diários | Economize até 80%",
  description: "Compre cartões de desconto pré-pagos com até 80% de economia. Participe de leilões diários com cupons especiais de 50% off. Produtos exclusivos e ofertas imperdíveis.",
  keywords: "cartões de desconto, cupons de desconto, leilão diário, ofertas especiais, economia, compras online, desconto 80%, cupom 50%",
  openGraph: {
    title: "Cartões de Desconto e Leilões | Eu tenho Sonhos",
    description: "Economize até 80% com cartões pré-pagos e participe de leilões com cupons de 50% off",
    type: "website",
  },
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Eu tenho Sonhos",
  "url": "https://eutenhossonhos.com.br",
  "description": "Loja online especializada em cartões de desconto pré-pagos e leilões diários",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://eutenhossonhos.com.br/produtos?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "BRL",
    "lowPrice": "5",
    "highPrice": "200",
    "offerCount": "4"
  }
}

const organizationData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Eu tenho Sonhos",
  "url": "https://eutenhossonhos.com.br",
  "logo": "https://eutenhossonhos.com.br/logo.png",
  "description": "Loja online de cartões de desconto pré-pagos e produtos exclusivos",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "Portuguese"
  }
}

export default function HomePage() {
  return (
    <>
      {/* Dados Estruturados para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <HeroSection />

        {/* Seção de Cartões de Desconto */}
        <ParallaxSection speed={0.15} className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Cartões de Desconto Pré-Pagos
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Economize até 50% nas suas compras com nossos cartões de desconto pré-pagos. 
                Compre agora e use quando quiser em nossa loja online.
              </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
              {[
                { value: 'R$ 25', price: 'R$ 5', discount: '80%', savings: 'R$ 20' },
                { value: 'R$ 50', price: 'R$ 10', discount: '80%', savings: 'R$ 40' },
                { value: 'R$ 100', price: 'R$ 20', discount: '80%', savings: 'R$ 80' },
                { value: 'R$ 200', price: 'R$ 40', discount: '80%', savings: 'R$ 160' }
              ].map((coupon, index) => (
                <article 
                  key={index} 
                  className="bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-lg p-6 text-white text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  role="listitem"
                >
                  <div className="text-3xl font-bold mb-2" aria-label={`Cartão de ${coupon.value}`}>
                    {coupon.value}
                  </div>
                  <div className="text-sm opacity-90 mb-2">
                    por apenas <span className="font-bold text-lg">{coupon.price}</span>
                  </div>
                  <div className="text-xs mb-4">
                    Você economiza <strong>{coupon.savings}</strong>
                  </div>
                  <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium mb-4">
                    {coupon.discount} OFF
                  </div>
                  <Link
                    href="/cupons"
                    className="block w-full bg-white text-brand-primary py-2 rounded-md font-medium hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                    aria-label={`Comprar cartão de desconto de ${coupon.value}`}
                  >
                    Comprar Agora
                  </Link>
                </article>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                href="/cupons"
                className="inline-flex items-center px-8 py-4 border-2 border-brand-primary text-lg font-medium rounded-md text-brand-primary bg-white hover:bg-brand-primary hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                aria-label="Ver todos os cartões de desconto disponíveis"
              >
                Ver Todos os Cartões de Desconto
              </Link>
            </div>
          </div>
        </ParallaxSection>

        {/* Produtos em Destaque */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Produtos em Destaque
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Descubra nossa seleção especial de produtos com os melhores preços. 
                Use seus cartões de desconto e economize ainda mais!
              </p>
            </header>
            
            <ProductGrid />
            
            <div className="text-center mt-16">
              <Link
                href="/produtos"
                className="btn-primary px-8 py-4 text-lg font-medium rounded-lg transition-all duration-300 inline-flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                aria-label="Ver todos os produtos disponíveis na loja"
              >
                Ver Todos os Produtos
              </Link>
            </div>
          </div>
        </section>



        {/* FAQ Section para SEO */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
              Perguntas Frequentes
            </h2>
            <div className="space-y-6">
              <details className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <summary className="font-semibold text-xl cursor-pointer text-brand-primary hover:text-brand-primary-dark transition-colors">
                  Como funcionam os cartões de desconto pré-pagos?
                </summary>
                <p className="mt-6 text-gray-600 text-lg leading-relaxed">
                  Você compra o cartão com desconto e recebe um código para usar nas suas compras. 
                  O valor fica disponível na sua conta para usar quando quiser.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <summary className="font-semibold text-xl cursor-pointer text-brand-primary hover:text-brand-primary-dark transition-colors">
                  O que são os leilões diários?
                </summary>
                <p className="mt-6 text-gray-600 text-lg leading-relaxed">
                  São produtos especiais com cupons de 50% de desconto, disponíveis apenas em datas específicas. 
                  Cada produto tem sua data de leilão programada.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <summary className="font-semibold text-xl cursor-pointer text-brand-primary hover:text-brand-primary-dark transition-colors">
                  Posso usar múltiplos cupons na mesma compra?
                </summary>
                <p className="mt-6 text-gray-600 text-lg leading-relaxed">
                  Você pode usar cartões de desconto normais (25%) a qualquer momento, mas os cupons de leilão (50%) 
                  só funcionam em produtos específicos nas datas programadas.
                </p>
              </details>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
