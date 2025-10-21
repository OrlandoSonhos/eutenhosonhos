# 🔧 CONFIGURAR SENDGRID NO VERCEL

## Opção 1: Via CLI (Recomendado)
```bash
# Adicionar variável de ambiente no Vercel
vercel env add SENDGRID_API_KEY production

# Quando solicitado, cole sua API Key do SendGrid
```

## Opção 2: Via Dashboard
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto "eutenhosonhos"
3. Vá em: Settings → Environment Variables
4. Clique: "Add New"
5. Name: `SENDGRID_API_KEY`
6. Value: `[SUA_API_KEY_AQUI]`
7. Environment: `Production`
8. Clique: "Save"

## Opção 3: Atualizar .env.production
```bash
# Editar arquivo local
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxx"

# Depois fazer novo deploy
vercel --prod
```

## ✅ Verificar Configuração
Após configurar, execute:
```bash
vercel env ls
```

## 🧪 Testar E-mail
Execute o script de teste:
```bash
node test-coupon-email.js
```