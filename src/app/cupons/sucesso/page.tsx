'use client'

import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { useEffect } from "react"
import { useToast } from "@/contexts/ToastContext"

export default function CouponSuccessPage() {
  const { showSuccessToast } = useToast()

  useEffect(() => {
    // Exibir toast notification de aprovação
    showSuccessToast(
      "Compra aprovada com sucesso! Verifique seu e-mail ou acesse 'Meus Cartões'/'Meus Pedidos'",
      5000 // 5 segundos
    )
  }, [showSuccessToast])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-success" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Pagamento Aprovado!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Seu cartão foi processado com sucesso
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Próximos passos:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Você receberá um e-mail com o código do seu cartão</li>
            <li>• O cartão será válido por 30 dias</li>
            <li>• Use o código no checkout para aplicar o desconto</li>
          </ul>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link
            href="/meus-cupons"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            Ver Meus Cartões
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