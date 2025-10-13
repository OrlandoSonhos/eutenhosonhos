'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { ShoppingCart, Menu, X, ChevronDown } from 'lucide-react'

interface Category {
  id: number
  name: string
  _count: {
    products: number
  }
}

export function Header() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

  useEffect(() => {
    // Função para atualizar o contador do carrinho
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const totalItems = cart.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0)
        setCartItemCount(totalItems)
      } catch {
        setCartItemCount(0)
      }
    }

    // Atualizar na montagem do componente
    updateCartCount()

    // Escutar mudanças no carrinho
    window.addEventListener('cartUpdated', updateCartCount)

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [])

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?includeCount=true')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      }
    }

    fetchCategories()
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.categories-dropdown')) {
        setIsCategoriesOpen(false)
      }
    }

    if (isCategoriesOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isCategoriesOpen])

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Eu tenho Sonhos"
              width={600}
              height={180}
              className="max-h-16 w-auto sm:max-h-20 md:max-h-24 lg:max-h-28"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Dropdown de Produtos/Categorias */}
            <div className="relative categories-dropdown">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-brand-primary transition-colors"
              >
                <span>Produtos</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCategoriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                  <div className="py-2">
                    <Link
                      href="/produtos"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary"
                      onClick={() => setIsCategoriesOpen(false)}
                    >
                      Todos os produtos
                    </Link>
                    {categories.length > 0 && (
                      <div className="border-t border-gray-100 my-1"></div>
                    )}
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/produtos/categoria/${category.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-primary"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        <div className="flex justify-between items-center">
                          <span>{category.name}</span>
                          <span className="text-xs text-gray-500">
                            {category._count.products} produtos
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Link href="/cupons" className="text-gray-700 hover:text-[var(--primary-teal)] transition-colors">
              Cartões
            </Link>
            
            <Link href="/meus-cupons" className="text-gray-700 hover:text-[var(--primary-teal)] transition-colors">
              Meus Cartões
            </Link>
            
            {session && (session as any).user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-gray-700 hover:text-brand-primary transition-colors">
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/carrinho" className="relative p-2 text-gray-700 hover:text-brand-primary transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {session ? (
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Olá, {(session as any).user?.name}</span>
                  <button
                    onClick={() => signOut()}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-700 hover:text-brand-primary transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-brand-primary text-white px-4 py-2 rounded-md text-sm hover:bg-brand-primary-dark transition-colors"
                >
                  Cadastrar
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/produtos"
                className="text-gray-700 hover:text-brand-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Produtos
              </Link>
              <Link
                href="/cupons"
                className="text-gray-700 hover:text-[var(--primary-teal)] transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Cartões
              </Link>
              {session && (
                <Link
                  href="/meus-cupons"
                  className="text-gray-700 hover:text-[var(--primary-teal)] transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Meus Cartões
                </Link>
              )}
              {session && (session as any).user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-brand-primary transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}