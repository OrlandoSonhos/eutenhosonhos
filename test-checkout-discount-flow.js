const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCheckoutDiscountFlow() {
  console.log('🧪 Testando fluxo de checkout com cupom de desconto...\n')

  try {
    // 1. Buscar um cupom de desconto válido
    console.log('1. Buscando cupom de desconto válido...')
    const discountCoupon = await prisma.discountCouponPurchase.findFirst({
      where: {
        used_at: null
      },
      include: {
        discount_coupon: true
      }
    })

    if (!discountCoupon) {
      console.log('❌ Nenhum cupom de desconto disponível para teste')
      return
    }

    console.log(`✅ Cupom encontrado: ${discountCoupon.code}`)
    console.log(`   Desconto: ${discountCoupon.discount_coupon.discount_percent}%`)

    // 2. Buscar produtos para simular carrinho
    console.log('\n2. Buscando produtos para simular carrinho...')
    const products = await prisma.product.findMany({
      where: {
        active: true,
        stock: { gt: 0 }
      },
      take: 2
    })

    if (products.length === 0) {
      console.log('❌ Nenhum produto disponível para teste')
      return
    }

    console.log(`✅ ${products.length} produtos encontrados`)

    // 3. Simular dados do checkout
    const cartItems = products.map(product => ({
      id: product.id,
      title: product.title,
      price_cents: product.price_cents,
      quantity: 1,
      stock: product.stock
    }))

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0)
    const shipping = 1500 // R$ 15,00
    const discountPercent = discountCoupon.discount_coupon.discount_percent
    const discountAmount = Math.round(subtotal * (discountPercent / 100))
    const total = subtotal + shipping - discountAmount

    console.log('\n3. Simulando cálculos do checkout:')
    console.log(`   Subtotal: R$ ${(subtotal / 100).toFixed(2)}`)
    console.log(`   Frete: R$ ${(shipping / 100).toFixed(2)}`)
    console.log(`   Desconto (${discountPercent}%): -R$ ${(discountAmount / 100).toFixed(2)}`)
    console.log(`   Total: R$ ${(total / 100).toFixed(2)}`)

    // 4. Simular criação de pedido (sem realmente criar)
    console.log('\n4. Simulando criação de pedido...')
    
    // Simular a lógica de distribuição de desconto nos itens
    const totalDiscountCents = discountAmount
    const itemsForMP = cartItems.map(item => {
      const itemTotal = item.price_cents * item.quantity
      const itemDiscountProportion = subtotal > 0 ? itemTotal / subtotal : 0
      const itemDiscount = Math.round(totalDiscountCents * itemDiscountProportion)
      const finalItemPrice = Math.max(1, item.price_cents - Math.round(itemDiscount / item.quantity))

      return {
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        original_price_cents: item.price_cents,
        final_price_cents: finalItemPrice,
        discount_applied: item.price_cents - finalItemPrice
      }
    })

    console.log('\n5. Itens com desconto aplicado para Mercado Pago:')
    let totalMPValue = 0
    itemsForMP.forEach(item => {
      const mpPrice = item.final_price_cents / 100
      totalMPValue += mpPrice * item.quantity
      console.log(`   ${item.title}:`)
      console.log(`     Preço original: R$ ${(item.original_price_cents / 100).toFixed(2)}`)
      console.log(`     Preço final: R$ ${(item.final_price_cents / 100).toFixed(2)}`)
      console.log(`     Desconto aplicado: R$ ${(item.discount_applied / 100).toFixed(2)}`)
    })

    // Adicionar frete
    totalMPValue += shipping / 100

    console.log(`\n6. Valor total que seria enviado para Mercado Pago:`)
    console.log(`   Produtos: R$ ${(totalMPValue - shipping / 100).toFixed(2)}`)
    console.log(`   Frete: R$ ${(shipping / 100).toFixed(2)}`)
    console.log(`   Total MP: R$ ${totalMPValue.toFixed(2)}`)
    console.log(`   Total esperado: R$ ${(total / 100).toFixed(2)}`)

    const difference = Math.abs(totalMPValue - total / 100)
    if (difference < 0.01) {
      console.log(`\n✅ SUCESSO: Valores coincidem! (diferença: R$ ${difference.toFixed(2)})`)
    } else {
      console.log(`\n❌ ERRO: Valores não coincidem! (diferença: R$ ${difference.toFixed(2)})`)
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCheckoutDiscountFlow()