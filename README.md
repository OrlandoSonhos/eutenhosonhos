# Eu Tenho Sonhos - E-commerce Platform

Uma plataforma completa de e-commerce com sistema de cupons pré-pagos, desenvolvida com Next.js 15, Prisma e Mercado Pago.

## 🚀 Funcionalidades

### 🛒 **E-commerce Completo**
- Catálogo de produtos com busca e filtros
- Carrinho de compras
- Checkout integrado com Mercado Pago
- Gestão de pedidos

### 🎫 **Sistema de Cupons**
- Cupons pré-pagos com desconto
- Aplicação automática de descontos
- Gestão de tipos de cupons
- Histórico de uso

### 🔐 **Painel Administrativo**
- Acesso restrito para administradores
- Gestão completa de produtos
- Gestão de cupons e tipos
- Relatórios de vendas e usuários
- Dashboard com estatísticas

### 📧 **Sistema de E-mail**
- Confirmação de pedidos
- Notificações de cupons
- SendGrid + SMTP como fallback

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: Prisma ORM (SQLite dev / PostgreSQL prod)
- **Autenticação**: NextAuth.js
- **Pagamentos**: Mercado Pago
- **E-mail**: SendGrid + Nodemailer
- **Deploy**: Vercel

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL
- Conta no Mercado Pago (sandbox)
- Conta no SendGrid (opcional)

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd ets
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/eutenhosonhos"

# NextAuth
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Mercado Pago (Sandbox)
MP_ACCESS_TOKEN="seu-access-token-aqui"
MP_PUBLIC_KEY="sua-public-key-aqui"
MP_CLIENT_ID="seu-client-id-aqui"
MP_CLIENT_SECRET="seu-client-secret-aqui"

# Super Admin
SUPER_ADMIN_EMAIL="eutenhosonhos5@gmail.com"
SUPER_ADMIN_PASSWORD="Eutenhosonhos2025#"

# Email Configuration
SENDGRID_API_KEY="sua-api-key-aqui"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"

# Application
APP_NAME="Eu tenho Sonhos"
APP_URL="http://localhost:3000"
```

### 4. Configure o banco de dados

```bash
# Gerar o cliente Prisma
npm run db:generate

# Executar migrations
npm run db:migrate

# Popular com dados iniciais
npm run db:seed
```

### 5. Execute o projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 📊 Banco de Dados

### Estrutura das Tabelas

- **users**: Usuários do sistema (clientes e admins)
- **products**: Catálogo de produtos
- **orders**: Pedidos realizados
- **order_items**: Itens dos pedidos
- **coupons**: Cupons pré-pagos
- **payments**: Registros de pagamentos
- **accounts/sessions**: Tabelas do NextAuth

### Scripts Disponíveis

```bash
npm run db:generate    # Gerar cliente Prisma
npm run db:push        # Sincronizar schema com DB
npm run db:migrate     # Executar migrations
npm run db:seed        # Popular com dados iniciais
npm run db:studio      # Abrir Prisma Studio
```

## 🔐 Autenticação

### Usuários Padrão

Após executar o seed, você terá:

- **Super Admin**: `eutenhosonhos5@gmail.com` / `Eutenhosonhos2025#`
- **Usuários de teste**: `joao@exemplo.com`, `maria@exemplo.com`, `pedro@exemplo.com` / `123456`

### Níveis de Acesso

- **USER**: Acesso às funcionalidades de cliente
- **ADMIN**: Acesso ao painel administrativo

## 💳 Sistema de Cupons

### Fluxo de Compra

1. Cliente escolhe tipo de cupom na página `/cupons`
2. Redirecionamento para Mercado Pago
3. Após pagamento aprovado, webhook processa:
   - Gera código único do cupom
   - Salva no banco de dados
   - Envia e-mail com o código
4. Cliente pode usar o cupom em qualquer compra

### Tipos de Cupons Disponíveis

- **R$ 25** por R$ 5 (80% desconto)
- **R$ 50** por R$ 10 (80% desconto)  
- **R$ 100** por R$ 20 (80% desconto)
- **R$ 200** por R$ 40 (80% desconto)

### Validação de Cupons

- Código único de 8 caracteres
- Válido por 30 dias
- Uso único por cupom
- Verificação automática de expiração

## 🛒 Fluxo de Compras

1. **Navegação**: Cliente navega pelos produtos
2. **Carrinho**: Adiciona produtos ao carrinho
3. **Checkout**: Aplica cupom (opcional) e escolhe forma de pagamento
4. **Pagamento**: Processamento via Mercado Pago
5. **Confirmação**: E-mail de confirmação e atualização do estoque

## 📧 Sistema de E-mails

### Tipos de E-mails

- **Cupom Comprado**: Código e instruções de uso
- **Pedido Confirmado**: Detalhes da compra
- **Recuperação de Senha**: Link para redefinir senha

### Configuração

Suporta SendGrid e SMTP. Configure as variáveis de ambiente correspondentes.

## 🔧 Painel Administrativo

Acesse `/admin` com conta de administrador.

### Funcionalidades

- **Dashboard**: Métricas de vendas e cupons
- **Produtos**: CRUD completo
- **Usuários**: Listagem e promoção a admin
- **Cupons**: Gestão e invalidação manual
- **Pedidos**: Acompanhamento de status

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente no painel
3. Configure um banco PostgreSQL (Supabase, Railway, etc.)
4. Deploy automático

### Variáveis de Ambiente para Produção

Certifique-se de configurar todas as variáveis do `.env.example` no painel do Vercel.

## 🧪 Testes

### Executar Testes

```bash
npm test
```

### Cenários de Teste

- Fluxo completo de cupons
- Proteção de rotas admin
- Validação de cupons expirados
- Webhook do Mercado Pago

## 📱 Responsividade

A interface é totalmente responsiva, adaptando-se a:

- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado com navegação colapsável
- **Mobile**: Interface otimizada para toque

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Proteção CSRF
- Rate limiting em rotas sensíveis
- Validação de entrada com Zod
- Sanitização de dados

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**: Verifique a `DATABASE_URL`
2. **Webhook não funciona**: Configure URL pública para desenvolvimento
3. **E-mails não enviados**: Verifique configurações SMTP/SendGrid
4. **Pagamentos não processados**: Verifique credenciais do Mercado Pago

### Logs

Os logs são exibidos no console durante desenvolvimento. Em produção, configure um serviço de logging.

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação
2. Consulte os logs de erro
3. Abra uma issue no repositório

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ para realizar seus sonhos**
