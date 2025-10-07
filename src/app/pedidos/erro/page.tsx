'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function OrderErrorPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Header de Erro */}
          <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Erro no Pagamento
          </h1>
          <p className="text-gray-600 mb-8">
            Houve um problema ao processar seu pagamento. Não se preocupe, nenhuma cobrança foi realizada.
          </p>

          {/* Informações do Pedido */}
          {orderId && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800">
                <strong>Pedido:</strong> #{orderId.slice(-8)}
              </p>
              <p className="text-red-700 text-sm mt-1">
                Este pedido não foi processado devido ao erro no pagamento.
              </p>
            </div>
          )}

          {/* Possíveis Causas */}
          <div className="text-left bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-gray-900 mb-3">Possíveis causas do erro:</h3>
            <ul className="text-gray-700 text-sm space-y-2">
              <li>• Dados do cartão incorretos ou inválidos</li>
              <li>• Limite insuficiente no cartão</li>
              <li>• Cartão bloqueado ou vencido</li>
              <li>• Problemas temporários na operadora</li>
              <li>• Conexão instável durante o pagamento</li>
            </ul>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/carrinho"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Link>
            <Link
              href="/produtos"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar às Compras
            </Link>
          </div>

          {/* Ajuda */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Precisa de Ajuda?</h3>
            <p className="text-blue-800 text-sm">
              Se o problema persistir, entre em contato conosco. Nossa equipe está pronta para ajudar!
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center">
              <a
                href="mailto:suporte@loja.com"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                suporte@loja.com
              </a>
              <span className="hidden sm:inline text-gray-400">•</span>
              <a
                href="tel:+5511999999999"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                (11) 99999-9999
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}