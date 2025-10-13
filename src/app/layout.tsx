import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Header } from "@/components/header"
import Footer from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Eu tenho Sonhos - Loja Online de Cartões de Desconto e Produtos",
  description: "Descubra a Eu tenho Sonhos: sua loja online especializada em cartões de desconto pré-pagos e produtos exclusivos. Economize até 80% com nossos cupons e aproveite ofertas especiais em leilões diários.",
  keywords: "cartões de desconto, cupons, loja online, produtos com desconto, leilão, ofertas especiais, economia, compras online",
  authors: [{ name: "Eu tenho Sonhos" }],
  creator: "Eu tenho Sonhos",
  publisher: "Eu tenho Sonhos",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://eutenhossonhos.com.br",
    siteName: "Eu tenho Sonhos",
    title: "Eu tenho Sonhos - Cartões de Desconto e Produtos Exclusivos",
    description: "Economize até 80% com nossos cartões de desconto pré-pagos. Produtos exclusivos e leilões diários com ofertas imperdíveis.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Eu tenho Sonhos - Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eu tenho Sonhos - Cartões de Desconto e Produtos",
    description: "Economize até 80% com cartões de desconto pré-pagos e aproveite leilões diários.",
    images: ["/logo.png"],
  },
  verification: {
    google: "google-site-verification-code",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
