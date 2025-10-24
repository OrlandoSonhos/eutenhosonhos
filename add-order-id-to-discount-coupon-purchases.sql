-- Script para adicionar coluna order_id à tabela discount_coupon_purchases
-- Este script corrige o erro: "A coluna `discount_coupon_purchases.order_id` não existe no banco de dados atual"

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    -- Verificar se a coluna order_id já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'discount_coupon_purchases' 
        AND column_name = 'order_id'
    ) THEN
        -- Adicionar a coluna order_id
        ALTER TABLE discount_coupon_purchases 
        ADD COLUMN order_id VARCHAR(255);
        
        RAISE NOTICE 'Coluna order_id adicionada à tabela discount_coupon_purchases';
    ELSE
        RAISE NOTICE 'Coluna order_id já existe na tabela discount_coupon_purchases';
    END IF;
    
    -- Verificar se a foreign key constraint já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'discount_coupon_purchases' 
        AND constraint_name = 'discount_coupon_purchases_order_id_fkey'
    ) THEN
        -- Adicionar a foreign key constraint
        ALTER TABLE discount_coupon_purchases 
        ADD CONSTRAINT discount_coupon_purchases_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id);
        
        RAISE NOTICE 'Foreign key constraint adicionada para order_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint para order_id já existe';
    END IF;
END $$;

-- Verificar a estrutura da tabela após as alterações
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'discount_coupon_purchases' 
ORDER BY ordinal_position;