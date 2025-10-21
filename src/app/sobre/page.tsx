import { Metadata } from 'next'
import { Heart, Shield, Zap, Users, Award, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre Nós - Eu Tenho Sonhos',
  description: 'Conheça nossa história e missão de tornar produtos de qualidade mais acessíveis através de cartões de desconto pré-pagos.',
  openGraph: {
    title: 'Sobre Nós - Eu Tenho Sonhos',
    description: 'Conheça nossa história e missão de tornar produtos de qualidade mais acessíveis.',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Eu Tenho Sonhos
          </h1>
          <p className="text-xl text-white/90 max-w-4xl mx-auto mb-8 leading-relaxed">
            Acreditamos que todos merecem ter acesso a produtos de qualidade. 
            Nossa missão é tornar suas compras mais acessíveis através de cartões de desconto pré-pagos, 
            permitindo que você economize e realize seus sonhos.
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Segurança Garantida
            </div>
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Economia Real
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Milhares de Clientes Satisfeitos
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Nossa História */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Nossa História</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nascemos da vontade de democratizar o acesso a produtos de qualidade, 
              criando uma ponte entre seus sonhos e a realidade.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed">
                A <strong>Eu Tenho Sonhos</strong> surgiu da percepção de que muitas pessoas 
                deixam de comprar produtos que desejam devido aos preços elevados. 
                Vimos uma oportunidade de criar uma solução inovadora que beneficiasse tanto 
                consumidores quanto empresas.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Através dos nossos cartões de desconto pré-pagos, oferecemos uma forma 
                inteligente de economizar. Você compra créditos com desconto e pode 
                utilizá-los quando quiser, garantindo sempre o melhor preço.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Hoje, somos uma plataforma confiável que já ajudou milhares de pessoas 
                a realizarem suas compras com economia significativa, mantendo sempre 
                a qualidade e segurança que nossos clientes merecem.
              </p>
            </div>
            <div className="bg-gradient-to-br from-brand-primary/10 to-brand-primary-dark/10 rounded-2xl p-8">
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center mr-4">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Qualidade Garantida</h3>
                    <p className="text-gray-600 text-sm">Produtos selecionados com rigor</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Segurança Total</h3>
                    <p className="text-gray-600 text-sm">Pagamentos protegidos pelo Mercado Pago</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Suporte Dedicado</h3>
                    <p className="text-gray-600 text-sm">Atendimento personalizado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nossos Valores */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Nossos Valores</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Princípios que guiam cada decisão e ação em nossa empresa.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Paixão pelo Cliente</h3>
              <p className="text-gray-600">
                Colocamos nossos clientes no centro de tudo que fazemos, 
                buscando sempre superar suas expectativas.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Transparência</h3>
              <p className="text-gray-600">
                Mantemos comunicação clara e honesta em todas as nossas 
                interações e processos.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Inovação</h3>
              <p className="text-gray-600">
                Buscamos constantemente novas formas de melhorar a experiência 
                de compra e economia dos nossos clientes.
              </p>
            </div>
          </div>
        </div>

        {/* Como Funcionamos */}
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Como Funcionamos</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Um processo simples e seguro para você economizar em suas compras.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">Escolha seu Cartão</h3>
              <p className="text-gray-600 text-sm">
                Selecione o valor do cartão de desconto que melhor se adequa ao seu orçamento
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">Pague com Segurança</h3>
              <p className="text-gray-600 text-sm">
                Realize o pagamento via PIX, cartão de crédito ou débito através do Mercado Pago
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">Receba seu Código</h3>
              <p className="text-gray-600 text-sm">
                Receba instantaneamente por email o código do seu cartão de desconto
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-2xl">4</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-3">Compre e Economize</h3>
              <p className="text-gray-600 text-sm">
                Use seu código no checkout e aproveite o desconto em qualquer produto
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}