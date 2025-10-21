const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCouponAssociation() {
  try {
    console.log('🔧 CORRIGINDO ASSOCIAÇÃO DO CUPOM...\n')

    // Buscar o último cupom sem buyer_id
    const orphanCoupon = await prisma.coupon.findFirst({
      where: {
        buyer_id: null
      },
      orderBy: { created_at: 'desc' }
    })

    if (!orphanCoupon) {
      console.log('✅ Nenhum cupom órfão encontrado')
      return
    }

    console.log('🎫 CUPOM ÓRFÃO ENCONTRADO:')
    console.log('   ID:', orphanCoupon.id)
    console.log('   Código:', orphanCoupon.code)
    console.log('   Criado em:', orphanCoupon.created_at)

    // Buscar sessão mais recente (ativa ou não)
    const recentSession = await prisma.session.findFirst({
      orderBy: {
        expires: 'desc'
      },
      include: {
        user: true
      }
    })

    if (!recentSession?.user) {
      console.log('❌ Nenhuma sessão encontrada')
      return
    }

    console.log('\n👤 USUÁRIO DA SESSÃO RECENTE:')
    console.log('   ID:', recentSession.user.id)
    console.log('   Nome:', recentSession.user.name)
    console.log('   Email:', recentSession.user.email)

    // Atualizar o cupom para associá-lo ao usuário
    const updatedCoupon = await prisma.coupon.update({
      where: { id: orphanCoupon.id },
      data: { buyer_id: recentSession.user.id },
      include: {
        buyer: true
      }
    })

    console.log('\n✅ CUPOM ATUALIZADO COM SUCESSO!')
    console.log('   Código:', updatedCoupon.code)
    console.log('   Comprador:', updatedCoupon.buyer?.name)
    console.log('   Email:', updatedCoupon.buyer?.email)

    // Tentar enviar o email do cupom
    console.log('\n📧 TENTANDO ENVIAR EMAIL...')
    
    // Importar a função de envio de email
    const { sendCouponEmail } = require('./src/lib/email')
    
    try {
      await sendCouponEmail({
        to: recentSession.user.email,
        couponCode: updatedCoupon.code,
        couponValue: updatedCoupon.face_value_cents,
        customerName: recentSession.user.name || 'Cliente'
      })
      console.log('✅ Email enviado com sucesso!')
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError.message)
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCouponAssociation()