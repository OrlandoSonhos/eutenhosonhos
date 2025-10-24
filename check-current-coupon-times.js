const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentCouponTimes() {
  console.log('⏰ VERIFICANDO HORÁRIOS ATUAIS DO CUPOM');
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
    
    const now = new Date();
    const validFrom = discountCoupon.valid_from ? new Date(discountCoupon.valid_from) : null;
    const validUntil = discountCoupon.valid_until ? new Date(discountCoupon.valid_until) : null;
    
    console.log('🎫 INFORMAÇÕES DO CUPOM SPECIAL_50:');
    console.log(`   - ID: ${discountCoupon.id}`);
    console.log(`   - Tipo: ${discountCoupon.type}`);
    console.log(`   - Desconto: ${discountCoupon.discount_percent}%`);
    console.log(`   - Preço: R$ ${(discountCoupon.sale_price_cents / 100).toFixed(2)}`);
    console.log(`   - Status: ${discountCoupon.is_active ? 'ATIVO' : 'INATIVO'}`);
    
    console.log('\n⏰ HORÁRIOS DE VALIDADE:');
    console.log(`   - Válido de: ${validFrom ? validFrom.toLocaleString('pt-BR') : '❌ NÃO DEFINIDO'}`);
    console.log(`   - Válido até: ${validUntil ? validUntil.toLocaleString('pt-BR') : '❌ NÃO DEFINIDO'}`);
    
    console.log('\n🕐 STATUS ATUAL:');
    console.log(`   - Horário atual: ${now.toLocaleString('pt-BR')}`);
    
    // Verificar se pode ser usado agora
    const canUseNow = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);
    
    if (canUseNow) {
      console.log('   ✅ CUPOM PODE SER USADO AGORA!');
      console.log(`   🎉 Status: ATIVO E DISPONÍVEL`);
      
      if (validUntil) {
        const tempoRestante = validUntil.getTime() - now.getTime();
        const horasRestantes = Math.floor(tempoRestante / (1000 * 60 * 60));
        const minutosRestantes = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60));
        
        if (horasRestantes > 0) {
          console.log(`   ⏳ Tempo restante: ${horasRestantes}h ${minutosRestantes}min`);
        } else {
          console.log(`   ⏳ Tempo restante: ${minutosRestantes} minutos`);
        }
      } else {
        console.log(`   ⏳ Tempo restante: SEM LIMITE`);
      }
      
    } else {
      console.log('   ❌ CUPOM NÃO PODE SER USADO AGORA!');
      
      if (validFrom && now < validFrom) {
        const tempoRestante = validFrom.getTime() - now.getTime();
        const horasRestantes = Math.ceil(tempoRestante / (1000 * 60 * 60));
        const minutosRestantes = Math.ceil((tempoRestante % (1000 * 60 * 60)) / (1000 * 60));
        
        console.log(`   ⏳ Motivo: Antes do horário de início`);
        if (horasRestantes > 0) {
          console.log(`   ⏳ Poderá ser usado em: ${horasRestantes}h ${minutosRestantes}min`);
        } else {
          console.log(`   ⏳ Poderá ser usado em: ${minutosRestantes} minutos`);
        }
      }
      
      if (validUntil && now > validUntil) {
        console.log(`   ❌ Motivo: Cupom expirado`);
      }
    }
    
    // Calcular duração da janela de uso
    if (validFrom && validUntil) {
      const duracaoMs = validUntil.getTime() - validFrom.getTime();
      const duracaoHoras = Math.round(duracaoMs / (1000 * 60 * 60));
      const duracaoMinutos = Math.round((duracaoMs % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log('\n📊 DURAÇÃO DA JANELA DE USO:');
      if (duracaoHoras > 0) {
        console.log(`   - Total: ${duracaoHoras}h ${duracaoMinutos}min`);
      } else {
        console.log(`   - Total: ${duracaoMinutos} minutos`);
      }
    }
    
    // Buscar cupons comprados para este tipo
    const purchasedCoupons = await prisma.discountCouponPurchase.findMany({
      where: {
        discount_coupon_id: discountCoupon.id,
        is_used: false
      },
      orderBy: { created_at: 'desc' },
      take: 3
    });
    
    if (purchasedCoupons.length > 0) {
      console.log('\n🎫 CUPONS COMPRADOS DISPONÍVEIS:');
      purchasedCoupons.forEach((purchase, index) => {
        console.log(`   ${index + 1}. Código: ${purchase.code}`);
        console.log(`      - Comprado em: ${purchase.created_at.toLocaleString('pt-BR')}`);
        console.log(`      - Expira em: ${purchase.expires_at.toLocaleString('pt-BR')}`);
        console.log(`      - Status: ${canUseNow ? '✅ PRONTO PARA USO' : '⏳ AGUARDANDO HORÁRIO'}`);
      });
    }
    
    // Exemplo de uso
    if (canUseNow) {
      console.log('\n💰 EXEMPLO DE USO AGORA:');
      const exemploPreco = 100.00;
      const desconto = (exemploPreco * discountCoupon.discount_percent) / 100;
      const precoFinal = exemploPreco - desconto;
      
      console.log(`   - Produto: R$ ${exemploPreco.toFixed(2)}`);
      console.log(`   - Desconto (${discountCoupon.discount_percent}%): -R$ ${desconto.toFixed(2)}`);
      console.log(`   - Você paga: R$ ${precoFinal.toFixed(2)}`);
      console.log(`   - Economia: R$ ${desconto.toFixed(2)}`);
    }
    
    console.log('\n==================================================');
    console.log(`🎯 RESUMO: Cupom ${canUseNow ? '✅ ATIVO' : '❌ INATIVO'} - ${discountCoupon.discount_percent}% OFF`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar horários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentCouponTimes();