// Script simples para verificar cupons de desconto
async function checkDiscountCoupons() {
  try {
    const response = await fetch('http://localhost:3000/api/coupons/buy');
    const data = await response.json();
    
    console.log('Resposta da API:', JSON.stringify(data, null, 2));
    
    if (data.couponTypes) {
      console.log('\nCupons encontrados:');
      data.couponTypes.forEach((coupon, index) => {
        console.log(`${index + 1}. ${coupon.name}`);
        console.log(`   - ID: ${coupon.id}`);
        console.log(`   - É percentual: ${coupon.isPercentual || false}`);
        console.log(`   - Desconto: ${coupon.discountPercent || 'N/A'}%`);
        console.log(`   - Preço: R$ ${(coupon.salePriceCents / 100).toFixed(2)}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkDiscountCoupons();