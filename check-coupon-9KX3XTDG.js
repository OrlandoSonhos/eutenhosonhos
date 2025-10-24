const { PrismaClient } = require('@prisma/client')

async function checkCoupon() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando cupom 9KX3XTDG...')
    
    // Buscar cupom regular
    const regularCoupon = await prisma.coupon.findFirst({
      where: { code: '9KX3XTDG' }
    })
    
    if (regularCoupon) {
      console.log('📋 CUPOM REGULAR ENCONTRADO:')
      console.log('- Código:', regularCoupon.code)
      console.log('- Valor:', regularCoupon.face_value_cents / 100, 'reais')
      console.log('- Tipo:', regularCoupon.type)
      console.log('- Usado:', regularCoupon.is_used ? 'SIM' : 'NÃO')
      console.log('- Criado em:', regularCoupon.created_at)
      console.log('- Expira em:', regularCoupon.expires_at)
      if (regularCoupon.used_at) {
        console.log('- Usado em:', regularCoupon.used_at)
      }
    }
    
    // Buscar cupom de desconto
    const discountCouponPurchase = await prisma.discountCouponPurchase.findFirst({
      where: { code: '9KX3XTDG' },
      include: {
        discount_coupon: true,
        buyer: true
      }
    })
    
    if (discountCouponPurchase) {
      console.log('📋 CUPOM DE DESCONTO ENCONTRADO:')
      console.log('- Código:', discountCouponPurchase.code)
      console.log('- Desconto:', discountCouponPurchase.discount_coupon.discount_percent + '%')
      console.log('- Tipo:', discountCouponPurchase.discount_coupon.type)
      console.log('- Ativo:', discountCouponPurchase.discount_coupon.is_active ? 'SIM' : 'NÃO')
      console.log('- Comprador:', discountCouponPurchase.buyer.email)
      console.log('- Criado em:', discountCouponPurchase.created_at)
      console.log('- Expira em:', discountCouponPurchase.expires_at)
      console.log('- Usado em:', discountCouponPurchase.used_at || 'Não usado')
    }
    
    if (!regularCoupon && !discountCouponPurchase) {
      console.log('❌ Cupom 9KX3XTDG não encontrado!')
    }
    
    // Verificar se foi usado em algum pedido (através da relação com DiscountCouponPurchase)
    if (discountCouponPurchase && discountCouponPurchase.order_id) {
      const orderWithCoupon = await prisma.order.findFirst({
        where: { id: discountCouponPurchase.order_id },
        include: {
          user: true
        }
      })
      
      if (orderWithCoupon) {
        console.log('📦 PEDIDO COM ESTE CUPOM:')
        console.log('- ID do pedido:', orderWithCoupon.id)
        console.log('- Data do pedido:', orderWithCoupon.created_at)
        console.log('- Usuário:', orderWithCoupon.user.email)
        console.log('- Valor total:', orderWithCoupon.total_cents / 100, 'reais')
        console.log('- Desconto aplicado:', orderWithCoupon.discount_cents / 100, 'reais')
        console.log('- Status:', orderWithCoupon.status)
      }
    } else {
      console.log('📦 Este cupom ainda não foi usado em nenhum pedido.')
    }
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCoupon()