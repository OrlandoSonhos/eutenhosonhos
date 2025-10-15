// Script para testar o checkout completo
const testCheckout = async () => {
  try {
    console.log('🛒 Testando o checkout completo...')
    
    // 1. Fazer login
    console.log('🔐 Fazendo login...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'joao@exemplo.com',
        password: '123456'
      })
    })
    
    if (!loginResponse.ok) {
      console.log('❌ Erro no login:', loginResponse.status)
      return
    }
    
    console.log('✅ Login realizado com sucesso!')
    
    // 2. Buscar produtos disponíveis
    console.log('📦 Buscando produtos...')
    const productsResponse = await fetch('http://localhost:3000/api/products')
    const productsData = await productsResponse.json()
    
    if (!productsData.products || productsData.products.length === 0) {
      console.log('❌ Nenhum produto encontrado')
      return
    }
    
    const product = productsData.products[0]
    console.log(`✅ Produto encontrado: ${product.title} - R$ ${(product.price_cents / 100).toFixed(2)}`)
    
    // 3. Simular carrinho
    const cartItem = {
      id: product.id,
      title: product.title,
      price_cents: product.price_cents,
      quantity: 1,
      stock: product.stock
    }
    
    console.log('🛍️ Item adicionado ao carrinho:', cartItem)
    
    // 4. Calcular totais
    const subtotal = cartItem.price_cents * cartItem.quantity
    const shipping = 0 // Frete grátis para teste
    const discount = 0 // Sem desconto para teste
    const total = subtotal + shipping - discount
    
    // 5. Testar criação de pedido
    console.log('💳 Testando criação de pedido...')
    const orderResponse = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      },
      body: JSON.stringify({
        items: [cartItem],
        couponCode: null,
        discountCouponCode: null,
        subtotal: subtotal,
        shipping: shipping,
        discount: discount,
        total: total
      })
    })
    
    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.log('❌ Erro na criação do pedido:', orderResponse.status, errorText)
      return
    }
    
    const orderData = await orderResponse.json()
    console.log('✅ Pedido criado com sucesso!')
    console.log('📋 Dados do pedido:', {
      orderId: orderData.orderId,
      checkoutUrl: orderData.checkoutUrl ? 'URL gerada' : 'Sem URL',
      total: `R$ ${(orderData.total / 100).toFixed(2)}`
    })
    
    if (orderData.checkoutUrl) {
      console.log('🎉 CHECKOUT FUNCIONANDO! URL do Mercado Pago gerada com sucesso!')
      console.log('🔗 URL:', orderData.checkoutUrl)
    } else {
      console.log('⚠️ Checkout criado mas sem URL do Mercado Pago')
    }
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message)
  }
}

testCheckout()