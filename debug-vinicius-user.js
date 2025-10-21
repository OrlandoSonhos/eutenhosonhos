require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugViniciusUser() {
  const viniciusEmail = 'vini_deiro@icloud.com';
  const paymentId = '130131909361';
  const webhookTime = new Date('2025-10-21T01:44:31.000-04:00'); // Horário do webhook
  
  console.log('🔍 INVESTIGANDO USUÁRIO VINICIUS DEIRÓ');
  console.log('E-mail:', viniciusEmail);
  console.log('Webhook em:', webhookTime.toISOString());
  
  try {
    // 1. Verificar se o usuário existe
    console.log('\n👤 VERIFICANDO USUÁRIO NO BANCO...');
    const user = await prisma.user.findUnique({
      where: { email: viniciusEmail }
    });
    
    if (user) {
      console.log('✅ USUÁRIO ENCONTRADO:');
      console.log('   ID:', user.id);
      console.log('   Nome:', user.name);
      console.log('   E-mail:', user.email);
      console.log('   Criado em:', user.created_at);
      console.log('   Atualizado em:', user.updated_at);
      console.log('   Role:', user.role);
    } else {
      console.log('❌ USUÁRIO NÃO ENCONTRADO!');
      console.log('   E-mail procurado:', viniciusEmail);
      return;
    }
    
    // 2. Verificar sessões do usuário
    console.log('\n🔐 VERIFICANDO SESSÕES DO USUÁRIO...');
    const allSessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { expires: 'desc' }
    });
    
    console.log(`📊 Total de sessões: ${allSessions.length}`);
    
    if (allSessions.length > 0) {
      console.log('\n📋 ÚLTIMAS 5 SESSÕES:');
      allSessions.slice(0, 5).forEach((session, i) => {
        const isActive = session.expires > new Date();
        const wasActiveAtWebhook = session.expires > webhookTime;
        console.log(`   ${i+1}. Token: ${session.sessionToken.substring(0, 20)}...`);
        console.log(`      Expira: ${session.expires.toISOString()}`);
        console.log(`      Status atual: ${isActive ? '✅ ATIVA' : '❌ EXPIRADA'}`);
        console.log(`      No momento do webhook: ${wasActiveAtWebhook ? '✅ ATIVA' : '❌ EXPIRADA'}`);
        console.log('');
      });
      
      // Verificar se havia sessão ativa no momento do webhook
      const activeAtWebhook = allSessions.filter(s => s.expires > webhookTime);
      console.log(`🎯 SESSÕES ATIVAS NO MOMENTO DO WEBHOOK: ${activeAtWebhook.length}`);
      
      if (activeAtWebhook.length > 0) {
        console.log('✅ VOCÊ ESTAVA LOGADO NO MOMENTO DO WEBHOOK!');
        activeAtWebhook.forEach((session, i) => {
          console.log(`   ${i+1}. Expira: ${session.expires.toISOString()}`);
        });
      } else {
        console.log('❌ NENHUMA SESSÃO ATIVA NO MOMENTO DO WEBHOOK');
      }
    } else {
      console.log('❌ NENHUMA SESSÃO ENCONTRADA PARA O USUÁRIO');
    }
    
    // 3. Verificar dados do pagamento MP
    console.log('\n💳 VERIFICANDO DADOS DO PAGAMENTO MP...');
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const payment = await response.json();
    const payerEmail = payment.payer?.email;
    
    console.log('E-mail do pagador MP:', payerEmail);
    console.log('E-mail do usuário logado:', viniciusEmail);
    console.log('E-mails coincidem?', payerEmail === viniciusEmail ? '✅ SIM' : '❌ NÃO');
    
    // 4. Verificar cupom criado
    console.log('\n🎫 VERIFICANDO CUPOM CRIADO...');
    const coupon = await prisma.coupon.findUnique({
      where: { code: 'LR8OVFBV' }
    });
    
    if (coupon) {
      console.log('✅ CUPOM ENCONTRADO:');
      console.log('   Código:', coupon.code);
      console.log('   Comprador ID:', coupon.buyer_id || 'NÃO ASSOCIADO');
      console.log('   Status:', coupon.status);
      console.log('   Criado em:', coupon.created_at);
      
      if (coupon.buyer_id === user.id) {
        console.log('✅ CUPOM ASSOCIADO AO SEU USUÁRIO');
      } else if (coupon.buyer_id) {
        console.log('❌ CUPOM ASSOCIADO A OUTRO USUÁRIO:', coupon.buyer_id);
      } else {
        console.log('⚠️ CUPOM NÃO ASSOCIADO A NENHUM USUÁRIO');
      }
    } else {
      console.log('❌ CUPOM NÃO ENCONTRADO');
    }
    
    // 5. Análise do problema
    console.log('\n🔍 ANÁLISE DO PROBLEMA:');
    
    if (payerEmail !== viniciusEmail) {
      console.log('❌ PROBLEMA 1: E-mail do pagador MP diferente do seu e-mail');
      console.log(`   MP: ${payerEmail}`);
      console.log(`   Seu: ${viniciusEmail}`);
      console.log('   Isso explica por que não encontrou pelo e-mail do pagador');
    } else {
      console.log('✅ E-mail do pagador MP coincide com o seu');
    }
    
    const activeAtWebhook = allSessions.filter(s => s.expires > webhookTime);
    if (activeAtWebhook.length === 0) {
      console.log('❌ PROBLEMA 2: Nenhuma sessão ativa no momento do webhook');
      console.log('   Isso explica por que não encontrou por sessão ativa');
    } else {
      console.log('✅ Havia sessão ativa no momento do webhook');
    }
    
    console.log('\n💡 CONCLUSÃO:');
    if (payerEmail !== viniciusEmail && activeAtWebhook.length === 0) {
      console.log('❌ DUPLO PROBLEMA: E-mail diferente E sem sessão ativa');
    } else if (payerEmail !== viniciusEmail) {
      console.log('⚠️ E-mail diferente, mas deveria ter encontrado por sessão ativa');
      console.log('   Possível bug na lógica de busca por sessão');
    } else if (activeAtWebhook.length === 0) {
      console.log('⚠️ E-mail correto, mas sem sessão ativa');
      console.log('   Deveria ter encontrado pelo e-mail do pagador');
    } else {
      console.log('🤔 E-mail correto E sessão ativa - bug na lógica!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugViniciusUser();