import { prisma } from './prisma'

// Função para executar queries com retry em caso de erro de prepared statement
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Verifica se é um erro de prepared statement ou conexão PostgreSQL
      const isPreparedStatementError = 
        error?.message?.includes('prepared statement') ||
        error?.code === '26000' || // prepared statement does not exist
        error?.code === '42P05' || // prepared statement already exists
        error?.code === '22P03' || // incorrect binary data format
        error?.code === '08P01' || // bind message supplies wrong parameters
        error?.message?.includes('does not exist') ||
        error?.message?.includes('already exists') ||
        error?.message?.includes('incorrect binary data format') ||
        error?.message?.includes('bind message supplies')
      
      if (isPreparedStatementError && attempt < maxRetries) {
        console.warn(`Tentativa ${attempt} falhou com erro de prepared statement, tentando novamente...`)
        
        // Aguarda um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 100 * attempt))
        continue
      }
      
      // Se não é erro de prepared statement ou esgotaram as tentativas, relança o erro
      throw error
    }
  }
  
  throw lastError
}

// Wrapper para operações comuns do Prisma
export const prismaWithRetry = {
  user: {
    count: () => executeWithRetry(() => prisma.user.count()),
    findMany: (args?: any) => executeWithRetry(() => prisma.user.findMany(args)),
    findUnique: (args: any) => executeWithRetry(() => prisma.user.findUnique(args)),
    create: (args: any) => executeWithRetry(() => prisma.user.create(args)),
    update: (args: any) => executeWithRetry(() => prisma.user.update(args)),
    delete: (args: any) => executeWithRetry(() => prisma.user.delete(args))
  },
  
  order: {
    count: (args?: any) => executeWithRetry(() => prisma.order.count(args)),
    findMany: (args?: any) => executeWithRetry(() => prisma.order.findMany(args)),
    findFirst: (args?: any) => executeWithRetry(() => prisma.order.findFirst(args)),
    findUnique: (args: any) => executeWithRetry(() => prisma.order.findUnique(args)),
    create: (args: any) => executeWithRetry(() => prisma.order.create(args)),
    update: (args: any) => executeWithRetry(() => prisma.order.update(args)),
    delete: (args: any) => executeWithRetry(() => prisma.order.delete(args))
  },
  
  coupon: {
    count: (args?: any) => executeWithRetry(() => prisma.coupon.count(args)),
    findMany: (args?: any) => executeWithRetry(() => prisma.coupon.findMany(args)),
    findUnique: (args: any) => executeWithRetry(() => prisma.coupon.findUnique(args)),
    findFirst: (args?: any) => executeWithRetry(() => prisma.coupon.findFirst(args)),
    create: (args: any) => executeWithRetry(() => prisma.coupon.create(args)),
    update: (args: any) => executeWithRetry(() => prisma.coupon.update(args)),
    updateMany: (args: any) => executeWithRetry(() => prisma.coupon.updateMany(args)),
    aggregate: (args: any) => executeWithRetry(() => prisma.coupon.aggregate(args)),
    delete: (args: any) => executeWithRetry(() => prisma.coupon.delete(args))
  },
  
  payment: {
    count: (args?: any) => executeWithRetry(() => prisma.payment.count(args)),
    findMany: (args?: any) => executeWithRetry(() => prisma.payment.findMany(args)),
    findFirst: (args?: any) => executeWithRetry(() => prisma.payment.findFirst(args)),
    findUnique: (args: any) => executeWithRetry(() => prisma.payment.findUnique(args)),
    create: (args: any) => executeWithRetry(() => prisma.payment.create(args)),
    update: (args: any) => executeWithRetry(() => prisma.payment.update(args)),
    delete: (args: any) => executeWithRetry(() => prisma.payment.delete(args))
  },
  
  product: {
    count: (args?: any) => executeWithRetry(() => prisma.product.count(args)),
    findMany: (args?: any) => executeWithRetry(() => prisma.product.findMany(args)),
    findUnique: (args: any) => executeWithRetry(() => prisma.product.findUnique(args)),
    create: (args: any) => executeWithRetry(() => prisma.product.create(args)),
    update: (args: any) => executeWithRetry(() => prisma.product.update(args)),
    delete: (args: any) => executeWithRetry(() => prisma.product.delete(args))
  },

  category: {
    count: (args?: any) => executeWithRetry(() => prisma.category.count(args)),
    findMany: (args?: any) => executeWithRetry(() => prisma.category.findMany(args)),
    findUnique: (args: any) => executeWithRetry(() => prisma.category.findUnique(args)),
    findFirst: (args?: any) => executeWithRetry(() => prisma.category.findFirst(args)),
    create: (args: any) => executeWithRetry(() => prisma.category.create(args)),
    update: (args: any) => executeWithRetry(() => prisma.category.update(args)),
    delete: (args: any) => executeWithRetry(() => prisma.category.delete(args))
  },



  orderItem: {
    count: (args?: any) => executeWithRetry(() => prisma.orderItem.count(args)),
    findMany: (args?: any) => executeWithRetry(() => prisma.orderItem.findMany(args)),
    findUnique: (args: any) => executeWithRetry(() => prisma.orderItem.findUnique(args)),
    create: (args: any) => executeWithRetry(() => prisma.orderItem.create(args)),
    update: (args: any) => executeWithRetry(() => prisma.orderItem.update(args)),
    aggregate: (args: any) => executeWithRetry(() => prisma.orderItem.aggregate(args)),
    delete: (args: any) => executeWithRetry(() => prisma.orderItem.delete(args))
  },

  $transaction: prisma.$transaction.bind(prisma),
  $disconnect: prisma.$disconnect.bind(prisma),
}