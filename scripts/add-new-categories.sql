-- Script para adicionar as novas categorias: 'Oferta do Dia' e 'Produtos de Leilão'

-- Inserir categoria 'Oferta do Dia'
INSERT INTO "categories" ("id", "name", "description", "image_url", "created_at", "updated_at") 
VALUES (
  'cat_oferta_dia', 
  'Oferta do Dia', 
  'Produtos em oferta especial do dia com descontos exclusivos', 
  '/images/oferta-do-dia.svg', 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Inserir categoria 'Produtos de Leilão'
INSERT INTO "categories" ("id", "name", "description", "image_url", "created_at", "updated_at") 
VALUES (
  'cat_produtos_leilao', 
  'Produtos de Leilão', 
  'Produtos disponíveis em leilões com descontos especiais', 
  '/images/produtos-leilao.svg', 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Verificar se as categorias foram inseridas
SELECT id, name, description FROM "categories" WHERE id IN ('cat_oferta_dia', 'cat_produtos_leilao');