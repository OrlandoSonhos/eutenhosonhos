'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Percent
} from 'lucide-react'

interface Coupon {
  id: string
  code: string
  face_value_cents: number
  status: 'AVAILABLE' | 'USED' | 'EXPIRED'
  created_at: string
  buyer?: {
    name: string
    email: string
  }
}

interface DiscountCoupon {
  id: string
  code: string
  type: 'REGULAR_25' | 'AUCTION_50'
  discount_percent: number
  is_active: boolean
  requires_auction: boolean
  valid_from: string | null
  valid_until: string | null
  max_uses: number | null
  current_uses: number
  created_at: string
  order_discounts: Array<{
    id: string
    order: {
      id: string
      user: {
        name: string
        email: string
      }
    }
  }>
}

export default function AdminCouponsPage() {
  const { data: session, status } = useSession()
  
  // Estados para cupons pré-pagos
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    face_value_cents: 0,
    quantity: 1
  })

  // Estados para cupons de desconto
  const [discountCoupons, setDiscountCoupons] = useState<DiscountCoupon[]>([])
  const [isLoadingDiscount, setIsLoadingDiscount] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateDiscountDialog, setShowCreateDiscountDialog] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [newDiscountCoupon, setNewDiscountCoupon] = useState({
    code: '',
    type: 'REGULAR_25' as 'REGULAR_25' | 'AUCTION_50',
    discount_percent: 25,
    is_active: true,
    requires_auction: false,
    valid_from: '',
    valid_until: '',
    max_uses: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      redirect('/auth/signin')
    }
    fetchCoupons()
    fetchDiscountCoupons()
  }, [session, status])

  // Funções para cupons pré-pagos
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
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCoupon),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setNewCoupon({ code: '', face_value_cents: 0, quantity: 1 })
        fetchCoupons()
      }
    } catch (error) {
      console.error('Erro ao criar cupons:', error)
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCoupons()
      }
    } catch (error) {
      console.error('Erro ao excluir cupom:', error)
    }
  }

  // Funções para cupons de desconto
  const fetchDiscountCoupons = async () => {
    try {
      const response = await fetch('/api/admin/discount-coupons')
      if (response.ok) {
        const data = await response.json()
        setDiscountCoupons(data)
      } else {
        setMessage({
          type: 'error',
          text: 'Erro ao carregar cupons de desconto'
        })
      }
    } catch (error) {
      console.error('Erro ao buscar cupons de desconto:', error)
      setMessage({
        type: 'error',
        text: 'Erro de conexão'
      })
    } finally {
      setIsLoadingDiscount(false)
    }
  }

  const handleCreateDiscountCoupon = async () => {
    setIsCreating(true)
    setMessage(null)

    try {
      const couponData = {
        ...newDiscountCoupon,
        code: newDiscountCoupon.code.toUpperCase(),
        max_uses: newDiscountCoupon.max_uses ? parseInt(newDiscountCoupon.max_uses) : null,
        requires_auction: newDiscountCoupon.type === 'AUCTION_50'
      }

      const response = await fetch('/api/admin/discount-coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Cupom de desconto criado com sucesso!'
        })
        setShowCreateDiscountDialog(false)
        setNewDiscountCoupon({
          code: '',
          type: 'REGULAR_25',
          discount_percent: 25,
          is_active: true,
          requires_auction: false,
          valid_from: '',
          valid_until: '',
          max_uses: ''
        })
        fetchDiscountCoupons()
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Erro ao criar cupom de desconto'
        })
      }
    } catch (error) {
      console.error('Erro ao criar cupom de desconto:', error)
      setMessage({
        type: 'error',
        text: 'Erro de conexão'
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Funções utilitárias
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sem limite'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-600 bg-green-100'
      case 'USED': return 'text-gray-600 bg-gray-100'
      case 'EXPIRED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Disponível'
      case 'USED': return 'Usado'
      case 'EXPIRED': return 'Expirado'
      default: return status
    }
  }

  const getCouponTypeBadge = (type: string) => {
    return type === 'AUCTION_50' 
      ? <Badge variant="destructive">Leilão 50%</Badge>
      : <Badge variant="secondary">Regular 25%</Badge>
  }

  if (loading || isLoadingDiscount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Cupons</h1>
          <p className="mt-2 text-gray-600">Gerencie cartões pré-pagos e cupons de desconto</p>
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

        <Tabs defaultValue="prepaid" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prepaid" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Cartões Pré-pagos
            </TabsTrigger>
            <TabsTrigger value="discount" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Cupons de Desconto
            </TabsTrigger>
          </TabsList>

          {/* Aba de Cartões Pré-pagos */}
          <TabsContent value="prepaid" className="space-y-6">
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
                  <CardTitle>Criar Novos Cartões</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createCoupons} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="code">Código Base</Label>
                      <Input
                        id="code"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                        placeholder="DESCONTO10"
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
                    <div className="flex items-end gap-2">
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Criar
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista de cartões pré-pagos */}
            <Card>
              <CardHeader>
                <CardTitle>Cartões Cadastrados ({coupons.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comprador
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Criação
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {coupon.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(coupon.face_value_cents)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon.status)}`}>
                              {getStatusText(coupon.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {coupon.buyer ? (
                              <div>
                                <div className="font-medium">{coupon.buyer.name}</div>
                                <div className="text-gray-500">{coupon.buyer.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Não vendido</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(coupon.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {coupon.status === 'AVAILABLE' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteCoupon(coupon.id)}
                              >
                                Excluir
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {coupons.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum cartão encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Cupons de Desconto */}
          <TabsContent value="discount" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Cupons de Desconto</h2>
                <p className="text-gray-600">Gerencie cupons de desconto percentual</p>
              </div>

              <Dialog open={showCreateDiscountDialog} onOpenChange={setShowCreateDiscountDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cupom
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Cupom de Desconto</DialogTitle>
                    <DialogDescription>
                      Configure um novo cupom de desconto percentual
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="discount-code">Código do Cupom</Label>
                      <Input
                        id="discount-code"
                        value={newDiscountCoupon.code}
                        onChange={(e) => setNewDiscountCoupon({
                          ...newDiscountCoupon,
                          code: e.target.value.toUpperCase()
                        })}
                        placeholder="Ex: DESCONTO25"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount-type">Tipo de Cupom</Label>
                      <Select
                        value={newDiscountCoupon.type}
                        onValueChange={(value) => {
                          const typedValue = value as 'REGULAR_25' | 'AUCTION_50'
                          setNewDiscountCoupon({
                            ...newDiscountCoupon,
                            type: typedValue,
                            discount_percent: typedValue === 'AUCTION_50' ? 50 : 25,
                            requires_auction: typedValue === 'AUCTION_50'
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REGULAR_25">Regular 25%</SelectItem>
                          <SelectItem value="AUCTION_50">Leilão 50%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="discount-percent">Desconto (%)</Label>
                      <Input
                        id="discount-percent"
                        type="number"
                        value={newDiscountCoupon.discount_percent}
                        onChange={(e) => setNewDiscountCoupon({
                          ...newDiscountCoupon,
                          discount_percent: parseInt(e.target.value) || 0
                        })}
                        min="1"
                        max="100"
                        disabled={true}
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount-max-uses">Limite de Usos (opcional)</Label>
                      <Input
                        id="discount-max-uses"
                        type="number"
                        value={newDiscountCoupon.max_uses}
                        onChange={(e) => setNewDiscountCoupon({
                          ...newDiscountCoupon,
                          max_uses: e.target.value
                        })}
                        placeholder="Deixe vazio para ilimitado"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount-valid-from">Válido a partir de (opcional)</Label>
                      <Input
                        id="discount-valid-from"
                        type="datetime-local"
                        value={newDiscountCoupon.valid_from}
                        onChange={(e) => setNewDiscountCoupon({
                          ...newDiscountCoupon,
                          valid_from: e.target.value
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount-valid-until">Válido até (opcional)</Label>
                      <Input
                        id="discount-valid-until"
                        type="datetime-local"
                        value={newDiscountCoupon.valid_until}
                        onChange={(e) => setNewDiscountCoupon({
                          ...newDiscountCoupon,
                          valid_until: e.target.value
                        })}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="discount-is-active"
                        checked={newDiscountCoupon.is_active}
                        onCheckedChange={(checked) => setNewDiscountCoupon({
                          ...newDiscountCoupon,
                          is_active: checked
                        })}
                      />
                      <Label htmlFor="discount-is-active">Cupom ativo</Label>
                    </div>

                    <Button
                      onClick={handleCreateDiscountCoupon}
                      disabled={isCreating || !newDiscountCoupon.code}
                      className="w-full"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Criando...
                        </>
                      ) : (
                        'Criar Cupom'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Lista de cupons de desconto */}
            <div className="grid gap-6">
              {discountCoupons.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Tag className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum cupom de desconto encontrado
                    </h3>
                    <p className="text-gray-500 text-center mb-4">
                      Crie seu primeiro cupom de desconto para começar
                    </p>
                    <Button onClick={() => setShowCreateDiscountDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Cupom
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                discountCoupons.map((coupon) => (
                  <Card key={coupon.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5" />
                            {coupon.code}
                            {getCouponTypeBadge(coupon.type)}
                          </CardTitle>
                          <CardDescription>
                            Desconto de {coupon.discount_percent}% • 
                            Criado em {formatDate(coupon.created_at)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {coupon.is_active ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {coupon.current_uses}
                              {coupon.max_uses ? `/${coupon.max_uses}` : ''}
                            </p>
                            <p className="text-xs text-gray-500">Usos</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {formatDate(coupon.valid_from)}
                            </p>
                            <p className="text-xs text-gray-500">Válido de</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {formatDate(coupon.valid_until)}
                            </p>
                            <p className="text-xs text-gray-500">Válido até</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {coupon.order_discounts.length}
                            </p>
                            <p className="text-xs text-gray-500">Pedidos</p>
                          </div>
                        </div>
                      </div>

                      {coupon.type === 'AUCTION_50' && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertDescription className="text-orange-700">
                            <strong>Cupom de Leilão:</strong> Válido apenas para produtos marcados como "Produto de Leilão" nas datas específicas configuradas.
                          </AlertDescription>
                        </Alert>
                      )}

                      {coupon.order_discounts.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Últimos usos:</h4>
                          <div className="space-y-1">
                            {coupon.order_discounts.slice(0, 3).map((orderDiscount) => (
                              <div key={orderDiscount.id} className="text-xs text-gray-600">
                                {orderDiscount.order.user.name} ({orderDiscount.order.user.email})
                              </div>
                            ))}
                            {coupon.order_discounts.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{coupon.order_discounts.length - 3} mais...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}