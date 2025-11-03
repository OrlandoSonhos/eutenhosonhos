const { PrismaClient } = require('@prisma/client');

async function addProductColumns() {
  const prisma = new PrismaClient();

  try {
    console.log('🗄️ Conectando ao banco...');
    console.log('URL do banco:', process.env.DATABASE_URL?.substring(0, 80) + '...');
    await prisma.$connect();
    console.log('✅ Conectado!');

    // Verificar se a tabela products existe
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'products'
    `);

    if (!tables || tables.length === 0) {
      console.error('❌ Tabela products não encontrada no schema public.');
      process.exit(1);
    }

    // Obter colunas existentes
    const existingColumns = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'products'
      ORDER BY column_name
    `);

    const existing = new Set(existingColumns.map((c) => c.column_name));
    console.log('Colunas existentes em products:', Array.from(existing).join(', '));

    const columnsToAdd = [
      { name: 'weight_grams', type: 'INTEGER' },
      { name: 'length_cm', type: 'DOUBLE PRECISION' },
      { name: 'width_cm', type: 'DOUBLE PRECISION' },
      { name: 'height_cm', type: 'DOUBLE PRECISION' },
    ];

    for (const col of columnsToAdd) {
      if (!existing.has(col.name)) {
        const sql = `ALTER TABLE public.products ADD COLUMN ${col.name} ${col.type}`;
        console.log(`➕ Adicionando coluna: ${col.name} (${col.type})`);
        try {
          await prisma.$executeRawUnsafe(sql);
          console.log(`✅ Coluna ${col.name} adicionada!`);
        } catch (err) {
          console.error(`⚠️ Falha ao adicionar ${col.name}:`, err?.message || err);
        }
      } else {
        console.log(`ℹ️ Coluna ${col.name} já existe, pulando.`);
      }
    }

    // Verificação final
    const check = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name IN ('weight_grams','length_cm','width_cm','height_cm')
      ORDER BY column_name
    `);

    console.log('\n🔎 Colunas de frete/dimensões em products:');
    check.forEach((c) => console.log(`- ${c.column_name}: ${c.data_type}`));
    if (check.length === 4) {
      console.log('✅ Todas as colunas necessárias estão presentes.');
    } else {
      console.log('⚠️ Algumas colunas ainda não aparecem; verifique permissões/erros anteriores.');
    }

  } catch (error) {
    console.error('❌ Erro no processo:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addProductColumns();