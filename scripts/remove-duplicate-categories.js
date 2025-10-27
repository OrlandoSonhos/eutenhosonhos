const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removeDuplicateCategories() {
  try {
    console.log('🔧 REMOVENDO CATEGORIAS DUPLICADAS')
    console.log('==================================')

    // 1. Verificar categorias "Oferta do Dia" duplicadas
    console.log('\n1. Verificando categorias "Oferta do Dia"...')
    
    const ofertaDiaCategories = await prisma.category.findMany({
      where: {
        OR: [
          { name: 'Oferta do dia' },
          { name: 'Oferta do Dia' }
        ]
      },
      orderBy: {
        created_at: 'asc' // Mais antiga primeiro
      }
    })

    console.log(`📋 Encontradas ${ofertaDiaCategories.length} categorias "Oferta do Dia":`)
    ofertaDiaCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. "${cat.name}" (ID: ${cat.id}) - Criada em: ${cat.created_at}`)
    })

    if (ofertaDiaCategories.length > 1) {
      // Manter a primeira (mais antiga) e remover as duplicatas
      const categoryToKeep = ofertaDiaCategories[0]
      const categoriesToRemove = ofertaDiaCategories.slice(1)

      console.log(`\n✅ Mantendo: "${categoryToKeep.name}" (ID: ${categoryToKeep.id})`)
      console.log(`❌ Removendo ${categoriesToRemove.length} duplicata(s):`)

      for (const cat of categoriesToRemove) {
        console.log(`   - "${cat.name}" (ID: ${cat.id})`)
        
        // Verificar se há produtos associados
        const productCount = await prisma.product.count({
          where: { category_id: cat.id }
        })

        if (productCount > 0) {
          console.log(`   ⚠️  Esta categoria tem ${productCount} produto(s). Movendo para a categoria principal...`)
          
          // Mover produtos para a categoria principal
          await prisma.product.updateMany({
            where: { category_id: cat.id },
            data: { category_id: categoryToKeep.id }
          })
          
          console.log(`   ✅ ${productCount} produto(s) movido(s) com sucesso`)
        }

        // Verificar se há restrições de cupons associadas
        const restrictionCount = await prisma.couponCategoryRestriction.count({
          where: { category_id: cat.id }
        })

        if (restrictionCount > 0) {
          console.log(`   ⚠️  Esta categoria tem ${restrictionCount} restrição(ões) de cupom. Movendo para a categoria principal...`)
          
          // Mover restrições para a categoria principal (se não existir duplicata)
          const restrictions = await prisma.couponCategoryRestriction.findMany({
            where: { category_id: cat.id }
          })

          for (const restriction of restrictions) {
            // Verificar se já existe uma restrição igual na categoria principal
            const existingRestriction = await prisma.couponCategoryRestriction.findFirst({
              where: {
                coupon_id: restriction.coupon_id,
                category_id: categoryToKeep.id,
                restriction_type: restriction.restriction_type
              }
            })

            if (!existingRestriction) {
              // Mover a restrição
              await prisma.couponCategoryRestriction.update({
                where: { id: restriction.id },
                data: { category_id: categoryToKeep.id }
              })
              console.log(`   ✅ Restrição movida: ${restriction.coupon_id} -> ${categoryToKeep.name}`)
            } else {
              // Remover a restrição duplicada
              await prisma.couponCategoryRestriction.delete({
                where: { id: restriction.id }
              })
              console.log(`   🗑️  Restrição duplicada removida: ${restriction.coupon_id}`)
            }
          }
        }

        // Remover a categoria duplicada
        await prisma.category.delete({
          where: { id: cat.id }
        })
        
        console.log(`   ✅ Categoria "${cat.name}" removida com sucesso`)
      }
    } else {
      console.log('✅ Nenhuma duplicata encontrada para "Oferta do Dia"')
    }

    // 2. Verificar outras possíveis duplicatas
    console.log('\n2. Verificando outras possíveis duplicatas...')
    
    const allCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })

    const categoryNames = {}
    const duplicates = []

    allCategories.forEach(cat => {
      const normalizedName = cat.name.toLowerCase().trim()
      if (categoryNames[normalizedName]) {
        duplicates.push({
          original: categoryNames[normalizedName],
          duplicate: cat
        })
      } else {
        categoryNames[normalizedName] = cat
      }
    })

    if (duplicates.length > 0) {
      console.log(`⚠️  Encontradas ${duplicates.length} outras duplicata(s):`)
      duplicates.forEach((dup, index) => {
        console.log(`   ${index + 1}. "${dup.original.name}" vs "${dup.duplicate.name}"`)
      })
    } else {
      console.log('✅ Nenhuma outra duplicata encontrada')
    }

    // 3. Mostrar resultado final
    console.log('\n3. Verificação final...')
    const finalCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })

    console.log(`📊 Total de categorias após limpeza: ${finalCategories.length}`)
    
    const ofertaFinal = finalCategories.filter(cat => 
      cat.name.toLowerCase().includes('oferta do dia')
    )
    
    if (ofertaFinal.length === 1) {
      console.log(`✅ "Oferta do Dia" agora é única: "${ofertaFinal[0].name}" (ID: ${ofertaFinal[0].id})`)
    }

    console.log('\n🎉 LIMPEZA DE CATEGORIAS CONCLUÍDA!')

  } catch (error) {
    console.error('❌ ERRO:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

removeDuplicateCategories()