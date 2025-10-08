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
      
      // Verifica se é um erro de prepared statement
      const isPreparedStatementError = 
        error?.message?.includes('prepared statement') ||
        error?.code === '26000' ||
        error?.message?.includes('does not exist')
      
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

  orderItem: {
    count: (args?: any) => executeWithRetry(() => prisma.orderItem.count(args)),
    findMany: (args?: any) => executeWithRetry(() => prisma.orderItem.findMany(args)),
    findUnique: (args: any) => executeWithRetry(() => prisma.orderItem.findUnique(args)),
    create: (args: any) => executeWithRetry(() => prisma.orderItem.create(args)),
    update: (args: any) => executeWithRetry(() => prisma.orderItem.update(args)),
    aggregate: (args: any) => executeWithRetry(() => prisma.orderItem.aggregate(args)),
    delete: (args: any) => executeWithRetry(() => prisma.orderItem.delete(args))
  }
}