'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
  description?: string
}

interface ProductForm {
  title: string
  description: string
  price_cents: number
  stock: number
  images: string[]
  active: boolean
  featured: boolean
  category_id?: string
}

export default function NewProductPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [form, setForm] = useState<ProductForm>({
    title: '',
    description: '',
    price_cents: 0,
    stock: 0,
    images: [],
    active: true,
    featured: false,
    category_id: undefined
  })

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories')
        if (response.ok) {
          const data = await response.json()
          // A API retorna o array direto, não um objeto com propriedade categories
          setCategories(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Upload de imagem
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao fazer upload da imagem')
      }

      const data = await response.json()
      setForm(prev => ({
        ...prev,
        images: [...prev.images, data.url]
      }))
    } catch (error) {
      console.error('Erro no upload:', error)
      alert(error instanceof Error ? error.message : 'Erro ao fazer upload da imagem')
    } finally {
      setUploadingImage(false)
    }
  }

  // Remover imagem
  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.title.trim()) {
      setError('Título é obrigatório')
      return
    }
    
    if (!form.description.trim()) {
      setError('Descrição é obrigatória')
      return
    }
    
    if (form.price_cents <= 0) {
      setError('Preço deve ser maior que zero')
      return
    }
    
    if (form.stock < 0) {
      setError('Estoque não pode ser negativo')
      return
    }
    
    if (form.images.length === 0) {
      setError('Pelo menos uma imagem é obrigatória')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar produto')
      }

      router.push('/admin/produtos')
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      setError(error instanceof Error ? error.message : 'Erro ao criar produto')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    const cents = parseInt(numericValue) || 0
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    const cents = parseInt(numericValue) || 0
    setForm(prev => ({ ...prev, price_cents: cents }))
  }

  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/produtos"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
          <p className="text-gray-600">Adicione um novo produto à loja</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do produto"
                required
              />
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descrição detalhada do produto"
                required
              />
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço *
              </label>
              <input
                type="text"
                value={formatPrice(form.price_cents.toString())}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="R$ 0,00"
                required
              />
            </div>

            {/* Estoque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estoque *
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                required
              />
            </div>

            {/* Categoria */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={form.category_id || ''}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  category_id: e.target.value || undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingCategories}
              >
                <option value="">Selecione uma categoria (opcional)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {loadingCategories && (
                <p className="text-sm text-gray-500 mt-1">Carregando categorias...</p>
              )}
            </div>

            {/* Status */}
            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Produto ativo (visível na loja)
                </span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  ⭐ Produto em destaque (aparece no carrossel da página inicial)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Imagens */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagens *</h2>
          
          {/* Upload de imagem */}
          <div className="mb-4">
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <span className="text-sm text-gray-600">
                    {uploadingImage ? 'Enviando...' : 'Clique para adicionar imagem'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </div>
            </label>
          </div>

          {/* Lista de imagens */}
          {form.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {form.images.map((image, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={image}
                    alt={`Imagem ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Principal
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/produtos"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Criando...
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4" />
                Criar Produto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}