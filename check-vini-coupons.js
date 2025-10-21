const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkViniCoupons() {
  try {
    console.log('🔍 VERIFICANDO CUPONS PARA vini_deiro@icloud.com...\n')
    
    // 1. Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: 'vini_deiro@icloud.com' }
    })
    
    if (!user) {
      console.log('❌ Usuário vini_deiro@icloud.com não encontrado no banco')
      return
    }
    
    console.log('✅ Usuário encontrado:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Criado em: ${user.created_at}\n`)
    
    // 2. Buscar cupons do usuário
    const coupons = await prisma.coupon.findMany({
      where: { buyer_id: user.id },
      include: {
        payment: true
      },
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`📊 CUPONS ENCONTRADOS: ${coupons.length}\n`)
    
    if (coupons.length === 0) {
      console.log('❌ Nenhum cupom encontrado para este usuário')
      
      // Verificar se há cupons órfãos (sem buyer_id) criados recentemente
      console.log('\n🔍 Verificando cupons órfãos recentes...')
      const recentOrphanCoupons = await prisma.coupon.findMany({
        where: {
          buyer_id: null,
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
          }
        },
        include: {
          payment: true
        },
        orderBy: { created_at: 'desc' }
      })
      
      if (recentOrphanCoupons.length > 0) {
        console.log(`⚠️  Encontrados ${recentOrphanCoupons.length} cupons órfãos nas últimas 24h:`)
        recentOrphanCoupons.forEach((coupon, index) => {
          console.log(`   ${index + 1}. Código: ${coupon.code}`)
        console.log(`      Valor: R$ ${(coupon.face_value_cents / 100).toFixed(2)}`)
        console.log(`      Status: ${coupon.status}`)
        console.log(`      Criado: ${coupon.created_at.toLocaleString('pt-BR')}`)
        if (coupon.payment) {
          console.log(`      Pagamento: ${coupon.payment.mp_payment_id || 'N/A'} - Status: ${coupon.payment.status}`)
        }
          console.log('')
        })
      } else {
        console.log('   Nenhum cupom órfão encontrado')
      }
      
      return
    }
    
    // 3. Mostrar detalhes dos cupons
    coupons.forEach((coupon, index) => {
      console.log(`${index + 1}. CUPOM:`)
      console.log(`   🎫 Código: ${coupon.code}`)
      console.log(`   💰 Valor: R$ ${(coupon.face_value_cents / 100).toFixed(2)}`)
      console.log(`   📊 Status: ${coupon.status}`)
      console.log(`   📅 Criado: ${coupon.created_at.toLocaleString('pt-BR')}`)
      console.log(`   ⏰ Expira: ${coupon.expires_at.toLocaleString('pt-BR')}`)
      
      if (coupon.payment) {
        console.log(`   💳 Pagamento:`)
        console.log(`      MP ID: ${coupon.payment.mp_payment_id}`)
        console.log(`      Valor: R$ ${(coupon.payment.amount_cents / 100).toFixed(2)}`)
        console.log(`      Status: ${coupon.payment.status}`)
        console.log(`      Método: ${coupon.payment.method}`)
        console.log(`      Data: ${coupon.payment.created_at.toLocaleString('pt-BR')}`)
      } else {
        console.log(`   ❌ Nenhum pagamento associado`)
      }
      console.log('')
    })
    
    // 4. Verificar pagamentos recentes que podem estar relacionados
    console.log('🔍 VERIFICANDO PAGAMENTOS RECENTES...\n')
    const recentPayments = await prisma.payment.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
        }
      },
      include: {
        coupon: {
          include: {
            buyer: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`💳 PAGAMENTOS RECENTES: ${recentPayments.length}\n`)
    
    recentPayments.forEach((payment, index) => {
      console.log(`${index + 1}. PAGAMENTO:`)
      console.log(`   💳 MP ID: ${payment.mp_payment_id}`)
      console.log(`   💰 Valor: R$ ${(payment.amount_cents / 100).toFixed(2)}`)
      console.log(`   📅 Data: ${payment.created_at.toLocaleString('pt-BR')}`)
      console.log(`   ✅ Status: ${payment.status}`)
      console.log(`   💳 Método: ${payment.method}`)
      
      if (payment.coupon) {
        console.log(`   🎫 Cupom: ${payment.coupon.code}`)
        if (payment.coupon.buyer) {
          console.log(`   👤 Comprador: ${payment.coupon.buyer.name} (${payment.coupon.buyer.email})`)
        } else {
          console.log(`   👤 Comprador: Não identificado`)
        }
      }
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkViniCoupons()