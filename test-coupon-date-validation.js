const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCouponDateValidation() {
  try {
    console.log('🧪 TESTANDO VALIDAÇÃO DE DATAS DOS CUPONS')
    console.log('=' .repeat(50))

    // 1. Buscar o cupom SPECIAL_50 que você criou
    const discountCoupon = await prisma.discountCoupon.findFirst({
      where: {
        type: 'SPECIAL_50',
        discount_percent: 50,
        is_active: true
      }
    })

    if (!discountCoupon) {
      console.log('❌ Cupom SPECIAL_50 não encontrado!')
      return
    }

    console.log('🎫 CUPOM ENCONTRADO:')
    console.log(`   - ID: ${discountCoupon.id}`)
    console.log(`   - Tipo: ${discountCoupon.type}`)
    console.log(`   - Desconto: ${discountCoupon.discount_percent}%`)
    console.log(`   - Preço: R$ ${(discountCoupon.sale_price_cents / 100).toFixed(2)}`)

    const validFrom = discountCoupon.valid_from ? new Date(discountCoupon.valid_from) : null
    const validUntil = discountCoupon.valid_until ? new Date(discountCoupon.valid_until) : null

    console.log('\n⏰ PERÍODO DE VALIDADE:')
    console.log(`   - Válido de: ${validFrom ? validFrom.toLocaleString('pt-BR') : 'Não definido'}`)
    console.log(`   - Válido até: ${validUntil ? validUntil.toLocaleString('pt-BR') : 'Não definido'}`)

    if (!validFrom || !validUntil) {
      console.log('❌ Cupom sem datas de validade definidas!')
      return
    }

    // 2. Buscar um cupom comprado deste tipo
    const couponPurchase = await prisma.discountCouponPurchase.findFirst({
      where: {
        discount_coupon_id: discountCoupon.id,
        used_at: null
      }
    })

    if (!couponPurchase) {
      console.log('❌ Nenhum cupom comprado encontrado para teste!')
      return
    }

    console.log(`\n🎟️ CUPOM COMPRADO PARA TESTE: ${couponPurchase.code}`)

    // 3. Simular validação em diferentes momentos
    const now = new Date()
    const beforeStart = new Date(validFrom.getTime() - 24 * 60 * 60 * 1000) // 1 dia antes
    const duringPeriod = new Date(validFrom.getTime() + 12 * 60 * 60 * 1000) // 12 horas depois do início
    const afterEnd = new Date(validUntil.getTime() + 24 * 60 * 60 * 1000) // 1 dia depois

    console.log('\n🧪 SIMULANDO VALIDAÇÕES:')

    // Função para simular validação
    function simulateValidation(testTime, description) {
      console.log(`\n${description}`)
      console.log(`   - Horário de teste: ${testTime.toLocaleString('pt-BR')}`)

      const canUse = testTime >= validFrom && testTime <= validUntil
      
      if (canUse) {
        console.log('   ✅ CUPOM PODE SER USADO!')
      } else {
        console.log('   ❌ CUPOM NÃO PODE SER USADO!')
        
        if (testTime < validFrom) {
          const horasRestantes = Math.ceil((validFrom.getTime() - testTime.getTime()) / (1000 * 60 * 60))
          console.log(`      - Motivo: Antes do período válido`)
          console.log(`      - Poderá ser usado em ${horasRestantes} horas`)
        }
        
        if (testTime > validUntil) {
          console.log(`      - Motivo: Período de validade expirado`)
        }
      }

      return canUse
    }

    // Testar diferentes cenários
    simulateValidation(beforeStart, '🕐 TESTE 1: Tentando usar ANTES do período válido')
    simulateValidation(duringPeriod, '🕑 TESTE 2: Tentando usar DURANTE o período válido')
    simulateValidation(afterEnd, '🕒 TESTE 3: Tentando usar DEPOIS do período válido')
    simulateValidation(now, '🕓 TESTE 4: Tentando usar AGORA')

    console.log('\n📋 RESUMO:')
    console.log(`   - Período válido: ${validFrom.toLocaleString('pt-BR')} até ${validUntil.toLocaleString('pt-BR')}`)
    console.log(`   - Horário atual: ${now.toLocaleString('pt-BR')}`)
    
    const canUseNow = now >= validFrom && now <= validUntil
    console.log(`   - Status atual: ${canUseNow ? '✅ PODE USAR AGORA' : '❌ NÃO PODE USAR AGORA'}`)

    if (!canUseNow) {
      if (now < validFrom) {
        const horasRestantes = Math.ceil((validFrom.getTime() - now.getTime()) / (1000 * 60 * 60))
        console.log(`   - Poderá usar em: ${horasRestantes} horas`)
      } else {
        console.log(`   - Cupom expirado`)
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCouponDateValidation()