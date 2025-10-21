const { PrismaClient } = require('@prisma/client');

// Como o arquivo é TypeScript, vamos definir os tipos aqui
const COUPON_TYPES = [
  {
    id: 'cupom001',
    name: 'Cupom R$ 0,01',
    faceValueCents: 1,
    salePriceCents: 1,
    description: 'Cupom de teste de R$ 0,01 por apenas R$ 0,01'
  },
  {
    id: 'cupom25',
    name: 'Cupom R$ 25',
    faceValueCents: 2500,
    salePriceCents: 500,
    description: 'Cupom de desconto de R$ 25 por apenas R$ 5'
  },
  {
    id: 'cupom50',
    name: 'Cupom R$ 50',
    faceValueCents: 5000,
    salePriceCents: 1000,
    description: 'Cupom de desconto de R$ 50 por apenas R$ 10'
  },
  {
    id: 'cupom100',
    name: 'Cupom R$ 100',
    faceValueCents: 10000,
    salePriceCents: 2000,
    description: 'Cupom de desconto de R$ 100 por apenas R$ 20'
  },
  {
    id: 'cupom200',
    name: 'Cupom R$ 200',
    faceValueCents: 20000,
    salePriceCents: 4000,
    description: 'Cupom de desconto de R$ 200 por apenas R$ 40'
  }
];

// Função para gerar código do cupom
function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Função para adicionar dias
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const prisma = new PrismaClient();

async function createManualCoupon() {
  try {
    console.log('🎫 CRIANDO CUPOM MANUAL PARA MERCHANT ORDER 34909923177\n');
    
    // Dados do pagamento baseados no webhook recebido
    const merchantOrderId = '34909923177';
    const paymentAmount = 0.01; // R$ 0,01 conforme o teste
    const paymentAmountCents = Math.round(paymentAmount * 100); // 1 centavo
    const buyerEmail = 'vini_deiro@icloud.com'; // Email do comprador
    const buyerName = 'Vinicius'; // Nome do comprador
    
    console.log('📋 DADOS DO PAGAMENTO:');
    console.log(`   Merchant Order ID: ${merchantOrderId}`);
    console.log(`   Valor pago: R$ ${paymentAmount.toFixed(2)}`);
    console.log(`   Valor em centavos: ${paymentAmountCents}`);
    console.log(`   E-mail: ${buyerEmail}`);
    console.log(`   Nome: ${buyerName}`);
    
    // Encontrar o tipo de cupom baseado no valor pago
    console.log('\n🔍 PROCURANDO TIPO DE CUPOM...');
    console.log('   Tipos disponíveis:');
    COUPON_TYPES.forEach(type => {
      console.log(`     ${type.id}: R$ ${type.faceValueCents/100} por R$ ${type.salePriceCents/100}`);
    });
    
    const couponType = COUPON_TYPES.find(type => type.salePriceCents === paymentAmountCents);
    
    if (!couponType) {
      console.error('❌ ERRO: Tipo de cupom não encontrado para valor:', paymentAmountCents);
      console.error('   Valores disponíveis:', COUPON_TYPES.map(t => t.salePriceCents));
      return;
    }
    
    console.log(`✅ Tipo de cupom encontrado: ${couponType.id}`);
    console.log(`   Valor do cupom: R$ ${couponType.faceValueCents/100}`);
    console.log(`   Preço pago: R$ ${couponType.salePriceCents/100}`);
    
    // Verificar se já existe um cupom para este merchant order
    console.log('\n🔍 VERIFICANDO SE JÁ EXISTE CUPOM...');
    const existingPayment = await prisma.payment.findFirst({
      where: { 
        mp_payment_id: merchantOrderId 
      },
      include: {
        coupon: true
      }
    });
    
    if (existingPayment) {
      console.log('⚠️ JÁ EXISTE UM PAGAMENTO REGISTRADO:');
      console.log(`   ID: ${existingPayment.id}`);
      console.log(`   Status: ${existingPayment.status}`);
      if (existingPayment.coupon) {
        console.log(`   Cupom: ${existingPayment.coupon.code}`);
        console.log('❌ CUPOM JÁ FOI CRIADO - CANCELANDO OPERAÇÃO');
        return;
      }
    }
    
    // Buscar ou criar usuário
    console.log('\n👤 BUSCANDO/CRIANDO USUÁRIO...');
    let user = await prisma.user.findUnique({
      where: { email: buyerEmail }
    });
    
    if (!user) {
      console.log('   Usuário não encontrado, criando...');
      user = await prisma.user.create({
        data: {
          email: buyerEmail,
          name: buyerName,
          role: 'USER'
        }
      });
      console.log(`   ✅ Usuário criado: ${user.id}`);
    } else {
      console.log(`   ✅ Usuário encontrado: ${user.id} - ${user.email}`);
    }
    
    // Criar cupom
    console.log('\n🎫 CRIANDO CUPOM...');
    const code = generateCouponCode();
    const expiresAt = addDays(new Date(), 30);
    
    const coupon = await prisma.coupon.create({
      data: {
        code,
        face_value_cents: couponType.faceValueCents,
        sale_price_cents: couponType.salePriceCents,
        buyer_id: user.id,
        expires_at: expiresAt,
        status: 'AVAILABLE'
      },
      include: {
        buyer: true
      }
    });
    
    console.log(`✅ Cupom criado com sucesso!`);
    console.log(`   Código: ${coupon.code}`);
    console.log(`   Valor: R$ ${coupon.face_value_cents / 100}`);
    console.log(`   Status: ${coupon.status}`);
    console.log(`   Expira em: ${coupon.expires_at.toLocaleDateString('pt-BR')}`);
    
    // Registrar pagamento
    console.log('\n💳 REGISTRANDO PAGAMENTO...');
    const payment = await prisma.payment.create({
      data: {
        coupon_id: coupon.id,
        mp_payment_id: merchantOrderId, // Usando merchant order ID como referência
        amount_cents: paymentAmountCents,
        status: 'APPROVED',
        method: 'PIX'
      }
    });
    
    console.log(`✅ Pagamento registrado: ${payment.id}`);
    
    console.log('\n🎉 CUPOM CRIADO COM SUCESSO!');
    console.log('📧 Próximo passo: Enviar e-mail com o cupom');
    console.log(`   Para: ${buyerEmail}`);
    console.log(`   Código: ${coupon.code}`);
    console.log(`   Valor: R$ ${coupon.face_value_cents / 100}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar cupom manual:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createManualCoupon();