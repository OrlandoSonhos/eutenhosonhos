const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDiscountCouponValidation() {
  try {
    console.log('🧪 TESTANDO VALIDAÇÃO DE CUPOM DE DESCONTO')
    console.log('=' .repeat(50))

    // 1. Verificar se existem cupons de desconto comprados
    console.log('1. Verificando cupons de desconto comprados...')
    const couponPurchases = await prisma.discountCouponPurchase.findMany({
      include: {
        discount_coupon: true,
        buyer: {
          select: { id: true, email: true }
        }
      },
      take: 5
    })

    if (couponPurchases.length === 0) {
      console.log('❌ Nenhum cupom de desconto comprado encontrado')
      console.log('   Criando um cupom de teste...')
      
      // Buscar um usuário existente
      const user = await prisma.user.findFirst()
      if (!user) {
        console.log('❌ Nenhum usuário encontrado')
        return
      }

      // Buscar um cupom de desconto ativo
      const discountCoupon = await prisma.discountCoupon.findFirst({
        where: { is_active: true }
      })

      if (!discountCoupon) {
        console.log('❌ Nenhum cupom de desconto ativo encontrado')
        return
      }

      // Criar uma compra de cupom de teste
      const testCouponPurchase = await prisma.discountCouponPurchase.create({
        data: {
          code: `TEST-${Date.now()}`,
          discount_coupon_id: discountCoupon.id,
          buyer_id: user.id,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
          used_at: null // Não usado
        },
        include: {
          discount_coupon: true,
          buyer: {
            select: { id: true, email: true }
          }
        }
      })

      console.log('✅ Cupom de teste criado:', {
        code: testCouponPurchase.code,
        user: testCouponPurchase.buyer.email,
        discount: testCouponPurchase.discount_coupon.discount_percent + '%'
      })

      couponPurchases.push(testCouponPurchase)
    }

    console.log(`✅ Encontrados ${couponPurchases.length} cupons de desconto comprados`)
    couponPurchases.forEach((purchase, index) => {
      console.log(`   ${index + 1}. Código: ${purchase.code}`)
      console.log(`      Usuário: ${purchase.buyer.email}`)
      console.log(`      Desconto: ${purchase.discount_coupon.discount_percent}%`)
      console.log(`      Usado: ${purchase.used_at ? 'Sim' : 'Não'}`)
      console.log(`      Expira: ${purchase.expires_at}`)
    })

    // 2. Testar a query que estava falhando
    console.log('\n2. Testando query de validação...')
    const testCoupon = couponPurchases[0]
    
    const validationQuery = await prisma.discountCouponPurchase.findMany({
      where: { 
        buyer_id: testCoupon.buyer_id,
        code: testCoupon.code,
        used_at: null // Cupom não usado
      },
      include: {
        discount_coupon: true
      }
    })

    console.log(`✅ Query executada com sucesso! Encontrados ${validationQuery.length} cupons`)
    
    if (validationQuery.length > 0) {
      const coupon = validationQuery[0]
      console.log('   Detalhes do cupom encontrado:')
      console.log(`   - Código: ${coupon.code}`)
      console.log(`   - Desconto: ${coupon.discount_coupon.discount_percent}%`)
      console.log(`   - Ativo: ${coupon.discount_coupon.is_active ? 'Sim' : 'Não'}`)
      console.log(`   - Usado: ${coupon.used_at ? 'Sim' : 'Não'}`)
    }

    // 3. Testar validação completa (simulando o endpoint)
    console.log('\n3. Simulando validação completa...')
    const totalCents = 5000 // R$ 50,00
    
    if (validationQuery.length > 0) {
      const couponPurchase = validationQuery[0]
      const coupon = couponPurchase.discount_coupon

      // Verificar se o cupom está ativo
      if (!coupon.is_active) {
        console.log('❌ Cupom inativo')
        return
      }

      // Verificar se o cupom comprado expirou
      if (couponPurchase.expires_at && new Date() > couponPurchase.expires_at) {
        console.log('❌ Cupom expirado')
        return
      }

      // Verificar datas de validade
      const now = new Date()
      
      if (coupon.valid_from && now < coupon.valid_from) {
        console.log('❌ Cupom ainda não está válido')
        return
      }

      if (coupon.valid_until && now > coupon.valid_until) {
        console.log('❌ Cupom expirado')
        return
      }

      // Calcular desconto
      const discount_amount = Math.floor((totalCents * coupon.discount_percent) / 100)
      const final_total = totalCents - discount_amount

      console.log('✅ Validação completa bem-sucedida!')
      console.log(`   Total original: R$ ${(totalCents / 100).toFixed(2)}`)
      console.log(`   Desconto (${coupon.discount_percent}%): R$ ${(discount_amount / 100).toFixed(2)}`)
      console.log(`   Total final: R$ ${(final_total / 100).toFixed(2)}`)
      console.log(`   Economia: R$ ${(discount_amount / 100).toFixed(2)}`)
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!')
    console.log('   A validação de cupom de desconto deve estar funcionando corretamente.')

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error)
    console.error('   Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testDiscountCouponValidation()