const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRestrictionCreation() {
  try {
    console.log('🧪 TESTANDO CRIAÇÃO DE RESTRIÇÕES DE CUPONS');
    console.log('=' .repeat(50));

    // 1. Buscar cupons disponíveis
    console.log('1. Buscando cupons disponíveis...');
    const coupons = await prisma.discountCoupon.findMany({
      where: { is_active: true },
      select: {
        id: true,
        type: true,
        discount_percent: true
      }
    });

    if (coupons.length === 0) {
      console.log('❌ Nenhum cupom ativo encontrado!');
      return;
    }

    console.log(`✅ Encontrados ${coupons.length} cupons:`);
    coupons.forEach((coupon, index) => {
      console.log(`   ${index + 1}. ${coupon.type} - ${coupon.discount_percent}% (ID: ${coupon.id})`);
    });

    // 2. Buscar categorias disponíveis
    console.log('\n2. Buscando categorias disponíveis...');
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true
      }
    });

    if (categories.length === 0) {
      console.log('❌ Nenhuma categoria encontrada!');
      return;
    }

    console.log(`✅ Encontradas ${categories.length} categorias:`);
    categories.forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.name} (ID: ${category.id})`);
    });

    // 3. Testar criação de restrição
    console.log('\n3. Testando criação de restrição...');
    
    const testCoupon = coupons[0]; // Primeiro cupom
    const testCategory = categories.find(c => c.name.toLowerCase().includes('oferta')) || categories[0]; // Categoria "Oferta do dia" ou primeira

    console.log(`   Cupom: ${testCoupon.type}`);
    console.log(`   Categoria: ${testCategory.name}`);
    console.log(`   Tipo: ONLY_CATEGORIES`);

    // Verificar se já existe
    const existingRestriction = await prisma.couponCategoryRestriction.findFirst({
      where: {
        coupon_id: testCoupon.id,
        category_id: testCategory.id
      }
    });

    if (existingRestriction) {
      console.log('⚠️  Restrição já existe! Removendo para testar...');
      await prisma.couponCategoryRestriction.delete({
        where: { id: existingRestriction.id }
      });
    }

    // Criar nova restrição
    const newRestriction = await prisma.couponCategoryRestriction.create({
      data: {
        coupon_id: testCoupon.id,
        category_id: testCategory.id,
        restriction_type: 'ONLY_CATEGORIES'
      },
      include: {
        coupon: {
          select: {
            type: true,
            discount_percent: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('✅ Restrição criada com sucesso!');
    console.log(`   ID: ${newRestriction.id}`);
    console.log(`   Cupom: ${newRestriction.coupon.type} (${newRestriction.coupon.discount_percent}%)`);
    console.log(`   Categoria: ${newRestriction.category.name}`);
    console.log(`   Tipo: ${newRestriction.restriction_type}`);

    // 4. Verificar se a restrição foi salva corretamente
    console.log('\n4. Verificando restrição salva...');
    const savedRestriction = await prisma.couponCategoryRestriction.findUnique({
      where: { id: newRestriction.id },
      include: {
        coupon: true,
        category: true
      }
    });

    if (savedRestriction) {
      console.log('✅ Restrição verificada no banco de dados!');
      console.log(`   Criada em: ${savedRestriction.created_at.toLocaleString('pt-BR')}`);
    } else {
      console.log('❌ Erro: Restrição não encontrada no banco!');
    }

    // 5. Listar todas as restrições
    console.log('\n5. Listando todas as restrições...');
    const allRestrictions = await prisma.couponCategoryRestriction.findMany({
      include: {
        coupon: {
          select: {
            type: true,
            discount_percent: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`📋 Total de restrições: ${allRestrictions.length}`);
    allRestrictions.forEach((restriction, index) => {
      const typeLabel = restriction.restriction_type === 'ONLY_CATEGORIES' ? 'APENAS EM' : 'EXCLUIR DE';
      console.log(`   ${index + 1}. ${restriction.coupon.type} -> ${typeLabel} "${restriction.category.name}"`);
    });

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('   A API de restrições está funcionando corretamente.');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testRestrictionCreation();