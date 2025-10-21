import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cartão de Desconto - Eu Tenho Sonhos',
  description: 'Compre cartões de desconto e economize em suas compras na Eu Tenho Sonhos',
}

export default function CuponsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}