import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuração específica para produção PostgreSQL
const prismaConfig = {
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Configurações para resolver problemas de prepared statements e pooling
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
  }
} as any

// Em produção, adiciona configurações específicas para PostgreSQL
if (process.env.NODE_ENV === 'production') {
  // Adiciona parâmetros à URL para melhor compatibilidade com pooling
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.set('pgbouncer', 'true')
  url.searchParams.set('connection_limit', '1')
  url.searchParams.set('pool_timeout', '0')
  
  prismaConfig.datasources.db.url = url.toString()
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Função para desconectar o Prisma adequadamente
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

// Desconectar quando o processo terminar
process.on('beforeExit', async () => {
  await disconnectPrisma()
})