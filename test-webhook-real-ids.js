const axios = require('axios');

// IDs de pagamento reais encontrados na API do Mercado Pago
const realPaymentIds = [
  '130020978615', // cupom aprovado
  '130599459968', // cupom aprovado  
  '130600758514', // cupom aprovado
  '130692686240', // pagamento de R$ 87.15
  '130126018143', // cupom aprovado
  '130126425545', // cupom aprovado
  '130129026961'  // cupom aprovado
];

async function testWebhookWithRealId(paymentId) {
  console.log(`\n🧪 TESTANDO WEBHOOK COM ID REAL: ${paymentId}`);
  
  const webhookData = {
    id: parseInt(paymentId),
    live_mode: true,
    type: "payment",
    date_created: new Date().toISOString(),
    application_id: "123456789",
    user_id: "123456789",
    version: 1,
    api_version: "v1",
    action: "payment.updated",
    data: {
      id: paymentId
    }
  };

  try {
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
  console.log('🚀 TESTANDO WEBHOOK COM IDs REAIS DO MERCADO PAGO\n');
  
  // Testar com alguns IDs reais
  await testWebhookWithRealId(realPaymentIds[0]); // Primeiro cupom
  await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
  
  await testWebhookWithRealId(realPaymentIds[3]); // Pagamento de R$ 87.15
  await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
  
  await testWebhookWithRealId(realPaymentIds[4]); // Outro cupom
}

main().catch(console.error);