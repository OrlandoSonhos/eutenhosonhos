const fetch = require('node-fetch');

async function testWebhook154() {
  console.log('🧪 TESTANDO WEBHOOK PARA COMPRA DE 1:54...');
  
  const webhookData = {
    id: 130130094686,
    live_mode: true,
    type: 'payment',
    date_created: '2025-10-21T04:54:09.000Z',
    application_id: '123456789',
    user_id: '123456789',
    version: 1,
    api_version: 'v1',
    action: 'payment.updated',
    data: { id: '130130094686' }
  };

  try {
    console.log('📤 Enviando webhook para:', webhookData.data.id);
    
    const response = await fetch('http://localhost:3000/api/webhook/mp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago/1.0'
      },
      body: JSON.stringify(webhookData)
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      console.log('✅ WEBHOOK PROCESSADO COM SUCESSO!');
      const result = await response.text();
      console.log('📋 Resposta:', result);
    } else {
      console.log('❌ ERRO NO WEBHOOK');
      const error = await response.text();
      console.log('🚨 Erro:', error);
    }
    
  } catch (error) {
    console.error('💥 Erro ao enviar webhook:', error.message);
  }
}

testWebhook154();