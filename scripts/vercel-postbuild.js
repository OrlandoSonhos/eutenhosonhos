const { execSync } = require('child_process');

console.log('🚀 Executando setup para Vercel...');

try {
  // 1. Copiar schema de produção
  console.log('📋 Copiando schema de produção...');
  execSync('node scripts/setup-prod-schema.js', { stdio: 'inherit' });

  // 2. Gerar cliente Prisma
  console.log('⚙️ Gerando cliente Prisma...');
  execSync('prisma generate', { stdio: 'inherit' });

  // 3. Aplicar schema no banco
  console.log('🗄️ Aplicando schema no banco...');
  execSync('prisma db push', { stdio: 'inherit' });

  // 4. Executar seed
  console.log('🌱 Executando seed...');
  execSync('npm run db:seed', { stdio: 'inherit' });

  console.log('✅ Setup da Vercel concluído com sucesso!');
} catch (error) {
  console.error('❌ Erro durante o setup da Vercel:', error.message);
  process.exit(1);
}