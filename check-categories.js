const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCategories() {
  try {
    console.log('🔍 Verificando categorias no banco de dados...\n');
    
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📊 Total de categorias: ${categories.length}\n`);
    
    if (categories.length > 0) {
      console.log('📋 Lista de categorias:');
      console.log('========================');
      categories.forEach((category, index) => {
        console.log(`${index + 1}. ID: ${category.id} | Nome: "${category.name}" | Slug: "${category.slug}"`);
      });
    } else {
      console.log('❌ Nenhuma categoria encontrada no banco de dados.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar categorias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();