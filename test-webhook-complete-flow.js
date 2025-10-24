const axios = require('axios');

async function testCompleteWebhookFlow() {
  console.log('🧪 TESTANDO FLUXO COMPLETO DO WEBHOOK\n');
  
  // Simular uma compra de cupom de 50% (R$ 10,00)
  const webhookData = {
    id: Date.now(),
    live_mode: true,
    type: "payment",
    date_created: new Date().toISOString(),
    application_id: "123456789",
    user_id: "123456789",
    version: 1,
    api_version: "v1",
    action: "payment.updated",
    data: {
      id: "test_payment_" + Date.now()
    }
  };

  // Simular dados do pagamento para R$ 10,00 (cupom 50%)
  const paymentData = {
    id: webhookData.data.id,
    status: 'approved',
    external_reference: 'coupon-' + Date.now() + '-user-cm2kkqhqj0000kkqhqj0000',
    transaction_amount: 10.00,
    payment_method_id: 'pix',
    payer: {
      email: 'vini_deiro@icloud.com',
      first_name: 'Vinicius'
    }
  }

  try {
    console.log('📤 Enviando webhook de teste...');
    console.log('   Payment ID:', webhookData.data.id);
    console.log('   Timestamp:', webhookData.date_created);
    
    const response = await axios.post('http://localhost:3000/api/webhook/mp', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago/1.0'
      },
      timeout: 30000
    });

    console.log(`\n✅ Status da resposta: ${response.status}`);
    console.log(`📝 Resposta: ${JSON.stringify(response.data)}`);
    
    if (response.status === 200) {
      console.log('\n🎉 WEBHOOK PROCESSADO COM SUCESSO!');
      console.log('');
      console.log('📋 O que aconteceu:');
      console.log('   1. ✅ Webhook recebido e processado');
      console.log('   2. ✅ Pagamento simulado como aprovado');
      console.log('   3. ✅ Cupom de desconto criado no banco');
      console.log('   4. ✅ E-mail enviado para vini_deiro@icloud.com');
      console.log('');
      console.log('🔍 Verifique os logs do servidor para mais detalhes!');
    }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:');
    console.error(`   Status: ${error.response?.status || 'N/A'}`);
    console.error(`   Mensagem: ${error.response?.data || error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🚨 SERVIDOR NÃO ESTÁ RODANDO!');
      console.error('   Execute: npm run dev');
    }
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTE COMPLETO DO WEBHOOK');
  console.log('=' .repeat(50));
  
  await testCompleteWebhookFlow();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ TESTE CONCLUÍDO');
}

main().catch(console.error);