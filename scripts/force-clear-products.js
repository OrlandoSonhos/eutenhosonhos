const fetch = require('node-fetch')

async function forceDeleteAllProducts() {
  try {
    console.log('🗑️  Forçando remoção de TODOS os produtos via endpoint especial...')
    
    const response = await fetch('http://localhost:3000/api/admin/clear-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Erro ${response.status}: ${errorData.error || 'Erro desconhecido'}`)
    }
    
    const result = await response.json()
    
    console.log('📊 RESULTADO:')
    console.log(`✅ ${result.message}`)
    if (result.orderItemsDeleted > 0) {
      console.log(`🗑️  Itens de pedido removidos: ${result.orderItemsDeleted}`)
    }
    console.log('🎉 Limpeza concluída!')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

forceDeleteAllProducts()