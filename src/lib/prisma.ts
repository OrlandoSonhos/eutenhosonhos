import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Configurações para resolver problemas de prepared statements
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Função para desconectar o Prisma adequadamente
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

// Desconectar quando o processo terminar
process.on('beforeExit', async () => {
  await disconnectPrisma()
})