const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMPPaymentsToday() {
  try {
    console.log('💳 VERIFICANDO PAGAMENTOS MERCADO PAGO - HOJE');
    console.log('=============================================');
    
    // Data de hoje (início e fim do dia)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    console.log(`📅 Período: ${startOfDay.toLocaleString('pt-BR')} até ${endOfDay.toLocaleString('pt-BR')}`);
    console.log('');

    // 1. Verificar todos os pagamentos de hoje
    console.log('💰 TODOS OS PAGAMENTOS DE HOJE:');
    console.log('-------------------------------');
    
    const payments = await prisma.payment.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
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
          }
        },
        coupon: {
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (payments.length === 0) {
      console.log('✅ Nenhum pagamento encontrado hoje.');
    } else {
      console.log(`⚠️  ${payments.length} pagamento(s) encontrado(s) hoje:`);
      payments.forEach((payment, index) => {
        console.log(`\n${index + 1}. PAGAMENTO:`);
        console.log(`   ID: ${payment.id}`);
        console.log(`   MP Payment ID: ${payment.mp_payment_id || 'N/A'}`);
        console.log(`   Valor: R$ ${payment.amount_cents / 100}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Método: ${payment.method}`);
        console.log(`   Criado em: ${payment.created_at.toLocaleString('pt-BR')}`);
        console.log(`   Atualizado em: ${payment.updated_at.toLocaleString('pt-BR')}`);
        
        if (payment.order) {
          console.log(`   📦 PEDIDO RELACIONADO:`);
          console.log(`      Order ID: ${payment.order.id}`);
          console.log(`      Usuário: ${payment.order.user?.name || 'N/A'} (${payment.order.user?.email || 'N/A'})`);
          console.log(`      Status: ${payment.order.status}`);
          console.log(`      Total: R$ ${payment.order.total_cents / 100}`);
          
          if (payment.order.order_items.length > 0) {
            console.log(`      Itens:`);
            payment.order.order_items.forEach(item => {
              console.log(`        - ${item.product?.title || 'Produto N/A'} (Qtd: ${item.quantity}, Preço: R$ ${(item.product?.price_cents || 0) / 100})`);
            });
          }
        }
        
        if (payment.coupon) {
          console.log(`   🎫 CUPOM RELACIONADO:`);
          console.log(`      Cupom ID: ${payment.coupon.id}`);
          console.log(`      Código: ${payment.coupon.code}`);
          console.log(`      Comprador: ${payment.coupon.buyer?.name || 'N/A'} (${payment.coupon.buyer?.email || 'N/A'})`);
          console.log(`      Valor: R$ ${payment.coupon.face_value_cents / 100}`);
          console.log(`      Preço de venda: R$ ${payment.coupon.sale_price_cents / 100}`);
          console.log(`      Status: ${payment.coupon.status}`);
        }
      });
    }

    console.log('\n');

    // 2. Verificar especificamente pagamentos do usuário suspeito
    console.log('🕵️ PAGAMENTOS DO USUÁRIO SUSPEITO:');
    console.log('----------------------------------');
    
    const suspiciousUserPayments = await prisma.payment.findMany({
      where: {
        OR: [
          {
            order: {
              user: {
                email: 'daniel.az09za@gmail.com'
              }
            }
          },
          {
            coupon: {
              buyer: {
                email: 'daniel.az09za@gmail.com'
              }
            }
          }
        ]
      },
      include: {
        order: {
          include: {
            user: true
          }
        },
        coupon: {
          include: {
            buyer: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (suspiciousUserPayments.length === 0) {
      console.log('✅ Nenhum pagamento encontrado para o usuário suspeito.');
    } else {
      console.log(`⚠️  ${suspiciousUserPayments.length} pagamento(s) do usuário suspeito:`);
      suspiciousUserPayments.forEach((payment, index) => {
        console.log(`\n${index + 1}. PAGAMENTO SUSPEITO:`);
        console.log(`   ID: ${payment.id}`);
        console.log(`   MP Payment ID: ${payment.mp_payment_id || 'N/A'}`);
        console.log(`   Valor: R$ ${payment.amount_cents / 100}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Método: ${payment.method}`);
        console.log(`   Criado em: ${payment.created_at.toLocaleString('pt-BR')}`);
        
        if (payment.order) {
          console.log(`   Tipo: PAGAMENTO DE PEDIDO`);
          console.log(`   Order ID: ${payment.order.id}`);
        }
        
        if (payment.coupon) {
          console.log(`   Tipo: PAGAMENTO DE CUPOM`);
          console.log(`   Cupom: ${payment.coupon.code}`);
        }
      });
    }

    console.log('\n');
    console.log('🔍 VERIFICAÇÃO DE PAGAMENTOS CONCLUÍDA');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Erro ao verificar pagamentos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMPPaymentsToday();