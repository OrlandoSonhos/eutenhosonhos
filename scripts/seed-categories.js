require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedCategories() {
  try {
    console.log('Inserindo categorias de teste...')
    
    const categories = [
      { name: 'Eletrônicos', description: 'Produtos eletrônicos em geral' },
      { name: 'Roupas', description: 'Vestuário e acessórios' },
      { name: 'Casa e Jardim', description: 'Produtos para casa e jardim' },
      { name: 'Esportes', description: 'Artigos esportivos' },
      { name: 'Livros', description: 'Livros e materiais educativos' }
    ]

    for (const category of categories) {
      const existing = await prisma.category.findFirst({
        where: { name: category.name }
      })

      if (!existing) {
        await prisma.category.create({
          data: category
        })
        console.log(`Categoria "${category.name}" criada`)
      } else {
        console.log(`Categoria "${category.name}" já existe`)
      }
    }

    console.log('Seed de categorias concluído!')
  } catch (error) {
    console.error('Erro ao inserir categorias:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCategories()