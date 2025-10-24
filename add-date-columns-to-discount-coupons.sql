-- Adicionar colunas de data e limite de uso à tabela discount_coupons
ALTER TABLE discount_coupons 
ADD COLUMN valid_from TIMESTAMP,
ADD COLUMN valid_until TIMESTAMP,
ADD COLUMN max_uses INTEGER;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'discount_coupons' 
AND column_name IN ('valid_from', 'valid_until', 'max_uses');