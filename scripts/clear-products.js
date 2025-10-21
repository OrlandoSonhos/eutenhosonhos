const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearProducts() {
  try {
    console.log('🗑️  Iniciando limpeza dos produtos...')
    
    // Primeiro, vamos contar quantos produtos existem
    const productCount = await prisma.product.count()
    console.log(`📊 Produtos encontrados: ${productCount}`)
    
    if (productCount === 0) {
      console.log('✅ Não há produtos para apagar.')
      return
    }
    
    // FORÇAR remoção de TODOS os produtos
    console.log('⚠️  ATENÇÃO: Removendo TODOS os produtos, incluindo os que têm vendas!')
    
    // Primeiro, remover todos os itens de pedido relacionados
    console.log('🗑️  Removendo itens de pedido relacionados...')
    const deletedOrderItems = await prisma.orderItem.deleteMany({})
    console.log(`✅ ${deletedOrderItems.count} itens de pedido removidos`)
    
    // Agora remover todos os produtos
    console.log('🗑️  Removendo todos os produtos...')
    const result = await prisma.product.deleteMany({})
    
    console.log(`✅ ${result.count} produtos foram apagados com sucesso!`)
    console.log('🎉 Limpeza concluída!')
    
  } catch (error) {
    console.error('❌ Erro ao apagar produtos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearProducts()