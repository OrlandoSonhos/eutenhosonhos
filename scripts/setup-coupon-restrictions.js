const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupCouponRestrictions() {
  try {
    console.log('🔧 CONFIGURANDO RESTRIÇÕES INICIAIS DE CUPONS')
    console.log('=' .repeat(50))

    // 1. Verificar categorias existentes
    console.log('1. Verificando categorias existentes...')
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })

    if (categories.length === 0) {
      console.log('❌ Nenhuma categoria encontrada!')
      return
    }

    console.log(`✅ Encontradas ${categories.length} categorias:`)
    categories.forEach((category, index) => {
      console.log(`   ${index + 1}. ${category.name} (ID: ${category.id})`)
    })

    // 2. Verificar cupons de desconto existentes
    console.log('\n2. Verificando cupons de desconto existentes...')
    const discountCoupons = await prisma.discountCoupon.findMany({
      where: { is_active: true },
      orderBy: { type: 'asc' }
    })

    if (discountCoupons.length === 0) {
      console.log('❌ Nenhum cupom de desconto ativo encontrado!')
      return
    }

    console.log(`✅ Encontrados ${discountCoupons.length} cupons ativos:`)
    discountCoupons.forEach((coupon, index) => {
      console.log(`   ${index + 1}. ${coupon.type} - ${coupon.discount_percent}% (ID: ${coupon.id})`)
    })

    // 3. Verificar restrições existentes
    console.log('\n3. Verificando restrições existentes...')
    let existingRestrictions = []
    try {
      existingRestrictions = await prisma.couponCategoryRestriction.findMany({
        include: {
          discount_coupon: { select: { type: true } },
          category: { select: { name: true } }
        }
      })
    } catch (error) {
      console.log('⚠️  Tabela de restrições ainda não existe no banco. Será criada automaticamente.')
      existingRestrictions = []
    }

    console.log(`📋 Restrições existentes: ${existingRestrictions.length}`)
    if (existingRestrictions.length > 0) {
      existingRestrictions.forEach((restriction, index) => {
        console.log(`   ${index + 1}. ${restriction.discount_coupon.type} -> ${restriction.category.name} (${restriction.restriction_type})`)
      })
    }

    // 4. Configurar restrições de exemplo
    console.log('\n4. Configurando restrições de exemplo...')
    
    // Exemplo 1: Cupom SPECIAL_50 só pode ser usado em "Eletrônicos" (se existir)
    const eletronicosCategory = categories.find(c => 
      c.name.toLowerCase().includes('eletrônico') || 
      c.name.toLowerCase().includes('eletronico') ||
      c.name.toLowerCase().includes('tecnologia')
    )
    
    const special50Coupon = discountCoupons.find(c => c.type === 'SPECIAL_50')
    
    if (eletronicosCategory && special50Coupon) {
      // Verificar se já existe
      try {
        const existingRestriction = await prisma.couponCategoryRestriction.findFirst({
          where: {
            coupon_id: special50Coupon.id,
            category_id: eletronicosCategory.id
          }
        })

        if (!existingRestriction) {
          await prisma.couponCategoryRestriction.create({
            data: {
              coupon_id: special50Coupon.id,
              category_id: eletronicosCategory.id,
              restriction_type: 'ONLY_CATEGORIES'
            }
          })
          console.log(`✅ Criada restrição: ${special50Coupon.type} só pode ser usado em "${eletronicosCategory.name}"`)
        } else {
          console.log(`ℹ️  Restrição já existe: ${special50Coupon.type} -> ${eletronicosCategory.name}`)
        }
      } catch (error) {
        console.log(`⚠️  Não foi possível criar restrição para ${special50Coupon.type}. Tabela ainda não existe.`)
      }
    }

    // Exemplo 2: Cupom PERMANENT_25 não pode ser usado em "Livros" (se existir)
    const livrosCategory = categories.find(c => 
      c.name.toLowerCase().includes('livro') || 
      c.name.toLowerCase().includes('literatura') ||
      c.name.toLowerCase().includes('educação')
    )
    
    const permanent25Coupon = discountCoupons.find(c => c.type === 'PERMANENT_25')
    
    if (livrosCategory && permanent25Coupon) {
      // Verificar se já existe
      try {
        const existingRestriction = await prisma.couponCategoryRestriction.findFirst({
          where: {
            coupon_id: permanent25Coupon.id,
            category_id: livrosCategory.id
          }
        })

        if (!existingRestriction) {
          await prisma.couponCategoryRestriction.create({
            data: {
              coupon_id: permanent25Coupon.id,
              category_id: livrosCategory.id,
              restriction_type: 'EXCLUDE_CATEGORIES'
            }
          })
          console.log(`✅ Criada restrição: ${permanent25Coupon.type} não pode ser usado em "${livrosCategory.name}"`)
        } else {
          console.log(`ℹ️  Restrição já existe: ${permanent25Coupon.type} -> ${livrosCategory.name}`)
        }
      } catch (error) {
        console.log(`⚠️  Não foi possível criar restrição para ${permanent25Coupon.type}. Tabela ainda não existe.`)
      }
    }

    // 5. Mostrar configuração final
    console.log('\n5. Configuração final das restrições...')
    const finalRestrictions = await prisma.couponCategoryRestriction.findMany({
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
  })

    console.log(`📊 Total de restrições configuradas: ${finalRestrictions.length}`)
    if (finalRestrictions.length > 0) {
      console.log('\n📋 RESUMO DAS RESTRIÇÕES:')
      finalRestrictions.forEach((restriction, index) => {
        const typeLabel = restriction.restriction_type === 'ONLY_CATEGORIES' 
          ? 'APENAS EM' 
          : 'EXCLUIR DE'
        console.log(`   ${index + 1}. ${restriction.coupon.type} (${restriction.coupon.discount_percent}%) -> ${typeLabel} "${restriction.category.name}"`)
      })
    }

    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!')
    console.log('   As restrições de cupons por categoria foram configuradas com sucesso.')
    console.log('   Você pode gerenciar essas restrições através do painel administrativo.')

  } catch (error) {
    console.error('❌ ERRO NA CONFIGURAÇÃO:', error)
    console.error('   Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  setupCouponRestrictions()
}

module.exports = { setupCouponRestrictions }