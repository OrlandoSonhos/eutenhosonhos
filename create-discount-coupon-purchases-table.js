const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Criando tabela discount_coupon_purchases...');
    
    // Criar a tabela
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "discount_coupon_purchases" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "discount_coupon_id" TEXT NOT NULL,
        "buyer_id" TEXT NOT NULL,
        "is_used" BOOLEAN NOT NULL DEFAULT false,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "discount_coupon_purchases_discount_coupon_id_fkey" FOREIGN KEY ("discount_coupon_id") REFERENCES "discount_coupons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "discount_coupon_purchases_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    
    console.log('Tabela criada! Criando índices...');
    
    // Criar índices
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "discount_coupon_purchases_buyer_id_idx" ON "discount_coupon_purchases"("buyer_id")
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "discount_coupon_purchases_discount_coupon_id_idx" ON "discount_coupon_purchases"("discount_coupon_id")
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "discount_coupon_purchases_code_idx" ON "discount_coupon_purchases"("code")
    `);
    
    console.log('Tabela discount_coupon_purchases criada com sucesso com todos os índices!');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();