const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLatestWebhookEmail() {
  try {
    console.log('🔍 VERIFICANDO E-MAIL DO ÚLTIMO WEBHOOK...');
    console.log('Payment ID: 130711359336');
    console.log('Timestamp do webhook: 2025-10-21T05:58:35.368Z');
    console.log('');

    // 1. Verificar se o cupom foi criado
    console.log('📋 1. VERIFICANDO CUPOM CRIADO...');
    
    // Primeiro, buscar o payment
    const payment = await prisma.payment.findFirst({
      where: {
        mp_payment_id: '130711359336'
      },
      include: {
        coupon: {
          include: {
            buyer: true
          }
        }
      }
    });

    const coupon = payment?.coupon;

    if (coupon) {
      console.log('✅ Cupom encontrado:');
      console.log(`   - ID: ${coupon.id}`);
      console.log(`   - Código: ${coupon.code}`);
      console.log(`   - Valor: R$ ${(coupon.face_value_cents / 100).toFixed(2)}`);
      console.log(`   - Status: ${coupon.status}`);
      console.log(`   - Criado em: ${coupon.created_at}`);
      console.log(`   - Buyer ID: ${coupon.buyer_id || 'NULL'}`);
      console.log(`   - E-mail do buyer: ${coupon.buyer?.email || 'N/A'}`);
      console.log('');
    } else {
      console.log('❌ Cupom NÃO encontrado!');
      console.log('');
    }

    // 2. Verificar sessões ativas no momento do webhook
    console.log('📋 2. VERIFICANDO SESSÕES ATIVAS...');
    const webhookTime = new Date('2025-10-21T05:58:35.368Z');
    const timeWindow = 5 * 60 * 1000; // 5 minutos antes e depois
    const startTime = new Date(webhookTime.getTime() - timeWindow);
    const endTime = new Date(webhookTime.getTime() + timeWindow);

    const activeSessions = await prisma.session.findMany({
      where: {
        expires: {
          gte: webhookTime
        }
      },
      include: {
        user: true
      }
    });

    console.log(`🔍 Sessões ativas no momento do webhook (±5min):`);
    if (activeSessions.length > 0) {
      activeSessions.forEach((session, index) => {
        console.log(`   ${index + 1}. Usuário: ${session.user.name} (${session.user.email})`);
        console.log(`      - Session ID: ${session.id}`);
        console.log(`      - Expira em: ${session.expires}`);
        console.log('');
      });
    } else {
      console.log('   ❌ Nenhuma sessão ativa encontrada!');
      console.log('');
    }

    // 3. Verificar logs de e-mail (se existir tabela de logs)
    console.log('📋 3. VERIFICANDO LOGS DE E-MAIL...');
    try {
      const emailLogs = await prisma.emailLog.findMany({
        where: {
          createdAt: {
            gte: startTime,
            lte: endTime
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (emailLogs.length > 0) {
        console.log('📧 Logs de e-mail encontrados:');
        emailLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. Para: ${log.to}`);
          console.log(`      - Assunto: ${log.subject}`);
          console.log(`      - Status: ${log.status}`);
          console.log(`      - Enviado em: ${log.createdAt}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️ Nenhum log de e-mail encontrado');
      }
    } catch (error) {
      console.log('   ⚠️ Tabela de logs de e-mail não existe ou erro:', error.message);
    }

    // 4. Verificar se o usuário Vinicius estava logado
    console.log('📋 4. VERIFICANDO USUÁRIO VINICIUS...');
    const vinicius = await prisma.user.findUnique({
      where: {
        email: 'vini_deiro@icloud.com'
      }
    });

    if (vinicius) {
      const viniciusSessions = await prisma.session.findMany({
        where: {
          userId: vinicius.id,
          expires: {
            gte: webhookTime
          }
        }
      });

      console.log(`👤 Usuário Vinicius Deiró:`);
      console.log(`   - ID: ${vinicius.id}`);
      console.log(`   - E-mail: ${vinicius.email}`);
      console.log(`   - Sessões ativas: ${viniciusSessions.length}`);
      
      if (viniciusSessions.length > 0) {
        console.log('   ✅ ESTAVA LOGADO no momento do webhook!');
        viniciusSessions.forEach((session, index) => {
          console.log(`      ${index + 1}. Session: ${session.id}`);
          console.log(`         - Expira: ${session.expires}`);
        });
      } else {
        console.log('   ❌ NÃO estava logado no momento do webhook');
      }
    } else {
      console.log('   ❌ Usuário Vinicius não encontrado!');
    }

    console.log('');
    console.log('📊 RESUMO DA ANÁLISE:');
    console.log('='.repeat(50));
    
    if (coupon) {
      console.log('✅ Cupom foi criado com sucesso');
      if (coupon.buyerId) {
        console.log('✅ Cupom foi associado a um usuário');
        console.log('✅ E-mail provavelmente foi enviado');
      } else {
        console.log('❌ Cupom NÃO foi associado a nenhum usuário');
        console.log('❌ E-mail NÃO foi enviado (usuário não estava logado)');
      }
    } else {
      console.log('❌ Cupom NÃO foi criado');
    }

    if (activeSessions.length > 0) {
      console.log(`✅ Havia ${activeSessions.length} usuário(s) logado(s)`);
    } else {
      console.log('❌ Nenhum usuário estava logado');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar webhook:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestWebhookEmail();