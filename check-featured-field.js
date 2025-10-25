const { PrismaClient } = require('@prisma/client')

async function checkFeaturedField() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando se o campo "featured" existe no banco de dados...')
    
    // Tenta buscar produtos com o campo featured
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        featured: true
      },
      take: 1
    })
    
    console.log('✅ Campo "featured" existe no banco de dados!')
    console.log('📊 Exemplo de produto:', products[0] || 'Nenhum produto encontrado')
    
    // Verifica quantos produtos estão marcados como featured
    const featuredCount = await prisma.product.count({
      where: { featured: true }
    })
    
    console.log(`📈 Produtos marcados como destaque: ${featuredCount}`)
    
  } catch (error) {
    if (error.message.includes('featured')) {
      console.log('❌ Campo "featured" NÃO existe no banco de dados!')
      console.log('💡 É necessário executar uma migração para adicionar o campo.')
    } else {
      console.log('❌ Erro ao verificar banco:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkFeaturedField()