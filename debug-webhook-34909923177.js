const { MercadoPagoConfig, MerchantOrder } = require('mercadopago');

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const merchantOrder = new MerchantOrder(client);

async function debugWebhook() {
  try {
    console.log('🔍 INVESTIGANDO WEBHOOK 34909923177...\n');
    
    const merchantOrderId = '34909923177';
    
    console.log(`📋 Buscando Merchant Order: ${merchantOrderId}`);
    
    // Buscar o merchant order
    const order = await merchantOrder.get({ merchantOrderId });
    
    console.log('\n✅ MERCHANT ORDER ENCONTRADO:');
    console.log(`🆔 ID: ${order.id}`);
    console.log(`📊 Status: ${order.status}`);
    console.log(`💰 Total: ${order.total_amount}`);
    console.log(`📅 Criado: ${order.date_created}`);
    console.log(`🔄 Atualizado: ${order.last_updated}`);
    
    if (order.payments && order.payments.length > 0) {
      console.log('\n💳 PAGAMENTOS:');
      order.payments.forEach((payment, index) => {
        console.log(`  ${index + 1}. ID: ${payment.id}`);
        console.log(`     Status: ${payment.status}`);
        console.log(`     Valor: ${payment.transaction_amount}`);
      });
    }
    
    if (order.items && order.items.length > 0) {
      console.log('\n🛒 ITENS:');
      order.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
        console.log(`     Quantidade: ${item.quantity}`);
        console.log(`     Preço: ${item.unit_price}`);
      });
    }
    
    // Verificar se tem payer info
    if (order.payer) {
      console.log('\n👤 COMPRADOR:');
      console.log(`📧 E-mail: ${order.payer.email || 'N/A'}`);
      console.log(`🆔 ID: ${order.payer.id || 'N/A'}`);
    }
    
    console.log('\n🔍 ANÁLISE:');
    if (order.status === 'closed') {
      console.log('✅ Status está correto (closed)');
      
      if (order.payments && order.payments.some(p => p.status === 'approved')) {
        console.log('✅ Tem pagamento aprovado');
        
        // Verificar se tem e-mail do comprador
        const buyerEmail = order.payer?.email;
        if (buyerEmail) {
          console.log(`✅ E-mail do comprador: ${buyerEmail}`);
          console.log('\n🎯 TUDO PARECE CORRETO - DEVERIA TER CRIADO O CUPOM!');
          console.log('❌ Possível problema no processamento do webhook em produção');
        } else {
          console.log('❌ PROBLEMA: Não tem e-mail do comprador');
        }
      } else {
        console.log('❌ PROBLEMA: Não tem pagamento aprovado');
      }
    } else {
      console.log(`❌ PROBLEMA: Status não é 'closed', é '${order.status}'`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar Merchant Order:', error.message);
    
    if (error.message.includes('404')) {
      console.log('\n🚨 MERCHANT ORDER NÃO ENCONTRADO!');
      console.log('Isso pode significar que:');
      console.log('1. O ID está incorreto');
      console.log('2. O webhook é de sandbox, não produção');
      console.log('3. Há um problema com as credenciais do MP');
    }
  }
}

debugWebhook();