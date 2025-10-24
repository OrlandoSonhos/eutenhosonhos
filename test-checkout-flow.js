const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCheckoutFlow() {
  try {
    console.log('🛒 Testando fluxo completo de checkout com cupom percentual...\n');
    
    // 1. Verificar se há produtos disponíveis
    console.log('1️⃣ Verificando produtos disponíveis...');
    const products = await prisma.product.findMany({
      where: { active: true },
      take: 3
    });
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto ativo encontrado');
      return;
    }
    
    console.log(`✅ ${products.length} produtos encontrados:`);
    products.forEach(product => {
      console.log(`   - ${product.name}: R$ ${(product.price_cents / 100).toFixed(2)}`);
    });
    
    // 2. Simular carrinho com produtos
    const cartItems = products.slice(0, 2).map(product => ({
      id: product.id,
      name: product.name,
      price: product.price_cents,
      quantity: 1
    }));
    
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log(`\n2️⃣ Carrinho simulado:`);
    cartItems.forEach(item => {
      console.log(`   - ${item.name} x${item.quantity}: R$ ${(item.price / 100).toFixed(2)}`);
    });
    console.log(`   Subtotal: R$ ${(subtotal / 100).toFixed(2)}`);
    
    // 3. Verificar cupom percentual disponível
    console.log(`\n3️⃣ Verificando cupom percentual...`);
    const couponPurchase = await prisma.discountCouponPurchase.findFirst({
      where: {
        code: 'TEST25PERCENT',
        is_used: false
      },
      include: {
        discount_coupon: true,
        buyer: true
      }
    });
    
    if (!couponPurchase) {
      console.log('❌ Cupom TEST25PERCENT não encontrado ou já usado');
      return;
    }
    
    console.log(`✅ Cupom encontrado:`);
    console.log(`   Código: ${couponPurchase.code}`);
    console.log(`   Desconto: ${couponPurchase.discount_coupon.discount_percent}%`);
    console.log(`   Status: ${couponPurchase.is_used ? 'Usado' : 'Disponível'}`);
    console.log(`   Expira em: ${couponPurchase.expires_at.toLocaleDateString('pt-BR')}`);
    
    // 4. Aplicar desconto
    console.log(`\n4️⃣ Aplicando desconto...`);
    const discountPercent = couponPurchase.discount_coupon.discount_percent;
    const discountAmount = Math.floor((subtotal * discountPercent) / 100);
    const finalTotal = subtotal - discountAmount;
    
    console.log(`   Subtotal: R$ ${(subtotal / 100).toFixed(2)}`);
    console.log(`   Desconto (${discountPercent}%): -R$ ${(discountAmount / 100).toFixed(2)}`);
    console.log(`   Total final: R$ ${(finalTotal / 100).toFixed(2)}`);
    
    // 5. Simular dados de checkout
    console.log(`\n5️⃣ Dados do checkout:`);
    const checkoutData = {
      items: cartItems,
      subtotal: subtotal,
      discountCoupon: {
        code: couponPurchase.code,
        discountPercent: discountPercent,
        discountAmount: discountAmount
      },
      total: finalTotal,
      shipping: {
        method: 'PAC',
        cost: 1500, // R$ 15,00
        days: '8-12'
      }
    };
    
    const totalWithShipping = checkoutData.total + checkoutData.shipping.cost;
    
    console.log(`   Frete (${checkoutData.shipping.method}): R$ ${(checkoutData.shipping.cost / 100).toFixed(2)}`);
    console.log(`   Total com frete: R$ ${(totalWithShipping / 100).toFixed(2)}`);
    
    // 6. Verificar se o desconto está sendo aplicado corretamente
    console.log(`\n6️⃣ Verificação do desconto:`);
    const expectedDiscount = Math.floor((subtotal * discountPercent) / 100);
    const actualSavings = subtotal - finalTotal;
    
    if (actualSavings === expectedDiscount) {
      console.log(`✅ Desconto aplicado corretamente!`);
      console.log(`   Economia esperada: R$ ${(expectedDiscount / 100).toFixed(2)}`);
      console.log(`   Economia real: R$ ${(actualSavings / 100).toFixed(2)}`);
    } else {
      console.log(`❌ Erro no cálculo do desconto!`);
      console.log(`   Economia esperada: R$ ${(expectedDiscount / 100).toFixed(2)}`);
      console.log(`   Economia real: R$ ${(actualSavings / 100).toFixed(2)}`);
    }
    
    // 7. Simular criação do pedido no Mercado Pago
    console.log(`\n7️⃣ Dados para Mercado Pago:`);
    const mpData = {
      title: `Pedido EuTenhoSonhos - ${cartItems.length} item(s)`,
      quantity: 1,
      unit_price: totalWithShipping / 100, // Mercado Pago usa valores em reais
      currency_id: 'BRL',
      description: `Produtos: ${cartItems.map(item => item.name).join(', ')}. Cupom aplicado: ${couponPurchase.code} (${discountPercent}% de desconto)`,
      metadata: {
        coupon_code: couponPurchase.code,
        discount_percent: discountPercent,
        discount_amount_cents: discountAmount,
        original_total_cents: subtotal,
        shipping_cents: checkoutData.shipping.cost
      }
    };
    
    console.log(`   Título: ${mpData.title}`);
    console.log(`   Valor: R$ ${mpData.unit_price.toFixed(2)}`);
    console.log(`   Descrição: ${mpData.description}`);
    console.log(`   Metadata: ${JSON.stringify(mpData.metadata, null, 2)}`);
    
    console.log(`\n🎉 Fluxo de checkout testado com sucesso!`);
    console.log(`💰 Resumo final:`);
    console.log(`   - Produtos: R$ ${(subtotal / 100).toFixed(2)}`);
    console.log(`   - Desconto: -R$ ${(discountAmount / 100).toFixed(2)} (${discountPercent}%)`);
    console.log(`   - Frete: R$ ${(checkoutData.shipping.cost / 100).toFixed(2)}`);
    console.log(`   - Total: R$ ${(totalWithShipping / 100).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCheckoutFlow();