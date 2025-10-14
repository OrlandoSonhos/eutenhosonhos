import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar super admin
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'eutenhosonhos5@gmail.com'
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Eutenhosonhos2025#'
  
  const hashedPassword = await bcrypt.hash(superAdminPassword, 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      name: 'Super Admin',
      email: superAdminEmail,
      password_hash: hashedPassword,
      role: 'ADMIN'
    }
  })

  console.log('✅ Super admin criado:', superAdmin.email)

  // Criar usuários de exemplo
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'joao@exemplo.com' },
      update: {},
      create: {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        password_hash: await bcrypt.hash('123456', 12),
        role: 'USER'
      }
    }),
    prisma.user.upsert({
      where: { email: 'maria@exemplo.com' },
      update: {},
      create: {
        name: 'Maria Santos',
        email: 'maria@exemplo.com',
        password_hash: await bcrypt.hash('123456', 12),
        role: 'USER'
      }
    }),
    prisma.user.upsert({
      where: { email: 'pedro@exemplo.com' },
      update: {},
      create: {
        name: 'Pedro Costa',
        email: 'pedro@exemplo.com',
        password_hash: await bcrypt.hash('123456', 12),
        role: 'USER'
      }
    })
  ])

  console.log('✅ Usuários de exemplo criados')

  // Criar categorias de exemplo
  const categories = [
    {
      name: 'Roupas',
      description: 'Vestuário em geral'
    },
    {
      name: 'Calçados',
      description: 'Sapatos, tênis e sandálias'
    },
    {
      name: 'Acessórios',
      description: 'Bolsas, relógios e óculos'
    },
    {
      name: 'Perfumaria',
      description: 'Perfumes e cosméticos'
    }
  ]

  // Verificar se já existem categorias
  const existingCategories = await prisma.category.count()
  let createdCategories: any[] = []
  
  if (existingCategories === 0) {
    for (const category of categories) {
      const created = await prisma.category.create({
        data: category
      })
      createdCategories.push(created)
    }
  } else {
    createdCategories = await prisma.category.findMany()
  }

  console.log('✅ Categorias de exemplo criadas')

  // Criar produtos de exemplo
  const products = [
    {
      title: 'Camiseta Básica',
      description: 'Camiseta 100% algodão, confortável e durável',
      price_cents: 4999, // R$ 49,99
      stock: 50,
      images: JSON.stringify(['/images/camiseta-basica.jpg']),
      category_id: createdCategories[0]?.id // Roupas
    },
    {
      title: 'Calça Jeans',
      description: 'Calça jeans clássica, corte reto',
      price_cents: 12999, // R$ 129,99
      stock: 30,
      images: JSON.stringify(['/images/calca-jeans.jpg']),
      category_id: createdCategories[0]?.id // Roupas
    },
    {
      title: 'Tênis Esportivo',
      description: 'Tênis confortável para atividades físicas',
      price_cents: 19999, // R$ 199,99
      stock: 25,
      images: JSON.stringify(['/images/tenis-esportivo.jpg']),
      category_id: createdCategories[1]?.id // Calçados
    },
    {
      title: 'Jaqueta de Couro',
      description: 'Jaqueta de couro sintético, estilo moderno',
      price_cents: 24999, // R$ 249,99
      stock: 15,
      images: JSON.stringify(['/images/jaqueta-couro.jpg']),
      category_id: createdCategories[0]?.id // Roupas
    },
    {
      title: 'Vestido Floral',
      description: 'Vestido leve com estampa floral',
      price_cents: 8999, // R$ 89,99
      stock: 40,
      images: JSON.stringify(['/images/vestido-floral.jpg']),
      category_id: createdCategories[0]?.id // Roupas
    },
    {
      title: 'Relógio Digital',
      description: 'Relógio digital resistente à água',
      price_cents: 15999, // R$ 159,99
      stock: 20,
      images: JSON.stringify(['/images/relogio-digital.jpg']),
      category_id: createdCategories[2]?.id // Acessórios
    },
    {
      title: 'Mochila Escolar',
      description: 'Mochila resistente com vários compartimentos',
      price_cents: 7999, // R$ 79,99
      stock: 35,
      images: JSON.stringify(['/images/mochila-escolar.jpg']),
      category_id: createdCategories[2]?.id // Acessórios
    },
    {
      title: 'Óculos de Sol',
      description: 'Óculos de sol com proteção UV',
      price_cents: 12999, // R$ 129,99
      stock: 45,
      images: JSON.stringify(['/images/oculos-sol.jpg']),
      category_id: createdCategories[2]?.id // Acessórios
    },
    {
      title: 'Perfume Masculino',
      description: 'Perfume masculino com fragrância marcante',
      price_cents: 18999, // R$ 189,99
      stock: 30,
      images: JSON.stringify(['/images/perfume-masculino.jpg']),
      category_id: createdCategories[3]?.id // Perfumaria
    },
    {
      title: 'Bolsa Feminina',
      description: 'Bolsa elegante para o dia a dia',
      price_cents: 16999, // R$ 169,99
      stock: 25,
      images: JSON.stringify(['/images/bolsa-feminina.jpg']),
      category_id: createdCategories[2]?.id // Acessórios
    }
  ]

  // Verificar se já existem produtos
  const existingProducts = await prisma.product.count()
  
  if (existingProducts === 0) {
    for (const product of products) {
      await prisma.product.create({
        data: product
      })
    }
  }

  console.log('✅ Produtos de exemplo criados')

  // Criar cupons de exemplo
  const coupons = [
    {
      code: 'CUPOM50A',
      face_value_cents: 5000, // R$ 50,00
      sale_price_cents: 1000, // R$ 10,00
      buyer_id: users[0].id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    },
    {
      code: 'CUPOM100B',
      face_value_cents: 10000, // R$ 100,00
      sale_price_cents: 2000, // R$ 20,00
      buyer_id: users[1].id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    },
    {
      code: 'CUPOM25C',
      face_value_cents: 2500, // R$ 25,00
      sale_price_cents: 500, // R$ 5,00
      buyer_id: users[2].id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    }
  ]

  // Verificar se já existem cupons
  const existingCoupons = await prisma.coupon.count()
  
  if (existingCoupons === 0) {
    for (const coupon of coupons) {
      await prisma.coupon.create({
        data: coupon
      })
    }
  }

  console.log('✅ Cupons de exemplo criados')
  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })