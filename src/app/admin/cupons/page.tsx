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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Tag, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Percent,
  Image
} from 'lucide-react'

interface Coupon {
  id: string
  code: string
  face_value_cents: number
  sale_price_cents: number
  status: 'AVAILABLE' | 'USED' | 'EXPIRED'
  created_at: string
  image_url?: string
  buyer?: {
    name: string
    email: string
  }
}

export default function AdminCouponsPage() {
  const { data: session, status } = useSession()
  
  // Estados para cartões pré-pagos
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    face_value_cents: 0,
    sale_price_cents: 0,
    quantity: 1,
    image_url: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session as any).user?.role !== 'ADMIN') {
      redirect('/admin/login')
    }
    fetchCoupons()
  }, [session, status])

  // Funções para cartões pré-pagos
  const fetchCoupons = async () => {
    try {
      const response = await fetch('/api/admin/coupons')
      if (response.ok) {
        const data = await response.json()
        setCoupons(data)
      }
    } catch (error) {
      console.error('Erro ao buscar cupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCoupons = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setUploading(true)
      let imageUrl = ''

      // Se há um arquivo selecionado, fazer upload primeiro
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          imageUrl = uploadResult.imageUrl
        } else {
          console.error('Erro no upload da imagem')
          setUploading(false)
          return
        }
      }

      // Criar o cupom com a URL da imagem
      const couponData = {
        ...newCoupon,
        image_url: imageUrl
      }

      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewCoupon({ code: '', face_value_cents: 0, sale_price_cents: 0, quantity: 1, image_url: '' })
        setSelectedFile(null)
        fetchCoupons()
      } else {
        const errorData = await response.json()
        console.error('Erro ao criar cupons:', errorData.error)
        alert(`Erro ao criar cupons: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Erro ao criar cupons:', error)
      alert('Erro ao criar cupons. Verifique o console para mais detalhes.')
    } finally {
      setUploading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Disponível</Badge>
      case 'USED':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Usado</Badge>
      case 'EXPIRED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Expirado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gerenciar Cartões Pré-pagos</h1>
          <p className="text-gray-600">Gerencie cartões de desconto com valor fixo</p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Cartões Pré-pagos</h2>
              <p className="text-gray-600">Gerencie cartões de desconto com valor fixo</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Cartões
            </Button>
          </div>

          {/* Formulário de criação de cartões pré-pagos */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Criar Novos Cartões Pré-pagos</CardTitle>
                <CardDescription>
                  Crie múltiplos cartões com o mesmo valor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createCoupons} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="code">Prefixo do Código</Label>
                      <Input
                        id="code"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                        placeholder="Ex: CART25"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="value">Valor (R$)</Label>
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        value={newCoupon.face_value_cents / 100}
                        onChange={(e) => setNewCoupon({ 
                          ...newCoupon, 
                          face_value_cents: Math.round(parseFloat(e.target.value) * 100) 
                        })}
                        placeholder="25.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
                      <Input
                        id="sale_price"
                        type="number"
                        step="0.01"
                        value={newCoupon.sale_price_cents / 100}
                        onChange={(e) => setNewCoupon({ 
                          ...newCoupon, 
                          sale_price_cents: Math.round(parseFloat(e.target.value) * 100) 
                        })}
                        placeholder="5.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newCoupon.quantity}
                        onChange={(e) => setNewCoupon({ 
                          ...newCoupon, 
                          quantity: parseInt(e.target.value) 
                        })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="image_file">Imagem do Cartão (opcional)</Label>
                    <Input
                      id="image_file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        setSelectedFile(file || null)
                      }}
                      className="cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="text-sm text-gray-600 mt-1">
                        Arquivo selecionado: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {selectedFile ? 'Fazendo upload...' : 'Criando...'}
                        </>
                      ) : (
                        'Criar Cartões'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateForm(false)
                        setSelectedFile(null)
                      }}
                      disabled={uploading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de cartões pré-pagos */}
          <div className="grid gap-4">
            {coupons.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum cartão encontrado
                  </h3>
                  <p className="text-gray-500 text-center mb-4">
                    Comece criando seus primeiros cartões pré-pagos
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Cartão
                  </Button>
                </CardContent>
              </Card>
            ) : (
              coupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {coupon.image_url ? (
                            <img 
                              src={coupon.image_url} 
                              alt={`Imagem do cartão ${coupon.code}`}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center ${coupon.image_url ? 'hidden' : ''}`}>
                            <Tag className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{coupon.code}</h3>
                          <p className="text-sm text-gray-500">
                            Valor: {formatCurrency(coupon.face_value_cents)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Preço de Venda: {formatCurrency(coupon.sale_price_cents)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Status</div>
                          {getStatusBadge(coupon.status)}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Criado em</div>
                          <div className="text-sm font-medium">{formatDate(coupon.created_at)}</div>
                        </div>
                        {coupon.buyer && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Comprador</div>
                            <div className="text-sm font-medium">{coupon.buyer.name}</div>
                            <div className="text-xs text-gray-400">{coupon.buyer.email}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}