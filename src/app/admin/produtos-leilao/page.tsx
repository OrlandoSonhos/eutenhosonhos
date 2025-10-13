'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { 
  Calendar, 
  Clock, 
  Package, 
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Save,
  X
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price_cents: number
  image_url: string | null
  is_auction: boolean
  auction_date: string | null
  auction_end_date: string | null
  created_at: string
}

export default function AdminAuctionProductsPage() {
  const { data: session, status } = useSession()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [editForm, setEditForm] = useState({
    is_auction: false,
    auction_date: '',
    auction_end_date: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      redirect('/auth/signin')
    }
    fetchProducts()
  }, [session, status])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        setMessage({
          type: 'error',
          text: 'Erro ao carregar produtos'
        })
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      setMessage({
        type: 'error',
        text: 'Erro de conexão'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product.id)
    setEditForm({
      is_auction: product.is_auction,
      auction_date: product.auction_date ? 
        new Date(product.auction_date).toISOString().slice(0, 16) : '',
      auction_end_date: product.auction_end_date ? 
        new Date(product.auction_end_date).toISOString().slice(0, 16) : ''
    })
  }

  const handleSaveProduct = async (productId: string) => {
    setIsUpdating(productId)
    setMessage(null)

    try {
      const updateData = {
        is_auction: editForm.is_auction,
        auction_date: editForm.auction_date ? new Date(editForm.auction_date).toISOString() : null,
        auction_end_date: editForm.auction_end_date ? new Date(editForm.auction_end_date).toISOString() : null
      }

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Produto atualizado com sucesso!'
        })
        setEditingProduct(null)
        fetchProducts()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Erro ao atualizar produto'
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      setMessage({
        type: 'error',
        text: 'Erro de conexão'
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setEditForm({
      is_auction: false,
      auction_date: '',
      auction_end_date: ''
    })
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Não configurado'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const isAuctionActive = (product: Product) => {
    if (!product.is_auction || !product.auction_date || !product.auction_end_date) {
      return false
    }
    
    const now = new Date()
    const startDate = new Date(product.auction_date)
    const endDate = new Date(product.auction_end_date)
    
    return now >= startDate && now <= endDate
  }

  const getAuctionStatus = (product: Product) => {
    if (!product.is_auction) {
      return { status: 'normal', text: 'Produto Normal', color: 'bg-gray-100 text-gray-800' }
    }

    if (!product.auction_date || !product.auction_end_date) {
      return { status: 'pending', text: 'Leilão Pendente', color: 'bg-yellow-100 text-yellow-800' }
    }

    const now = new Date()
    const startDate = new Date(product.auction_date)
    const endDate = new Date(product.auction_end_date)

    if (now < startDate) {
      return { status: 'scheduled', text: 'Leilão Agendado', color: 'bg-blue-100 text-blue-800' }
    } else if (now >= startDate && now <= endDate) {
      return { status: 'active', text: 'Leilão Ativo', color: 'bg-green-100 text-green-800' }
    } else {
      return { status: 'ended', text: 'Leilão Encerrado', color: 'bg-red-100 text-red-800' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Produtos de Leilão</h1>
          <p className="mt-2 text-gray-600">
            Configure quais produtos são de leilão e defina suas datas específicas
          </p>
        </div>

        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <AlertDescription className={
              message.type === 'success' ? 'text-green-700' : 'text-red-700'
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Informações sobre cupons de leilão */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Como Funciona o Sistema de Leilão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Cupons de 50% (Leilão)</h4>
                <p className="text-sm text-gray-600">
                  Válidos apenas para produtos marcados como "Produto de Leilão" 
                  durante as datas específicas configuradas.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Cupons de 25% (Regular)</h4>
                <p className="text-sm text-gray-600">
                  Válidos para todos os produtos, sem restrição de data ou tipo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de produtos */}
        <div className="grid gap-6">
          {products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-500 text-center">
                  Adicione produtos primeiro para configurar leilões
                </p>
              </CardContent>
            </Card>
          ) : (
            products.map((product) => {
              const auctionStatus = getAuctionStatus(product)
              const isEditing = editingProduct === product.id
              
              return (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          {product.name}
                          <Badge className={auctionStatus.color}>
                            {auctionStatus.text}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {product.description}
                        </CardDescription>
                        <div className="mt-2">
                          <span className="text-lg font-semibold text-green-600">
                            {formatCurrency(product.price_cents)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveProduct(product.id)}
                              disabled={isUpdating === product.id}
                            >
                              {isUpdating === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Save className="h-4 w-4 mr-1" />
                              )}
                              Salvar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isUpdating === product.id}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`auction-${product.id}`}
                            checked={editForm.is_auction}
                            onCheckedChange={(checked) => setEditForm({
                              ...editForm,
                              is_auction: checked,
                              auction_date: checked ? editForm.auction_date : '',
                              auction_end_date: checked ? editForm.auction_end_date : ''
                            })}
                          />
                          <Label htmlFor={`auction-${product.id}`}>
                            Produto de Leilão
                          </Label>
                        </div>

                        {editForm.is_auction && (
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`start-date-${product.id}`}>
                                Data de Início do Leilão
                              </Label>
                              <Input
                                id={`start-date-${product.id}`}
                                type="datetime-local"
                                value={editForm.auction_date}
                                onChange={(e) => setEditForm({
                                  ...editForm,
                                  auction_date: e.target.value
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`end-date-${product.id}`}>
                                Data de Fim do Leilão
                              </Label>
                              <Input
                                id={`end-date-${product.id}`}
                                type="datetime-local"
                                value={editForm.auction_end_date}
                                onChange={(e) => setEditForm({
                                  ...editForm,
                                  auction_end_date: e.target.value
                                })}
                              />
                            </div>
                          </div>
                        )}

                        {editForm.is_auction && (
                          <Alert className="border-orange-200 bg-orange-50">
                            <AlertDescription className="text-orange-700">
                              <strong>Importante:</strong> Cupons de 50% só funcionarão para este produto 
                              durante o período configurado acima.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {product.is_auction ? 'Produto de Leilão' : 'Produto Normal'}
                            </p>
                            <p className="text-xs text-gray-500">Tipo</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {formatDateTime(product.auction_date)}
                            </p>
                            <p className="text-xs text-gray-500">Início do Leilão</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {formatDateTime(product.auction_end_date)}
                            </p>
                            <p className="text-xs text-gray-500">Fim do Leilão</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {product.is_auction && !isEditing && (
                      <div className="mt-4">
                        {isAuctionActive(product) ? (
                          <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription className="text-green-700">
                              <strong>Leilão Ativo:</strong> Cupons de 50% estão funcionando para este produto agora.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert className="border-gray-200 bg-gray-50">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription className="text-gray-700">
                              <strong>Leilão Inativo:</strong> Cupons de 50% não estão funcionando para este produto no momento.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}