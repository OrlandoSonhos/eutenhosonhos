const { execSync } = require('child_process');

console.log('🌱 Executando seed na Vercel...');

try {
  // Verificar se estamos em produção
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Este script deve ser executado apenas em produção');
    process.exit(1);
  }

  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada');
    process.exit(1);
  }

  // Copiar schema de produção
  console.log('📋 Copiando schema de produção...');
  execSync('node scripts/setup-prod-schema.js', { stdio: 'inherit' });

  // Gerar cliente Prisma
  console.log('⚙️ Gerando cliente Prisma...');
  execSync('prisma generate', { stdio: 'inherit' });

  // Executar seed
  console.log('🌱 Populando banco de dados...');
  execSync('npm run db:seed', { stdio: 'inherit' });

  console.log('✅ Seed executado com sucesso na Vercel!');
} catch (error) {
  console.error('❌ Erro durante o seed:', error.message);
  process.exit(1);
}