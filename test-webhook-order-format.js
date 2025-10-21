const axios = require('axios');

async function testWebhookWithCorrectOrderFormat() {
  console.log('🧪 TESTANDO WEBHOOK COM FORMATO CORRETO DE PEDIDO\n');
  
  // Simular um pagamento com external_reference no formato correto
  const webhookData = {
    id: 999999999,
    live_mode: true,
    type: "payment",
    date_created: new Date().toISOString(),
    application_id: "123456789",
    user_id: "123456789",
    version: 1,
    api_version: "v1",
    action: "payment.updated",
    data: {
      id: "test_order_payment_123"
    }
  };

  try {
    console.log('📤 Enviando webhook com ID de teste para pedido...');
    const response = await axios.post('http://localhost:3000/api/webhook/mp', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago/1.0'
      },
      timeout: 30000
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`📝 Resposta: ${response.data}`);
    
  } catch (error) {
    console.error(`❌ Erro: ${error.response?.status} - ${error.response?.data || error.message}`);
  }
}

async function main() {
  await testWebhookWithCorrectOrderFormat();
}

main().catch(console.error);