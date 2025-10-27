const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function createCouponRestrictionsTables() {
  try {
    console.log('🔧 CRIANDO TABELAS DE RESTRIÇÕES DE CUPONS')
    console.log('=' .repeat(50))

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'add-coupon-restrictions-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Lendo arquivo SQL:', sqlPath)

    // Executar comandos SQL na ordem correta
    const commands = [
      {
        name: 'Criar enum RestrictionType',
        sql: `CREATE TYPE "RestrictionType" AS ENUM ('ONLY_CATEGORIES', 'EXCLUDE_CATEGORIES')`
      },
      {
        name: 'Criar tabela CouponCategoryRestriction',
        sql: `CREATE TABLE "CouponCategoryRestriction" (
          "id" TEXT NOT NULL,
          "coupon_id" TEXT NOT NULL,
          "category_id" TEXT NOT NULL,
          "restriction_type" "RestrictionType" NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "CouponCategoryRestriction_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'Criar índice coupon_id',
        sql: `CREATE INDEX "CouponCategoryRestriction_coupon_id_idx" ON "CouponCategoryRestriction"("coupon_id")`
      },
      {
        name: 'Criar índice category_id',
        sql: `CREATE INDEX "CouponCategoryRestriction_category_id_idx" ON "CouponCategoryRestriction"("category_id")`
      },
      {
        name: 'Criar índice único',
        sql: `CREATE UNIQUE INDEX "CouponCategoryRestriction_coupon_id_category_id_key" ON "CouponCategoryRestriction"("coupon_id", "category_id")`
      },
      {
        name: 'Adicionar FK para coupon_id',
        sql: `ALTER TABLE "CouponCategoryRestriction" ADD CONSTRAINT "CouponCategoryRestriction_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "DiscountCoupon"("id") ON DELETE CASCADE ON UPDATE CASCADE`
      },
      {
        name: 'Adicionar FK para category_id',
        sql: `ALTER TABLE "CouponCategoryRestriction" ADD CONSTRAINT "CouponCategoryRestriction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE`
      }
    ]

    console.log(`📝 Executando ${commands.length} comandos SQL`)

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const { name, sql } = commands[i]
      try {
        console.log(`\n${i + 1}. ${name}`)
        console.log(`   ${sql.substring(0, 80)}${sql.length > 80 ? '...' : ''}`)
        
        await prisma.$executeRawUnsafe(sql)
        console.log(`   ✅ Sucesso`)
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('já existe') ||
            error.message.includes('duplicate key') ||
            error.code === '42P07' || // relation already exists
            error.code === '42710') { // object already exists
          console.log(`   ⚠️  Já existe`)
        } else {
          console.log(`   ❌ Erro: ${error.message}`)
          console.log(`   Código: ${error.code}`)
        }
      }
    }

    // Verificar se as tabelas foram criadas
    console.log('\n🔍 VERIFICANDO TABELAS CRIADAS')
    console.log('-'.repeat(30))

    try {
      // Verificar se o enum foi criado
      const enumCheck = await prisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = 'RestrictionType'
        )
      `
      console.log('✅ Enum RestrictionType criado com valores:', enumCheck.map(e => e.enumlabel))
    } catch (error) {
      console.log('❌ Erro ao verificar enum:', error.message)
    }

    try {
      // Verificar se a tabela foi criada
      const tableCheck = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'CouponCategoryRestriction'
        ORDER BY ordinal_position
      `
      console.log('✅ Tabela CouponCategoryRestriction criada com colunas:')
      tableCheck.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`)
      })
    } catch (error) {
      console.log('❌ Erro ao verificar tabela:', error.message)
    }

    console.log('\n🎉 CRIAÇÃO DE TABELAS CONCLUÍDA!')
    console.log('   As tabelas de restrições de cupons foram criadas no banco de dados.')
    console.log('   Agora você pode usar as funcionalidades de restrição por categoria.')

  } catch (error) {
    console.error('❌ ERRO GERAL:', error)
    console.error('   Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  createCouponRestrictionsTables()
}

module.exports = { createCouponRestrictionsTables }