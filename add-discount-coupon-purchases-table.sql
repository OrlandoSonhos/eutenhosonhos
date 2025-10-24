-- Criar tabela para cupons de desconto percentual comprados
CREATE TABLE IF NOT EXISTS "discount_coupon_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "discount_coupon_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "discount_coupon_purchases_discount_coupon_id_fkey" FOREIGN KEY ("discount_coupon_id") REFERENCES "discount_coupons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "discount_coupon_purchases_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "discount_coupon_purchases_buyer_id_idx" ON "discount_coupon_purchases"("buyer_id");
CREATE INDEX IF NOT EXISTS "discount_coupon_purchases_discount_coupon_id_idx" ON "discount_coupon_purchases"("discount_coupon_id");
CREATE INDEX IF NOT EXISTS "discount_coupon_purchases_code_idx" ON "discount_coupon_purchases"("code");