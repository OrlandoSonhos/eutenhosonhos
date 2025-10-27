-- Script para adicionar tabelas de restrições de cupons por categoria
-- Executar diretamente no banco de dados

-- 1. Criar enum para tipos de restrição
CREATE TYPE "RestrictionType" AS ENUM ('ONLY_CATEGORIES', 'EXCLUDE_CATEGORIES');

-- 2. Criar tabela de restrições de cupons por categoria
CREATE TABLE "CouponCategoryRestriction" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "restriction_type" "RestrictionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponCategoryRestriction_pkey" PRIMARY KEY ("id")
);

-- 3. Criar índices para performance
CREATE INDEX "CouponCategoryRestriction_coupon_id_idx" ON "CouponCategoryRestriction"("coupon_id");
CREATE INDEX "CouponCategoryRestriction_category_id_idx" ON "CouponCategoryRestriction"("category_id");

-- 4. Criar índice único para evitar duplicatas
CREATE UNIQUE INDEX "CouponCategoryRestriction_coupon_id_category_id_key" ON "CouponCategoryRestriction"("coupon_id", "category_id");

-- 5. Adicionar foreign keys
ALTER TABLE "CouponCategoryRestriction" ADD CONSTRAINT "CouponCategoryRestriction_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "DiscountCoupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CouponCategoryRestriction" ADD CONSTRAINT "CouponCategoryRestriction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Comentários para documentação
COMMENT ON TABLE "CouponCategoryRestriction" IS 'Tabela para gerenciar restrições de cupons por categoria';
COMMENT ON COLUMN "CouponCategoryRestriction"."restriction_type" IS 'Tipo de restrição: ONLY_CATEGORIES (só pode usar nessas categorias) ou EXCLUDE_CATEGORIES (não pode usar nessas categorias)';