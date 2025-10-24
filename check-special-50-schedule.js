const { PrismaClient } = require('@prisma/client')

async function checkSpecial50Schedule() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando configurações de horário para cupons SPECIAL_50...')
    
    // Buscar todos os cupons SPECIAL_50
    const special50Coupons = await prisma.discountCoupon.findMany({
      where: { type: 'SPECIAL_50' }
    })
    
    console.log(`📋 Encontrados ${special50Coupons.length} cupons SPECIAL_50:`)
    
    for (const coupon of special50Coupons) {
      console.log('\n--- CUPOM SPECIAL_50 ---')
      console.log('- ID:', coupon.id)
      console.log('- Desconto:', coupon.discount_percent + '%')
      console.log('- Ativo:', coupon.is_active ? 'SIM' : 'NÃO')
      console.log('- Preço de venda:', coupon.sale_price_cents ? (coupon.sale_price_cents / 100) + ' reais' : 'Não definido')
      console.log('- Criado em:', coupon.created_at)
      console.log('- Válido de:', coupon.valid_from || 'Não definido')
      console.log('- Válido até:', coupon.valid_until || 'Não definido')
      
      // Verificar se está no período válido
      if (coupon.valid_from && coupon.valid_until) {
        const now = new Date()
        const validFrom = new Date(coupon.valid_from)
        const validUntil = new Date(coupon.valid_until)
        
        console.log('- Status atual:', 
          now < validFrom ? '⏳ AINDA NÃO INICIADO' :
          now > validUntil ? '❌ EXPIRADO' :
          '✅ ATIVO AGORA'
        )
        
        console.log('- Horário de início:', validFrom.toLocaleString('pt-BR'))
        console.log('- Horário de fim:', validUntil.toLocaleString('pt-BR'))
      } else {
        console.log('- Status atual: ⚠️ SEM RESTRIÇÃO DE HORÁRIO')
      }
      
      // Verificar quantos foram comprados
      const purchases = await prisma.discountCouponPurchase.findMany({
        where: { discount_coupon_id: coupon.id }
      })
      
      console.log('- Total de compras:', purchases.length)
      
      if (purchases.length > 0) {
        const usedPurchases = purchases.filter(p => p.used_at)
        console.log('- Cupons usados:', usedPurchases.length)
        console.log('- Cupons disponíveis:', purchases.length - usedPurchases.length)
      }
    }
    
    // Verificar se o cupom 9KX3XTDG está dentro do período válido
    console.log('\n🎯 VERIFICAÇÃO ESPECÍFICA DO CUPOM 9KX3XTDG:')
    
    const coupon9KX3XTDG = await prisma.discountCouponPurchase.findFirst({
      where: { code: '9KX3XTDG' },
      include: { discount_coupon: true }
    })
    
    if (coupon9KX3XTDG) {
      const coupon = coupon9KX3XTDG.discount_coupon
      const now = new Date()
      
      console.log('- Tipo do cupom:', coupon.type)
      console.log('- Data atual:', now.toLocaleString('pt-BR'))
      
      if (coupon.valid_from && coupon.valid_until) {
        const validFrom = new Date(coupon.valid_from)
        const validUntil = new Date(coupon.valid_until)
        
        console.log('- Período válido:', validFrom.toLocaleString('pt-BR'), 'até', validUntil.toLocaleString('pt-BR'))
        
        if (now < validFrom) {
          console.log('❌ CUPOM AINDA NÃO ESTÁ VÁLIDO')
          console.log('- Será válido em:', Math.ceil((validFrom - now) / (1000 * 60 * 60)), 'horas')
        } else if (now > validUntil) {
          console.log('❌ CUPOM EXPIRADO')
          console.log('- Expirou há:', Math.ceil((now - validUntil) / (1000 * 60 * 60)), 'horas')
        } else {
          console.log('✅ CUPOM ESTÁ VÁLIDO AGORA!')
          console.log('- Expira em:', Math.ceil((validUntil - now) / (1000 * 60 * 60)), 'horas')
        }
      } else {
        console.log('✅ CUPOM SEM RESTRIÇÃO DE HORÁRIO - SEMPRE VÁLIDO')
      }
    }
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSpecial50Schedule()