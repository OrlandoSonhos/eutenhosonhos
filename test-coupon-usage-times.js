const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCouponUsageAtDifferentTimes() {
  console.log('⏰ TESTANDO USO DO CUPOM EM DIFERENTES HORÁRIOS');
  console.log('==================================================');
  
  try {
    // Buscar o cupom SPECIAL_50 de R$ 2,03
    const discountCoupon = await prisma.discountCoupon.findFirst({
      where: {
        type: 'SPECIAL_50',
        sale_price_cents: 203,
        is_active: true
      }
    });
    
    if (!discountCoupon) {
      console.log('❌ Cupom SPECIAL_50 não encontrado!');
      return;
    }
    
    console.log('🎫 INFORMAÇÕES DO CUPOM:');
    console.log(`   - Tipo: ${discountCoupon.type}`);
    console.log(`   - Desconto: ${discountCoupon.discount_percent}%`);
    console.log(`   - Preço: R$ ${(discountCoupon.sale_price_cents / 100).toFixed(2)}`);
    
    const validFrom = discountCoupon.valid_from ? new Date(discountCoupon.valid_from) : null;
    const validUntil = discountCoupon.valid_until ? new Date(discountCoupon.valid_until) : null;
    
    console.log(`   - Válido de: ${validFrom ? validFrom.toLocaleString('pt-BR') : 'Sem restrição'}`);
    console.log(`   - Válido até: ${validUntil ? validUntil.toLocaleString('pt-BR') : 'Sem restrição'}`);
    
    // Buscar um cupom comprado para teste
    const couponPurchase = await prisma.discountCouponPurchase.findFirst({
      where: {
        discount_coupon_id: discountCoupon.id,
        is_used: false
      },
      orderBy: { created_at: 'desc' }
    });
    
    if (!couponPurchase) {
      console.log('❌ Nenhum cupom comprado encontrado para teste!');
      return;
    }
    
    console.log(`\n🎫 CUPOM PARA TESTE: ${couponPurchase.code}`);
    
    // Função para testar uso em um horário específico
    function testUsageAtTime(testTime, description) {
      console.log(`\n🕐 ${description}`);
      console.log(`   - Horário de teste: ${testTime.toLocaleString('pt-BR')}`);
      
      const canUse = (!validFrom || testTime >= validFrom) && (!validUntil || testTime <= validUntil);
      
      if (canUse) {
        console.log('   ✅ CUPOM PODE SER USADO NESTE HORÁRIO!');
        
        // Simular aplicação do desconto
        const exemploPreco = 100.00;
        const desconto = (exemploPreco * discountCoupon.discount_percent) / 100;
        const precoFinal = exemploPreco - desconto;
        
        console.log(`   💰 Exemplo de uso:`);
        console.log(`      - Produto: R$ ${exemploPreco.toFixed(2)}`);
        console.log(`      - Desconto (${discountCoupon.discount_percent}%): -R$ ${desconto.toFixed(2)}`);
        console.log(`      - Total: R$ ${precoFinal.toFixed(2)}`);
        console.log(`      - Economia: R$ ${desconto.toFixed(2)}`);
        
      } else {
        console.log('   ❌ CUPOM NÃO PODE SER USADO NESTE HORÁRIO!');
        
        if (validFrom && testTime < validFrom) {
          const tempoRestante = validFrom.getTime() - testTime.getTime();
          const horasRestantes = Math.ceil(tempoRestante / (1000 * 60 * 60));
          console.log(`      - Motivo: Antes do horário de início`);
          console.log(`      - Poderá ser usado em ${horasRestantes} horas`);
        }
        
        if (validUntil && testTime > validUntil) {
          console.log(`      - Motivo: Cupom expirado`);
        }
      }
      
      return canUse;
    }
    
    // Testar diferentes horários
    const now = new Date();
    
    // 1. Horário atual
    testUsageAtTime(now, 'TESTE NO HORÁRIO ATUAL');
    
    // 2. Horário de início (se definido)
    if (validFrom) {
      testUsageAtTime(validFrom, 'TESTE NO HORÁRIO DE INÍCIO');
      
      // 3. 1 hora antes do início
      const oneHourBefore = new Date(validFrom.getTime() - (60 * 60 * 1000));
      testUsageAtTime(oneHourBefore, 'TESTE 1 HORA ANTES DO INÍCIO');
      
      // 4. 1 hora depois do início
      const oneHourAfter = new Date(validFrom.getTime() + (60 * 60 * 1000));
      testUsageAtTime(oneHourAfter, 'TESTE 1 HORA DEPOIS DO INÍCIO');
    }
    
    // 5. Horário de fim (se definido)
    if (validUntil) {
      testUsageAtTime(validUntil, 'TESTE NO HORÁRIO LIMITE');
      
      // 6. 1 hora antes do fim
      const oneHourBeforeEnd = new Date(validUntil.getTime() - (60 * 60 * 1000));
      testUsageAtTime(oneHourBeforeEnd, 'TESTE 1 HORA ANTES DO FIM');
      
      // 7. 1 hora depois do fim
      const oneHourAfterEnd = new Date(validUntil.getTime() + (60 * 60 * 1000));
      testUsageAtTime(oneHourAfterEnd, 'TESTE 1 HORA DEPOIS DO FIM');
    }
    
    // Resumo final
    console.log('\n📋 RESUMO DOS HORÁRIOS:');
    console.log('==================================================');
    
    if (validFrom && validUntil) {
      const duracaoMs = validUntil.getTime() - validFrom.getTime();
      const duracaoHoras = Math.round(duracaoMs / (1000 * 60 * 60));
      
      console.log(`⏰ Janela de uso: ${duracaoHoras} horas`);
      console.log(`📅 De: ${validFrom.toLocaleString('pt-BR')}`);
      console.log(`📅 Até: ${validUntil.toLocaleString('pt-BR')}`);
      
      const agora = new Date();
      if (agora < validFrom) {
        const tempoRestante = validFrom.getTime() - agora.getTime();
        const horasRestantes = Math.ceil(tempoRestante / (1000 * 60 * 60));
        console.log(`⏳ Faltam ${horasRestantes} horas para poder usar`);
      } else if (agora > validUntil) {
        console.log(`❌ Cupom expirado`);
      } else {
        const tempoRestante = validUntil.getTime() - agora.getTime();
        const horasRestantes = Math.floor(tempoRestante / (1000 * 60 * 60));
        console.log(`✅ Cupom ativo! Restam ${horasRestantes} horas para usar`);
      }
    }
    
    console.log(`\n🎫 Seu cupom: ${couponPurchase.code}`);
    console.log(`💰 Desconto garantido: ${discountCoupon.discount_percent}% OFF`);
    console.log(`⏳ Expira em: ${couponPurchase.expires_at.toLocaleString('pt-BR')}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCouponUsageAtDifferentTimes();