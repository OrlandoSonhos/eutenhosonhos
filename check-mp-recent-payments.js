const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: {
    timeout: 5000
  }
});

const payment = new Payment(client);

async function checkRecentPayments() {
  console.log('🔍 VERIFICANDO PAGAMENTOS RECENTES NO MERCADO PAGO...\n');
  
  try {
    // Buscar pagamentos recentes (últimas 24 horas)
    const searchParams = {
      begin_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date().toISOString(),
      limit: 50
    };

    console.log('📅 Buscando pagamentos de:', searchParams.begin_date);
    console.log('📅 Até:', searchParams.end_date);
    console.log('🔑 Token:', process.env.MP_ACCESS_TOKEN?.substring(0, 20) + '...\n');

    const response = await payment.search({
      options: searchParams
    });

    console.log('📊 Total de pagamentos encontrados:', response.results?.length || 0);
    
    if (response.results && response.results.length > 0) {
      console.log('\n💳 PAGAMENTOS RECENTES:');
      response.results.forEach((pay, index) => {
        console.log(`\n${index + 1}. ID: ${pay.id}`);
        console.log(`   Status: ${pay.status}`);
        console.log(`   Valor: R$ ${pay.transaction_amount}`);
        console.log(`   Email: ${pay.payer?.email || 'N/A'}`);
        console.log(`   External Reference: ${pay.external_reference || 'N/A'}`);
        console.log(`   Método: ${pay.payment_method_id}`);
        console.log(`   Criado: ${new Date(pay.date_created).toLocaleString('pt-BR')}`);
        
        // Verificar se é relacionado ao nosso usuário
        if (pay.payer?.email === 'vini_deiro@icloud.com') {
          console.log('   🎯 ESTE É DO NOSSO USUÁRIO!');
        }
        
        // Verificar se tem external_reference de cupom
        if (pay.external_reference?.startsWith('coupon-')) {
          console.log('   🎫 ESTE É UM CUPOM!');
        }
      });
    } else {
      console.log('\n❌ Nenhum pagamento encontrado nas últimas 24 horas');
    }

  } catch (error) {
    console.error('❌ Erro ao buscar pagamentos:', error);
    
    if (error.status === 401) {
      console.error('🔐 ERRO DE AUTENTICAÇÃO - Verifique o token de acesso');
    } else if (error.status === 403) {
      console.error('🚫 ERRO DE PERMISSÃO - Token não tem permissão para esta operação');
    } else if (error.status === 404) {
      console.error('🔍 ENDPOINT NÃO ENCONTRADO');
    }
  }
}

// Também testar busca de um pagamento específico se fornecido
async function testSpecificPayment(paymentId) {
  if (!paymentId) return;
  
  console.log(`\n🔍 TESTANDO PAGAMENTO ESPECÍFICO: ${paymentId}`);
  
  try {
    const response = await payment.get({ id: paymentId });
    console.log('✅ Pagamento encontrado:');
    console.log('   ID:', response.id);
    console.log('   Status:', response.status);
    console.log('   Valor:', response.transaction_amount);
    console.log('   Email:', response.payer?.email);
    console.log('   External Reference:', response.external_reference);
  } catch (error) {
    console.error('❌ Erro ao buscar pagamento específico:', error.message);
  }
}

async function main() {
  await checkRecentPayments();
  
  // Se você tiver um ID específico para testar, descomente a linha abaixo
  // await testSpecificPayment('SEU_PAYMENT_ID_AQUI');
}

main().catch(console.error);