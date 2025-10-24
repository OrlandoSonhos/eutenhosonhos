const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateCouponPurchase() {
  console.log('🛒 SIMULANDO COMPRA DO CUPOM DE R$ 2,03');
  console.log('==================================================');
  
  try {
    // 1. Verificar o cupom SPECIAL_50 de R$ 2,03
    console.log('🔍 Verificando cupom SPECIAL_50...');
    const discountCoupon = await prisma.discountCoupon.findFirst({
      where: {
        type: 'SPECIAL_50',
        sale_price_cents: 203,
        is_active: true
      }
    });
    
    if (!discountCoupon) {
      console.log('❌ Cupom SPECIAL_50 de R$ 2,03 não encontrado!');
      return;
    }
    
    console.log('✅ Cupom encontrado:');
    console.log(`   - ID: ${discountCoupon.id}`);
    console.log(`   - Tipo: ${discountCoupon.type}`);
    console.log(`   - Desconto: ${discountCoupon.discount_percent}%`);
    console.log(`   - Preço: R$ ${(discountCoupon.sale_price_cents / 100).toFixed(2)}`);
    console.log(`   - Válido de: ${discountCoupon.valid_from ? new Date(discountCoupon.valid_from).toLocaleString('pt-BR') : 'Não definido'}`);
    console.log(`   - Válido até: ${discountCoupon.valid_until ? new Date(discountCoupon.valid_until).toLocaleString('pt-BR') : 'Não definido'}`);
    
    // 2. Verificar se já existe um usuário de teste
    let testUser = await prisma.user.findFirst({
      where: { email: 'teste.cupom.203@exemplo.com' }
    });
    
    if (!testUser) {
      console.log('\n👤 Criando usuário de teste...');
      testUser = await prisma.user.create({
        data: {
          email: 'teste.cupom.203@exemplo.com',
          name: 'Teste Cupom R$ 2,03',
          password_hash: '$2b$10$hashedpassword123' // Hash simulado
        }
      });
      console.log(`✅ Usuário criado: ${testUser.name} (${testUser.email})`);
    } else {
      console.log(`\n👤 Usuário de teste encontrado: ${testUser.name} (${testUser.email})`);
    }
    
    // 3. Simular a compra do cupom (como o webhook faria)
    console.log('\n🛒 SIMULANDO COMPRA DO CUPOM...');
    
    // Gerar código único para o cupom (mesma lógica do webhook)
    const generateCouponCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    let couponCode = generateCouponCode()
    
    // Verificar se o código já existe
    let existingCoupon = await prisma.discountCouponPurchase.findFirst({
      where: { code: couponCode }
    })
    
    while (existingCoupon) {
      couponCode = generateCouponCode()
      existingCoupon = await prisma.discountCouponPurchase.findFirst({
        where: { code: couponCode }
      })
    }
    
    // Definir data de expiração (30 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const couponPurchase = await prisma.discountCouponPurchase.create({
      data: {
        buyer_id: testUser.id,
        discount_coupon_id: discountCoupon.id,
        code: couponCode,
        is_used: false,
        expires_at: expiresAt
      }
    });
    
    console.log('✅ COMPRA SIMULADA COM SUCESSO!');
    console.log(`   - Código do cupom: ${couponPurchase.code}`);
    console.log(`   - Valor pago: R$ 2,03`);
    console.log(`   - Data da compra: ${couponPurchase.created_at.toLocaleString('pt-BR')}`);
    console.log(`   - Expira em: ${couponPurchase.expires_at.toLocaleString('pt-BR')}`);
    console.log(`   - Status: ${couponPurchase.is_used ? 'USADO' : 'DISPONÍVEL PARA USO'}`);
    
    // 4. Verificar horários de validade
    console.log('\n⏰ VERIFICANDO HORÁRIOS DE VALIDADE...');
    
    const now = new Date();
    const validFrom = discountCoupon.valid_from ? new Date(discountCoupon.valid_from) : null;
    const validUntil = discountCoupon.valid_until ? new Date(discountCoupon.valid_until) : null;
    
    console.log(`   - Horário atual: ${now.toLocaleString('pt-BR')}`);
    
    if (validFrom) {
      console.log(`   - Válido a partir de: ${validFrom.toLocaleString('pt-BR')}`);
      if (now < validFrom) {
        console.log('   ⚠️  CUPOM AINDA NÃO PODE SER USADO (antes do horário de início)');
      } else {
        console.log('   ✅ Cupom pode ser usado (passou do horário de início)');
      }
    } else {
      console.log('   - Válido a partir de: SEM RESTRIÇÃO');
    }
    
    if (validUntil) {
      console.log(`   - Válido até: ${validUntil.toLocaleString('pt-BR')}`);
      if (now > validUntil) {
        console.log('   ❌ CUPOM EXPIRADO (passou do horário limite)');
      } else {
        console.log('   ✅ Cupom ainda válido (dentro do prazo)');
      }
    } else {
      console.log('   - Válido até: SEM RESTRIÇÃO');
    }
    
    // 5. Verificar se o cupom pode ser usado AGORA
    console.log('\n🎯 TESTE DE USO DO CUPOM AGORA...');
    
    const canUseNow = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);
    
    if (canUseNow) {
      console.log('✅ CUPOM PODE SER USADO AGORA!');
      console.log(`   - Desconto disponível: ${discountCoupon.discount_percent}%`);
      
      // Simular aplicação do desconto em uma compra
      const exemploPrecoOriginal = 100.00; // R$ 100,00
      const descontoValor = (exemploPrecoOriginal * discountCoupon.discount_percent) / 100;
      const precoFinal = exemploPrecoOriginal - descontoValor;
      
      console.log('\n💰 SIMULAÇÃO DE DESCONTO:');
      console.log(`   - Preço original: R$ ${exemploPrecoOriginal.toFixed(2)}`);
      console.log(`   - Desconto (${discountCoupon.discount_percent}%): -R$ ${descontoValor.toFixed(2)}`);
      console.log(`   - Preço final: R$ ${precoFinal.toFixed(2)}`);
      console.log(`   - Economia: R$ ${descontoValor.toFixed(2)}`);
      
    } else {
      console.log('❌ CUPOM NÃO PODE SER USADO AGORA!');
      
      if (validFrom && now < validFrom) {
        const tempoRestante = validFrom.getTime() - now.getTime();
        const horasRestantes = Math.ceil(tempoRestante / (1000 * 60 * 60));
        console.log(`   - Poderá ser usado em ${horasRestantes} horas`);
      }
      
      if (validUntil && now > validUntil) {
        console.log('   - Cupom expirado');
      }
    }
    
    // 6. Mostrar informações do cupom comprado
    console.log('\n📋 RESUMO DO SEU CUPOM:');
    console.log('==================================================');
    console.log(`🎫 Código: ${couponPurchase.code}`);
    console.log(`💰 Desconto: ${discountCoupon.discount_percent}% OFF`);
    console.log(`💳 Valor pago: R$ 2,03`);
    console.log(`📅 Comprado em: ${couponPurchase.created_at.toLocaleString('pt-BR')}`);
    console.log(`⏳ Expira em: ${couponPurchase.expires_at.toLocaleString('pt-BR')}`);
    console.log(`⏰ Válido de: ${validFrom ? validFrom.toLocaleString('pt-BR') : 'Sem restrição'}`);
    console.log(`⏰ Válido até: ${validUntil ? validUntil.toLocaleString('pt-BR') : 'Sem restrição'}`);
    console.log(`🔄 Status: ${canUseNow ? '✅ PRONTO PARA USO' : '⏳ AGUARDANDO HORÁRIO'}`);
    
    return {
      couponPurchase,
      discountCoupon,
      canUseNow,
      validFrom,
      validUntil
    };
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateCouponPurchase();