import Link from "next/link"
import { Clock } from "lucide-react"

export default function CouponPendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Clock className="mx-auto h-16 w-16 text-yellow-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pagamento Pendente
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Seu pagamento está sendo processado
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Aguarde a confirmação:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• O pagamento pode levar alguns minutos para ser processado</li>
            <li>• Você receberá um e-mail quando for confirmado</li>
            <li>• Não é necessário fazer um novo pagamento</li>
          </ul>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link
            href="/meus-cupons"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Verificar Status
          </Link>
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Voltar à Loja
          </Link>
        </div>
      </div>
    </div>
  )
}
