const fetch = require('node-fetch');

async function testCorreiosAPI() {
  console.log('🚀 Testando API dos Correios...');
  
  // Primeiro, vamos buscar um produto para usar no teste
  console.log('📦 Buscando produto para teste...');
  
  const productsResponse = await fetch('http://localhost:3000/api/products?limit=1');
  const productsData = await productsResponse.json();
  
  if (!productsData.products || productsData.products.length === 0) {
    console.error('❌ Nenhum produto encontrado para teste');
    return;
  }
  
  const product = productsData.products[0];
  console.log(`✅ Produto encontrado: ${product.title} (ID: ${product.id})`);
  
  const testData = {
    cep: '08730660',
    items: [
      {
        productId: product.id,
        quantity: 1
      }
    ]
  };
  
  try {
    console.log('📦 Dados do teste:', testData);
    console.log('🌐 Fazendo requisição para: http://localhost:3000/api/shipping/calculate');
    
    const response = await fetch('http://localhost:3000/api/shipping/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Resultado do cálculo de frete:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.options) {
      console.log('\n📋 Resumo das opções de frete:');
      result.options.forEach((option, index) => {
        console.log(`${index + 1}. ${option.name}`);
        console.log(`   💰 Preço: R$ ${(option.price / 100).toFixed(2)}`);
        console.log(`   ⏰ Prazo: ${option.deadline} dias úteis`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

// Teste do ViaCEP também
async function testViaCEP() {
  console.log('\n🏠 Testando API ViaCEP para o CEP 08730660...');
  
  try {
    const response = await fetch('https://viacep.com.br/ws/08730660/json/');
    const result = await response.json();
    
    if (result.erro) {
      console.error('❌ CEP não encontrado');
    } else {
      console.log('✅ Endereço encontrado:');
      console.log(`📍 ${result.logradouro}, ${result.bairro}`);
      console.log(`🏙️ ${result.localidade} - ${result.uf}`);
    }
  } catch (error) {
    console.error('❌ Erro ao consultar ViaCEP:', error.message);
  }
}

// Teste do fluxo completo do checkout
async function testCheckoutFlow() {
  console.log('\n🛒 Testando fluxo completo do checkout...');
  
  try {
    // 1. Buscar produtos
    console.log('1. Buscando produtos...');
    const productsResponse = await fetch('http://localhost:3000/api/products?limit=1');
    const productsData = await productsResponse.json();
    
    if (!productsData.products || productsData.products.length === 0) {
      console.error('❌ Nenhum produto encontrado');
      return;
    }
    
    const product = productsData.products[0];
    console.log(`✅ Produto: ${product.title} - R$ ${(product.price_cents / 100).toFixed(2)}`);
    
    // 2. Simular carrinho
    const cartItems = [
      {
        id: product.id,
        title: product.title,
        price_cents: product.price_cents,
        quantity: 1,
        stock: product.stock
      }
    ];
    
    console.log('2. Carrinho simulado criado ✅');
    
    // 3. Testar cálculo de frete
    console.log('3. Testando cálculo de frete para CEP 08730660...');
    
    const shippingResponse = await fetch('http://localhost:3000/api/shipping/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cep: '08730660',
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      })
    });
    
    if (!shippingResponse.ok) {
      const errorText = await shippingResponse.text();
      console.error('❌ Erro no cálculo de frete:', errorText);
      return;
    }
    
    const shippingData = await shippingResponse.json();
    console.log('✅ Opções de frete calculadas:');
    
    if (shippingData.shippingOptions) {
      shippingData.shippingOptions.forEach((option, index) => {
        console.log(`   ${index + 1}. ${option.nome}: R$ ${(option.valorCents / 100).toFixed(2)} - ${option.prazo} dias`);
      });
      
      // 4. Calcular totais
      const subtotal = cartItems.reduce((total, item) => total + (item.price_cents * item.quantity), 0);
      const shipping = shippingData.shippingOptions[0].valorCents; // Primeira opção
      const total = subtotal + shipping;
      
      console.log('\n💰 Resumo do pedido:');
      console.log(`   Subtotal: R$ ${(subtotal / 100).toFixed(2)}`);
      console.log(`   Frete: R$ ${(shipping / 100).toFixed(2)}`);
      console.log(`   Total: R$ ${(total / 100).toFixed(2)}`);
      
      console.log('\n🎉 Fluxo do checkout funcionando corretamente!');
    } else {
      console.error('❌ Formato de resposta inesperado:', shippingData);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste do checkout:', error.message);
  }
}

// Executar os testes
async function runTests() {
  await testViaCEP();
  await testCorreiosAPI();
  await testCheckoutFlow();
}

runTests();