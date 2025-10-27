const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTodayTransactions() {
  try {
    console.log('🔍 VERIFICANDO TRANSAÇÕES DE HOJE');
    console.log('==================================');
    
    // Data de hoje (início e fim do dia)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    console.log(`📅 Período: ${startOfDay.toLocaleString('pt-BR')} até ${endOfDay.toLocaleString('pt-BR')}`);
    console.log('');

    // 1. Verificar compras de cupons de desconto
    console.log('💳 COMPRAS DE CUPONS DE DESCONTO:');
    console.log('--------------------------------');
    
    const couponPurchases = await prisma.discountCouponPurchase.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        discount_coupon: {
          select: {
            id: true,
            type: true,
            sale_price_cents: true
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            total_cents: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (couponPurchases.length === 0) {
      console.log('✅ Nenhuma compra de cupom encontrada hoje.');
    } else {
      console.log(`⚠️  ${couponPurchases.length} compra(s) de cupom encontrada(s) hoje:`);
      couponPurchases.forEach((purchase, index) => {
        console.log(`\n${index + 1}. COMPRA DE CUPOM:`);
        console.log(`   ID: ${purchase.id}`);
        console.log(`   Usuário: ${purchase.buyer?.name || 'N/A'} (${purchase.buyer?.email || 'N/A'})`);
        console.log(`   Cupom: ${purchase.code} (Tipo: ${purchase.discount_coupon?.type || 'N/A'})`);
        console.log(`   Preço: R$ ${(purchase.discount_coupon?.sale_price_cents || 0) / 100}`);
        console.log(`   Order ID: ${purchase.order_id || 'N/A'}`);
        console.log(`   Order Status: ${purchase.order?.status || 'N/A'}`);
        console.log(`   Usado em: ${purchase.used_at ? purchase.used_at.toLocaleString('pt-BR') : 'Não usado'}`);
        console.log(`   Expira em: ${purchase.expires_at ? purchase.expires_at.toLocaleString('pt-BR') : 'Sem expiração'}`);
        console.log(`   Data: ${purchase.created_at.toLocaleString('pt-BR')}`);
      });
    }

    console.log('\n');

    // 2. Verificar pedidos/orders
    console.log('📦 PEDIDOS/ORDERS:');
    console.log('------------------');
    
    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        order_items: {
          include: {
            product: {
              select: {
                title: true,
                price_cents: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (orders.length === 0) {
      console.log('✅ Nenhum pedido encontrado hoje.');
    } else {
      console.log(`⚠️  ${orders.length} pedido(s) encontrado(s) hoje:`);
      orders.forEach((order, index) => {
        console.log(`\n${index + 1}. PEDIDO:`);
        console.log(`   ID: ${order.id}`);
        console.log(`   Usuário: ${order.user?.name || 'N/A'} (${order.user?.email || 'N/A'})`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Total: R$ ${order.total_cents / 100}`);
        console.log(`   Data: ${order.created_at.toLocaleString('pt-BR')}`);
        if (order.order_items && order.order_items.length > 0) {
          console.log(`   Itens:`);
          order.order_items.forEach(item => {
            console.log(`     - ${item.product?.title || 'Produto N/A'} (Qtd: ${item.quantity}, Preço: R$ ${(item.product?.price_cents || 0) / 100})`);
          });
        }
      });
    }

    console.log('\n');

    // 3. Verificar usuários criados hoje (possível atividade suspeita)
    console.log('👤 USUÁRIOS CRIADOS HOJE:');
    console.log('-------------------------');
    
    const newUsers = await prisma.user.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (newUsers.length === 0) {
      console.log('✅ Nenhum usuário novo criado hoje.');
    } else {
      console.log(`⚠️  ${newUsers.length} usuário(s) novo(s) criado(s) hoje:`);
      newUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. USUÁRIO:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Nome: ${user.name || 'N/A'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Criado em: ${user.created_at.toLocaleString('pt-BR')}`);
      });
    }

    console.log('\n');
    console.log('🔍 VERIFICAÇÃO CONCLUÍDA');
    console.log('========================');

  } catch (error) {
    console.error('❌ Erro ao verificar transações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodayTransactions();