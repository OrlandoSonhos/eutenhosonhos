-- Script para adicionar colunas de shipping na tabela orders
-- Execute este script no banco de produção

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_cents INTEGER,
ADD COLUMN IF NOT EXISTS shipping_cep VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_complement VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_district VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(255);

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE 'shipping_%'
ORDER BY column_name;