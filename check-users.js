const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true
      }
    });
    
    console.log('👥 USUÁRIOS NO BANCO:');
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nome: ${user.name || 'N/A'}`);
        console.log(`   Criado: ${user.created_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();