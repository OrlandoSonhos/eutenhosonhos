// Script simplificado para verificar cupons do usuário Vinicius
const { Pool } = require('pg');

async function checkUserCoupons() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando ao banco de dados...');
    
    // Primeiro, vamos encontrar o usuário Vinicius Deiró
    const userQuery = `
      SELECT id, name, email 
      FROM users 
      WHERE name ILIKE '%vinicius%' OR name ILIKE '%deiró%' OR email ILIKE '%vinicius%'
      LIMIT 1
    `;
    
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('Usuário Vinicius Deiró não encontrado');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('Usuário encontrado:', {
      id: user.id,
      name: user.name,
      email: user.email
    });
    
    console.log('\n=== CUPONS ANTIGOS (tabela coupons) ===');
    
    // Verificar cupons antigos
    const oldCouponsQuery = `
      SELECT id, code, status, face_value_cents, created_at
      FROM coupons 
      WHERE buyer_id = $1
      ORDER BY created_at DESC
    `;
    
    const oldCouponsResult = await pool.query(oldCouponsQuery, [user.id]);
    
    console.log('Cupons antigos encontrados:', oldCouponsResult.rows.length);
    oldCouponsResult.rows.forEach(coupon => {
      console.log(`- ID: ${coupon.id}, Código: ${coupon.code}, Status: ${coupon.status}, Valor: R$ ${(coupon.face_value_cents/100).toFixed(2)}`);
    });
    
    console.log('\n=== CUPONS PERCENTUAIS (tabela discount_coupon_purchases) ===');
    
    // Verificar cupons percentuais
    const percentualCouponsQuery = `
      SELECT dcp.id, dcp.code, dcp.used_at, dcp.expires_at, dcp.created_at,
             dc.discount_percent, dc.type
      FROM discount_coupon_purchases dcp
      JOIN discount_coupons dc ON dcp.discount_coupon_id = dc.id
      WHERE dcp.buyer_id = $1
      ORDER BY dcp.created_at DESC
    `;
    
    const percentualCouponsResult = await pool.query(percentualCouponsQuery, [user.id]);
    
    console.log('Cupons percentuais encontrados:', percentualCouponsResult.rows.length);
    percentualCouponsResult.rows.forEach(coupon => {
      console.log(`- ID: ${coupon.id}, Código: ${coupon.code}, Desconto: ${coupon.discount_percent}%, Usado: ${coupon.used_at ? 'Sim' : 'Não'}, Expira: ${coupon.expires_at || 'Nunca'}`);
    });
    
    console.log('\n=== TOTAL DE CUPONS ===');
    console.log(`Total de cupons antigos: ${oldCouponsResult.rows.length}`);
    console.log(`Total de cupons percentuais: ${percentualCouponsResult.rows.length}`);
    console.log(`Total geral: ${oldCouponsResult.rows.length + percentualCouponsResult.rows.length}`);
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserCoupons();