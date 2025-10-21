// Teste de conectividade usando as mesmas importações do webhook
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Simular prismaWithRetry
const prismaWithRetry = {
  payment: {
    findMany: (...args) => prisma.payment.findMany(...args),
    findFirst: (...args) => prisma.payment.findFirst(...args),
  },
  user: {
    findMany: (...args) => prisma.user.findMany(...args),
    findFirst: (...args) => prisma.user.findFirst(...args),
  }
}

async function testDatabaseConnection() {
  console.log('🔍 TESTANDO CONECTIVIDADE DO BANCO...')
  
  try {
    console.log('\n1️⃣ Testando prisma direto...')
    const users = await prisma.user.findMany({
      take: 1,
      select: { id: true, email: true, name: true }
    })
    console.log('✅ prisma direto funcionou:', users.length, 'usuários encontrados')
    
    console.log('\n2️⃣ Testando prismaWithRetry...')
    const payments = await prismaWithRetry.payment.findMany({
      take: 1,
      select: { id: true, mp_payment_id: true, amount_cents: true }
    })
    console.log('✅ prismaWithRetry funcionou:', payments.length, 'pagamentos encontrados')
    
    console.log('\n3️⃣ Testando busca específica como no webhook...')
    const testPayment = await prismaWithRetry.payment.findFirst({
      where: {
        mp_payment_id: 'test_payment_123'
      }
    })
    console.log('✅ Busca específica funcionou:', testPayment ? 'Encontrado' : 'Não encontrado')
    
    console.log('\n✅ TODOS OS TESTES PASSARAM!')
    
  } catch (error) {
    console.error('❌ ERRO:', error.message)
    console.error('Código:', error.code)
    console.error('Tipo:', error.constructor.name)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection()