-- PARTE 5: Dados Iniciais (Execute após a Parte 4)

-- Inserir categorias
INSERT INTO "categories" ("id", "name", "description", "image_url", "created_at", "updated_at") VALUES
('cat_1', 'Eletrônicos', 'Produtos eletrônicos e gadgets', '/images/electronics.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_2', 'Roupas', 'Vestuário e acessórios', '/images/clothing.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_3', 'Casa e Jardim', 'Produtos para casa e jardim', '/images/home.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_4', 'Livros', 'Livros e materiais educativos', '/images/books.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_5', 'Esportes', 'Equipamentos esportivos', '/images/sports.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Inserir produtos
INSERT INTO "products" ("id", "name", "description", "price", "image_url", "category_id", "stock_quantity", "is_active", "created_at", "updated_at") VALUES
('prod_1', 'Smartphone Galaxy', 'Smartphone Android com 128GB', 899.99, '/images/smartphone.jpg', 'cat_1', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod_2', 'Notebook Dell', 'Notebook Dell Inspiron 15', 1299.99, '/images/notebook.jpg', 'cat_1', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod_3', 'Camiseta Básica', 'Camiseta 100% algodão', 29.99, '/images/tshirt.jpg', 'cat_2', 100, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod_4', 'Jeans Masculino', 'Calça jeans masculina', 79.99, '/images/jeans.jpg', 'cat_2', 75, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod_5', 'Sofá 3 Lugares', 'Sofá confortável para sala', 599.99, '/images/sofa.jpg', 'cat_3', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Inserir usuários
INSERT INTO "users" ("id", "name", "email", "password_hash", "role", "created_at", "updated_at") VALUES
('user_admin', 'Administrador', 'admin@eutenhosonhos.com', '$2a$10$example.hash.for.admin.user', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user_demo', 'Usuário Demo', 'demo@eutenhosonhos.com', '$2a$10$example.hash.for.demo.user', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Inserir cupons
INSERT INTO "coupons" ("id", "code", "discount_percentage", "max_uses", "current_uses", "expires_at", "is_active", "created_at", "updated_at") VALUES
('coupon_1', 'WELCOME10', 10.00, 100, 0, '2024-12-31 23:59:59', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('coupon_2', 'SAVE20', 20.00, 50, 0, '2024-12-31 23:59:59', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);