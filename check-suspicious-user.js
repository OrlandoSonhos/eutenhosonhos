const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSuspiciousUser() {
  try {
    console.log('🕵️ INVESTIGAÇÃO DETALHADA - USUÁRIO SUSPEITO');
    console.log('=============================================');
    
    const suspiciousEmail = 'daniel.az09za@gmail.com';
    
    // 1. Buscar o usuário
    console.log(`🔍 Investigando usuário: ${suspiciousEmail}`);
    console.log('');
    
    const user = await prisma.user.findUnique({
      where: { email: suspiciousEmail },
      include: {
        orders: {
          include: {
            order_items: {
              include: {
                product: true
              }
            },
            payments: true
          }
        },
        discount_coupon_purchases: {
          include: {
            discount_coupon: true,
            order: true
          }
        },
        coupons: true
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado!');
      return;
    }

    console.log('👤 DADOS DO USUÁRIO:');
    console.log('-------------------');
    console.log(`ID: ${user.id}`);
    console.log(`Nome: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Criado em: ${user.created_at.toLocaleString('pt-BR')}`);
    console.log(`Atualizado em: ${user.updated_at.toLocaleString('pt-BR')}`);
    console.log('');

    // 2. Verificar compras de cupons de desconto
    console.log('💳 COMPRAS DE CUPONS DE DESCONTO:');
    console.log('--------------------------------');
    if (user.discount_coupon_purchases.length === 0) {
      console.log('✅ Nenhuma compra de cupom encontrada.');
    } else {
      user.discount_coupon_purchases.forEach((purchase, index) => {
        console.log(`${index + 1}. Cupom: ${purchase.code}`);
        console.log(`   Tipo: ${purchase.discount_coupon.type}`);
        console.log(`   Preço: R$ ${(purchase.discount_coupon.sale_price_cents || 0) / 100}`);
        console.log(`   Comprado em: ${purchase.created_at.toLocaleString('pt-BR')}`);
        console.log(`   Usado em: ${purchase.used_at ? purchase.used_at.toLocaleString('pt-BR') : 'NÃO USADO'}`);
        console.log(`   Expira em: ${purchase.expires_at ? purchase.expires_at.toLocaleString('pt-BR') : 'Sem expiração'}`);
        console.log(`   Order ID: ${purchase.order_id || 'N/A'}`);
        console.log('');
      });
    }

    // 3. Verificar pedidos
    console.log('📦 PEDIDOS:');
    console.log('----------');
    if (user.orders.length === 0) {
      console.log('✅ Nenhum pedido encontrado.');
    } else {
      user.orders.forEach((order, index) => {
        console.log(`${index + 1}. Pedido ID: ${order.id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Total: R$ ${order.total_cents / 100}`);
        console.log(`   Desconto: R$ ${order.discount_cents / 100}`);
        console.log(`   Final: R$ ${order.final_cents / 100}`);
        console.log(`   Criado em: ${order.created_at.toLocaleString('pt-BR')}`);
        console.log(`   Atualizado em: ${order.updated_at.toLocaleString('pt-BR')}`);
        
        if (order.order_items.length > 0) {
          console.log(`   Itens:`);
          order.order_items.forEach(item => {
            console.log(`     - ${item.product.title} (Qtd: ${item.quantity}, Preço: R$ ${item.price_cents / 100})`);
          });
        }
        
        if (order.payments.length > 0) {
          console.log(`   Pagamentos:`);
          order.payments.forEach(payment => {
            console.log(`     - ID: ${payment.id}, Status: ${payment.status}, Método: ${payment.method}`);
            console.log(`       Valor: R$ ${payment.amount_cents / 100}, MP ID: ${payment.mp_payment_id || 'N/A'}`);
            console.log(`       Criado: ${payment.created_at.toLocaleString('pt-BR')}`);
          });
        }
        console.log('');
      });
    }

    // 4. Verificar cupons normais
    console.log('🎫 CUPONS NORMAIS:');
    console.log('-----------------');
    if (user.coupons.length === 0) {
      console.log('✅ Nenhum cupom normal encontrado.');
    } else {
      user.coupons.forEach((coupon, index) => {
        console.log(`${index + 1}. Cupom: ${coupon.code}`);
        console.log(`   Valor: R$ ${coupon.face_value_cents / 100}`);
        console.log(`   Preço de venda: R$ ${coupon.sale_price_cents / 100}`);
        console.log(`   Status: ${coupon.status}`);
        console.log(`   Expira em: ${coupon.expires_at.toLocaleString('pt-BR')}`);
        console.log(`   Usado em: ${coupon.used_at ? coupon.used_at.toLocaleString('pt-BR') : 'Não usado'}`);
        console.log('');
      });
    }

    // 5. Verificar se há outros usuários com padrão similar
    console.log('🔍 VERIFICANDO PADRÕES SIMILARES:');
    console.log('--------------------------------');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    
    const similarUsers = await prisma.user.findMany({
      where: {
        created_at: {
          gte: startOfDay
        },
        discount_coupon_purchases: {
          some: {
            created_at: {
              gte: startOfDay
            }
          }
        }
      },
      include: {
        discount_coupon_purchases: {
          where: {
            created_at: {
              gte: startOfDay
            }
          }
        }
      }
    });

    console.log(`Usuários criados hoje que compraram cupons: ${similarUsers.length}`);
    similarUsers.forEach(u => {
      const timeDiff = Math.abs(u.discount_coupon_purchases[0].created_at - u.created_at) / 1000 / 60; // em minutos
      console.log(`- ${u.name} (${u.email}): Comprou cupom ${timeDiff.toFixed(1)} minutos após criar conta`);
    });

    console.log('');
    console.log('🎯 INVESTIGAÇÃO CONCLUÍDA');
    console.log('========================');

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuspiciousUser();