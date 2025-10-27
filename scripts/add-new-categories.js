require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addNewCategories() {
  try {
    console.log('🔄 Adicionando novas categorias...')
    
    // Categoria 'Oferta do Dia'
    const ofertaDia = await prisma.category.upsert({
      where: { name: 'Oferta do Dia' },
      update: {},
      create: {
        name: 'Oferta do Dia',
        description: 'Produtos em oferta especial do dia com descontos exclusivos'
      }
    })
    
    console.log('✅ Categoria "Oferta do Dia" criada/atualizada:', ofertaDia.id)
    
    // Categoria 'Produtos de Leilão'
    const produtosLeilao = await prisma.category.upsert({
      where: { name: 'Produtos de Leilão' },
      update: {},
      create: {
        name: 'Produtos de Leilão',
        description: 'Produtos disponíveis em leilões com descontos especiais'
      }
    })
    
    console.log('✅ Categoria "Produtos de Leilão" criada/atualizada:', produtosLeilao.id)
    
    // Verificar todas as categorias
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    })
    
    console.log('\n📋 Todas as categorias no banco:')
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`)
      console.log(`   Descrição: ${cat.description}`)
      console.log('')
    })
    
    console.log('🎉 Processo concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao adicionar categorias:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addNewCategories()