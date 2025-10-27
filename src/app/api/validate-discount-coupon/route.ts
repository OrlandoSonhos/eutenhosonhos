import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Código do cartão é obrigatório'),
  total_cents: z.number().min(1, 'Total do pedido deve ser maior que zero'),
  selected_product_id: z.string().min(1, 'Produto específico deve ser selecionado para aplicar o cupom'),
  cart_items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    price_cents: z.number(),
    quantity: z.number(),
    stock: z.number(),
    category_id: z.string().optional()
  })).optional()
})

// POST - Validar cupom de desconto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !(session as any).user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code, total_cents, selected_product_id, cart_items } = validateCouponSchema.parse(body)
    const userId = (session as any).user.id

    console.log(`[COUPON_VALIDATION] Iniciando validação de cupom:`, {
      coupon_code: code,
      selected_product_id: selected_product_id,
      cart_items_count: cart_items?.length || 0,
      user_id: userId,
      timestamp: new Date().toISOString()
    })

    // Verificar se o produto selecionado existe no carrinho
    const selectedProduct = cart_items?.find(item => item.id === selected_product_id)
    if (!selectedProduct) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Produto selecionado não encontrado no carrinho' 
        },
        { status: 400 }
      )
    }

    // Buscar cupons comprados pelo usuário - verificar uso único
    const couponPurchases = await prisma.discountCouponPurchase.findMany({
      where: { 
        buyer_id: userId,
        code: code.toUpperCase()
      },
      include: {
        discount_coupon: true
      }
    })

    if (couponPurchases.length === 0) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão não encontrado' 
        },
        { status: 400 }
      )
    }

    const couponPurchase = couponPurchases[0]

    // Verificar se o cupom já foi usado (uso único)
    if (couponPurchase.used_at) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Este cartão já foi utilizado e só pode ser usado uma vez' 
        },
        { status: 400 }
      )
    }

    const coupon = couponPurchase.discount_coupon

    // Verificar se o cupom está ativo
    if (!coupon.is_active) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão inativo' 
        },
        { status: 400 }
      )
    }

    // Verificar se o cupom comprado expirou
    if (couponPurchase.expires_at && new Date() > couponPurchase.expires_at) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão expirado' 
        },
        { status: 400 }
      )
    }

    // Verificar datas de validade do cupom
    const now = new Date()
    
    if (coupon.valid_from && now < coupon.valid_from) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão ainda não está válido. Verifique a data de início.' 
        },
        { status: 400 }
      )
    }

    if (coupon.valid_until && now > coupon.valid_until) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cartão expirado. Período de validade encerrado.' 
        },
        { status: 400 }
      )
    }

    // Verificar restrições por categoria do produto selecionado
    // Buscar restrições do cupom
    const couponRestrictions = await prisma.couponCategoryRestriction.findMany({
      where: {
        coupon_type: coupon.type
      },
      include: { category: true }
    })

    console.log(`[COUPON_VALIDATION] Verificando restrições para cupom ${coupon.type}:`, {
      coupon_id: coupon.id,
      restrictions_count: couponRestrictions.length,
      selected_product_id: selectedProduct.id,
      selected_product_category: selectedProduct.category_id,
      user_id: userId
    })

    if (couponRestrictions.length > 0) {
      // Obter a categoria do produto selecionado
      const selectedProductCategoryId = selectedProduct.category_id

      if (!selectedProductCategoryId) {
        console.log(`[COUPON_VALIDATION] ERRO - Produto selecionado sem categoria:`, {
          product_id: selectedProduct.id,
          product_title: selectedProduct.title,
          user_id: userId
        })
        
        return NextResponse.json(
          { 
            valid: false, 
            error: 'Produto selecionado não possui categoria definida' 
          },
          { status: 400 }
        )
      }

      console.log(`[COUPON_VALIDATION] Categoria do produto selecionado:`, {
        product_id: selectedProduct.id,
        product_title: selectedProduct.title,
        category_id: selectedProductCategoryId
      })

      // Verificar restrições apenas para o produto selecionado
      for (const restriction of couponRestrictions) {
        console.log(`[COUPON_VALIDATION] Verificando restrição:`, {
          restriction_type: restriction.restriction_type,
          restriction_category_id: restriction.category_id,
          restriction_category_name: restriction.category.name,
          selected_product_category_id: selectedProductCategoryId
        })

        if (restriction.restriction_type === 'ALLOWED') {
          // Cupom pode ser usado apenas nesta categoria específica
          if (selectedProductCategoryId === restriction.category_id) {
            console.log(`[COUPON_VALIDATION] RESTRIÇÃO ATENDIDA - ALLOWED:`, {
              allowed_category: restriction.category.name,
              selected_product_category: selectedProductCategoryId,
              user_id: userId
            })
            // Categoria permitida - continuar validação
            break
          } else {
            // Produto não está na categoria permitida
            console.log(`[COUPON_VALIDATION] RESTRIÇÃO VIOLADA - ALLOWED:`, {
              allowed_category: restriction.category.name,
              selected_product_category: selectedProductCategoryId,
              user_id: userId
            })
            
            return NextResponse.json(
              { 
                valid: false, 
                error: `Este cartão só pode ser usado em produtos da categoria: ${restriction.category.name}` 
              },
              { status: 400 }
            )
          }
        } else if (restriction.restriction_type === 'FORBIDDEN') {
          // Cupom não pode ser usado nesta categoria específica
          if (selectedProductCategoryId === restriction.category_id) {
            console.log(`[COUPON_VALIDATION] RESTRIÇÃO VIOLADA - FORBIDDEN:`, {
              forbidden_category: restriction.category.name,
              selected_product_category: selectedProductCategoryId,
              user_id: userId
            })
            
            return NextResponse.json(
              { 
                valid: false, 
                error: `Este cartão não pode ser usado em produtos da categoria: ${restriction.category.name}` 
              },
              { status: 400 }
            )
          }
        }
      }

      console.log(`[COUPON_VALIDATION] Todas as restrições de categoria foram atendidas`, {
        coupon_type: coupon.type,
        selected_product_category: selectedProductCategoryId,
        user_id: userId
      })
    } else {
      console.log(`[COUPON_VALIDATION] Nenhuma restrição de categoria encontrada para o cupom ${coupon.type}`)
    }

    // Calcular desconto apenas para o produto selecionado
    const product_total_cents = selectedProduct.price_cents * selectedProduct.quantity
    const discount_amount = Math.floor((product_total_cents * coupon.discount_percent) / 100)
    const final_total = total_cents - discount_amount

    console.log(`[COUPON_VALIDATION] Validação concluída com sucesso:`, {
      coupon_type: coupon.type,
      discount_percent: coupon.discount_percent,
      selected_product: {
        id: selectedProduct.id,
        title: selectedProduct.title,
        price_cents: selectedProduct.price_cents,
        quantity: selectedProduct.quantity,
        total_cents: product_total_cents
      },
      discount_amount: discount_amount,
      total_cents: total_cents,
      user_id: userId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: couponPurchase.code,
        discount_percent: coupon.discount_percent,
        type: coupon.type
      },
      selected_product: {
        id: selectedProduct.id,
        title: selectedProduct.title,
        price_cents: selectedProduct.price_cents,
        quantity: selectedProduct.quantity
      },
      discount_amount,
      final_total,
      savings: discount_amount
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Dados inválidos', 
          details: error.issues
        },
        { status: 400 }
      )
    }

    console.error('Erro ao validar cupom:', error)
    return NextResponse.json(
      { 
        valid: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}