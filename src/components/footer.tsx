import Image from 'next/image'
import { Facebook, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Conteúdo principal em linha horizontal */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
               <Image
                 src="/logo.png"
                 alt="Eu tenho Sonhos"
                 width={400}
                 height={120}
                 className="h-18 w-auto"
               />
             </div>

          {/* Links em linha horizontal */}
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
            <a href="/" className="text-gray-600 hover:text-brand-primary transition-colors text-sm font-medium">
              Início
            </a>
            <a href="/produtos" className="text-gray-600 hover:text-brand-primary transition-colors text-sm font-medium">
          Produtos
        </a>
        <a href="/cupons" className="text-gray-600 hover:text-brand-primary transition-colors text-sm font-medium">
          Cupons
        </a>
        <a href="/contato" className="text-gray-600 hover:text-brand-primary transition-colors text-sm font-medium">
          Contato
        </a>
          </div>

          {/* Redes Sociais e Copyright */}
          <div className="flex-shrink-0 flex flex-col items-center lg:items-end gap-3">
            {/* Redes Sociais */}
            <div className="flex items-center gap-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-brand-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com/sonhoseutenho?utm_source=qr&igsh=NW1memZqemJzYmh2" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-brand-accent transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
            
            {/* Copyright */}
            <p className="text-gray-500 text-xs text-center lg:text-right">
              © 2024 Eu tenho Sonhos
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}