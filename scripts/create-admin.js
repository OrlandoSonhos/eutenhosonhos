const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('Verificando usuário admin...')
    
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('Usuário admin já existe:', existingAdmin.email)
      return
    }

    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@teste.com',
        password_hash: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('Usuário admin criado com sucesso!')
    console.log('Email: admin@teste.com')
    console.log('Senha: admin123')
    
  } catch (error) {
    console.error('Erro ao criar admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()