const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Novas categorias em ordem alfabética
const newCategories = [
  'Auto peça',
  'Bebidas',
  'Diversos',
  'Eletrica',
  'Eletrodomésticos',
  'Eletrônico',
  'Hidráulica',
  'Imagens e som',
  'Material de construção',
  'Móveis',
  'Oferta do dia',
  'Oportunidade',
  'Perfume e beleza'
];

// Função removida pois o modelo Category não tem campo slug

async function replaceCategories() {
  try {
    console.log('🗑️  Apagando todas as categorias existentes...\n');
    
    // Primeiro, apagar todas as categorias existentes
    const deleteResult = await prisma.category.deleteMany({});
    console.log(`✅ ${deleteResult.count} categorias antigas foram removidas.\n`);
    
    console.log('📝 Criando novas categorias em ordem alfabética...\n');
    
    // Criar as novas categorias
    const createdCategories = [];
    for (const categoryName of newCategories) {
      const category = await prisma.category.create({
        data: {
          name: categoryName
        }
      });
      createdCategories.push(category);
      console.log(`✅ Criada: "${categoryName}"`);
    }
    
    console.log(`\n🎉 Processo concluído! ${createdCategories.length} novas categorias foram criadas.\n`);
    
    console.log('📋 Lista final das categorias:');
    console.log('===============================');
    createdCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao substituir categorias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

replaceCategories();