require('dotenv').config();

async function debugPayment() {
  const paymentId = '130131909361'; // ID do pagamento do webhook recente
  
  console.log('🔍 DEBUGANDO PAGAMENTO:', paymentId);
  console.log('🌐 Ambiente:', process.env.MP_ACCESS_TOKEN ? 'PRODUÇÃO' : 'SANDBOX');
  
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const payment = await response.json();
    
    console.log('\n📋 DADOS COMPLETOS DO PAGAMENTO:');
    console.log('   ID:', payment.id);
    console.log('   Status:', payment.status);
    console.log('   Valor:', payment.transaction_amount);
    console.log('   External Reference:', payment.external_reference);
    console.log('   Payment Method:', payment.payment_method_id);
    console.log('   Date Created:', payment.date_created);
    
    console.log('\n👤 DADOS DO PAGADOR:');
    if (payment.payer) {
      console.log('   ID:', payment.payer.id || 'N/A');
      console.log('   Email:', payment.payer.email || '❌ NÃO INFORMADO');
      console.log('   First Name:', payment.payer.first_name || 'N/A');
      console.log('   Last Name:', payment.payer.last_name || 'N/A');
      console.log('   Phone:', payment.payer.phone?.number || 'N/A');
      console.log('   Identification:', payment.payer.identification?.number || 'N/A');
      
      if (!payment.payer.email) {
        console.log('\n❌ PROBLEMA IDENTIFICADO: PAGADOR SEM E-MAIL!');
        console.log('   Isso explica por que o sistema não conseguiu enviar o cupom.');
        console.log('   O Mercado Pago não forneceu o e-mail do comprador.');
      } else {
        console.log('\n✅ E-mail do pagador encontrado:', payment.payer.email);
      }
    } else {
      console.log('   ❌ DADOS DO PAGADOR NÃO DISPONÍVEIS');
    }
    
    console.log('\n🏪 MERCHANT ORDER:');
    if (payment.order) {
      console.log('   ID:', payment.order.id);
      console.log('   Type:', payment.order.type);
    } else {
      console.log('   ❌ SEM MERCHANT ORDER ASSOCIADA');
    }
    
    console.log('\n🔍 ANÁLISE:');
    if (payment.status === 'approved') {
      console.log('✅ Pagamento aprovado');
      
      if (payment.external_reference?.startsWith('coupon-')) {
        console.log('✅ É um pagamento de cupom');
        
        if (payment.payer?.email) {
          console.log('✅ Tem e-mail do pagador - deveria funcionar');
        } else {
          console.log('❌ SEM E-MAIL DO PAGADOR - por isso não enviou');
          console.log('\n💡 SOLUÇÕES POSSÍVEIS:');
          console.log('   1. Verificar se há sessão ativa de usuário logado');
          console.log('   2. Criar cupom manualmente e enviar e-mail');
          console.log('   3. Melhorar coleta de e-mail no checkout');
        }
      } else {
        console.log('❌ External reference não é de cupom:', payment.external_reference);
      }
    } else {
      console.log('❌ Pagamento não aprovado:', payment.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar pagamento:', error.message);
    
    if (error.message.includes('404')) {
      console.log('\n🚨 PAGAMENTO NÃO ENCONTRADO!');
      console.log('Isso pode significar que:');
      console.log('1. O ID está incorreto');
      console.log('2. O pagamento é de sandbox, não produção');
      console.log('3. Há um problema com as credenciais do MP');
    }
  }
}

debugPayment();