import Link from "next/link"
import { XCircle } from "lucide-react"

export default function CouponErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-error" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pagamento Não Aprovado
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Houve um problema com o processamento do seu pagamento
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            O que aconteceu?
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• O pagamento pode ter sido recusado</li>
            <li>• Verifique os dados do cartão ou conta</li>
            <li>• Tente novamente ou use outro método</li>
          </ul>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link
            href="/cupons"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            Tentar Novamente
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