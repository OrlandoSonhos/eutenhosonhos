const axios = require('axios');

async function testMerchantOrderWebhook() {
  console.log('🧪 TESTANDO WEBHOOK MERCHANT ORDER 34909923177\n');
  
  // Simular o webhook exato que você recebeu
  const webhookData = {
    id: 999999999,
    live_mode: true,
    type: "merchant_order",
    date_created: "2025-01-21T05:20:53.000-04:00",
    application_id: "123456789",
    user_id: "123456789",
    version: 1,
    api_version: "v1",
    action: "update",
    data: {
      id: "34909923177"
    }
  };

  try {
    console.log('📤 Enviando webhook merchant_order para localhost...');
    console.log('📋 Dados:', JSON.stringify(webhookData, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/webhook/mp', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago/1.0',
        'x-signature': 'test-signature',
        'x-request-id': 'test-request-id'
      },
      timeout: 30000
    });

    console.log(`\n✅ Status: ${response.status}`);
    console.log(`📝 Resposta:`, response.data);
    
  } catch (error) {
    if (error.response) {
      console.error(`❌ Erro HTTP: ${error.response.status}`);
      console.error(`📝 Resposta:`, error.response.data);
    } else {
      console.error(`❌ Erro: ${error.message}`);
    }
  }
}

async function main() {
  await testMerchantOrderWebhook();
}

main().catch(console.error);