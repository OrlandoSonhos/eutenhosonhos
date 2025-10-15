require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCategories() {
  try {
    console.log('🔍 Verificando categorias no banco...')
    
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })
    
    console.log(`📊 Total de categorias encontradas: ${categories.length}`)
    
    if (categories.length > 0) {
      console.log('\n📋 Categorias:')
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`)
        if (cat.description) console.log(`   Descrição: ${cat.description}`)
        console.log(`   Produtos: ${cat._count.products}`)
        console.log(`   Criada em: ${cat.created_at}`)
        console.log('')
      })
    } else {
      console.log('❌ Nenhuma categoria encontrada!')
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar categorias:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCategories()