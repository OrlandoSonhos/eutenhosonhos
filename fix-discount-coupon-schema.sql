-- Script para corrigir o schema dos cupons de desconto

-- 1. Criar o enum DiscountCouponType
DO $$ BEGIN
    CREATE TYPE "DiscountCouponType" AS ENUM ('PERMANENT_25', 'SPECIAL_50');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Verificar se a coluna user_id existe na tabela discount_coupon_purchases
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discount_coupon_purchases' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE discount_coupon_purchases ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- 3. Atualizar o tipo da coluna type na tabela DiscountCoupon
-- Primeiro, vamos verificar se existem dados incompatíveis
SELECT DISTINCT type FROM "DiscountCoupon" WHERE type NOT IN ('PERMANENT_25', 'SPECIAL_50');

-- Se não houver dados incompatíveis, podemos alterar o tipo
-- ALTER TABLE "DiscountCoupon" ALTER COLUMN type TYPE "DiscountCouponType" USING type::"DiscountCouponType";