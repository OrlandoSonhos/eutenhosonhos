const fetch = require('node-fetch');

async function testWebhookWithRealData() {
  console.log('🧪 TESTANDO WEBHOOK COM DADOS REALISTAS...\n');

  // Simular dados de webhook real do Mercado Pago
  const webhookData = {
    "id": "1234567890",
    "live_mode": false,
    "type": "payment",
    "date_created": new Date().toISOString(),
    "user_id": "123456789",
    "api_version": "v1",
    "action": "payment.created",
    "data": {
      "id": "1234567890"
    }
  };

  console.log('📤 Enviando dados do webhook:');
  console.log(JSON.stringify(webhookData, null, 2));
  console.log('\n');

  try {
    const response = await fetch('http://localhost:3000/api/webhook/mp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    const result = await response.json();
    
    console.log('📥 Resposta do webhook:');
    console.log('Status:', response.status);
    console.log('Dados:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
  }
}

// Também testar com um ID de pagamento que pode existir
async function testWithTestPayment() {
  console.log('\n🧪 TESTANDO COM PAGAMENTO DE TESTE...\n');

  const webhookData = {
    "id": "test_payment_123",
    "live_mode": false,
    "type": "payment",
    "date_created": new Date().toISOString(),
    "user_id": "123456789",
    "api_version": "v1",
    "action": "payment.created",
    "data": {
      "id": "test_payment_123"
    }
  };

  console.log('📤 Enviando dados do webhook de teste:');
  console.log(JSON.stringify(webhookData, null, 2));
  console.log('\n');

  try {
    const response = await fetch('http://localhost:3000/api/webhook/mp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    const result = await response.json();
    
    console.log('📥 Resposta do webhook de teste:');
    console.log('Status:', response.status);
    console.log('Dados:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
  }
}

async function main() {
  await testWebhookWithRealData();
  await testWithTestPayment();
}

main().catch(console.error);