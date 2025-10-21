require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserEmail() {
  const paymentId = '130131909361';
  const testEmail = 'XXXXXXXXXXX'; // E-mail mascarado do debug anterior
  
  console.log('🔍 DEBUGANDO USUÁRIO POR E-MAIL');
  console.log('Payment ID:', paymentId);
  
  try {
    // Primeiro, buscar o pagamento no MP para pegar o e-mail real
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const payment = await response.json();
    const payerEmail = payment.payer?.email;
    
    console.log('\n📧 E-MAIL DO PAGADOR:', payerEmail || 'NÃO ENCONTRADO');
    
    if (!payerEmail) {
      console.log('❌ Sem e-mail do pagador - problema identificado!');
      return;
    }
    
    // Buscar usuário no banco
    console.log('\n🔍 BUSCANDO USUÁRIO NO BANCO...');
    const user = await prisma.user.findUnique({
      where: { email: payerEmail }
    });
    
    if (user) {
      console.log('✅ USUÁRIO ENCONTRADO NO BANCO:');
      console.log('   ID:', user.id);
      console.log('   Nome:', user.name || 'N/A');
      console.log('   E-mail:', user.email);
      console.log('   Criado em:', user.createdAt);
      console.log('   Atualizado em:', user.updatedAt);
    } else {
      console.log('❌ USUÁRIO NÃO ENCONTRADO NO BANCO!');
      console.log('   E-mail procurado:', payerEmail);
      console.log('\n💡 ISSO EXPLICA O PROBLEMA!');
      console.log('   O sistema não conseguiu encontrar o usuário porque:');
      console.log('   1. O e-mail do pagador não está cadastrado no sistema');
      console.log('   2. O comprador fez o pagamento sem estar logado');
      console.log('   3. O e-mail pode ter diferenças de maiúscula/minúscula');
    }
    
    // Verificar sessões ativas como fallback
    console.log('\n🔍 VERIFICANDO SESSÕES ATIVAS (FALLBACK)...');
    const activeSession = await prisma.session.findFirst({
      where: {
        expires: {
          gt: new Date()
        }
      },
      orderBy: {
        expires: 'desc'
      },
      include: {
        user: true
      }
    });
    
    if (activeSession?.user) {
      console.log('✅ SESSÃO ATIVA ENCONTRADA:');
      console.log('   Usuário ID:', activeSession.user.id);
      console.log('   Nome:', activeSession.user.name);
      console.log('   E-mail:', activeSession.user.email);
      console.log('   Sessão expira em:', activeSession.expires);
      
      if (activeSession.user.email === payerEmail) {
        console.log('✅ E-mail da sessão COINCIDE com pagador!');
      } else {
        console.log('⚠️ E-mail da sessão DIFERENTE do pagador');
        console.log('   Sessão:', activeSession.user.email);
        console.log('   Pagador:', payerEmail);
      }
    } else {
      console.log('❌ NENHUMA SESSÃO ATIVA ENCONTRADA');
      console.log('   Isso significa que não há usuário logado recentemente');
    }
    
    // Buscar todos os usuários para debug
    console.log('\n📊 ESTATÍSTICAS DO BANCO:');
    const totalUsers = await prisma.user.count();
    const totalSessions = await prisma.session.count();
    const activeSessions = await prisma.session.count({
      where: {
        expires: {
          gt: new Date()
        }
      }
    });
    
    console.log('   Total de usuários:', totalUsers);
    console.log('   Total de sessões:', totalSessions);
    console.log('   Sessões ativas:', activeSessions);
    
    if (totalUsers > 0) {
      console.log('\n📋 ÚLTIMOS 5 USUÁRIOS CADASTRADOS:');
      const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true
        }
      });
      
      recentUsers.forEach((u, i) => {
        console.log(`   ${i+1}. ${u.email} (${u.name || 'Sem nome'}) - ${u.createdAt.toISOString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserEmail();