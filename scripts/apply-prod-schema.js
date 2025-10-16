const { execSync } = require('child_process');

console.log('🗄️ Aplicando schema no banco de produção...');

try {
  // 1. Copiar schema de produção
  console.log('📋 Copiando schema de produção...');
  execSync('node scripts/setup-prod-schema.js', { stdio: 'inherit' });

  // 2. Gerar cliente Prisma
  console.log('⚙️ Gerando cliente Prisma...');
  execSync('prisma generate', { stdio: 'inherit' });

  // 3. Aplicar schema no banco
  console.log('🗄️ Aplicando schema no banco...');
  execSync('prisma db push --accept-data-loss', { stdio: 'inherit' });

  console.log('✅ Schema aplicado com sucesso no banco de produção!');
} catch (error) {
  console.error('❌ Erro ao aplicar schema:', error.message);
  process.exit(1);
}