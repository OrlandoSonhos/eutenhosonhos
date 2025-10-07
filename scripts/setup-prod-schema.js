const fs = require('fs')
const path = require('path')

// Copia o schema de produção para o schema principal
const prodSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prod.prisma')
const mainSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')

try {
  if (fs.existsSync(prodSchemaPath)) {
    const prodSchema = fs.readFileSync(prodSchemaPath, 'utf8')
    fs.writeFileSync(mainSchemaPath, prodSchema)
    console.log('✅ Schema de produção copiado com sucesso!')
  } else {
    console.log('⚠️ Schema de produção não encontrado, usando schema padrão')
  }
} catch (error) {
  console.error('❌ Erro ao copiar schema:', error)
  process.exit(1)
}