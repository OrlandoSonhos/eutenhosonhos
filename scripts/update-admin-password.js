const bcrypt = require('bcryptjs')

async function generateAdminPasswordHash() {
  try {
    console.log('🔐 Gerando hash da senha do admin...')
    
    // Senha que será usada para o admin
    const adminPassword = 'Eutenhosonhos2025#'
    
    // Gerar hash da senha
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    console.log('✅ Hash gerado com sucesso!')
    console.log('📧 Email: admin@eutenhosonhos.com')
    console.log('🔑 Senha:', adminPassword)
    console.log('🔐 Hash:', hashedPassword)
    console.log('')
    console.log('📝 SQL para atualizar no Supabase:')
    console.log(`UPDATE users SET password_hash = '${hashedPassword}' WHERE email = 'admin@eutenhosonhos.com';`)
    
  } catch (error) {
    console.error('❌ Erro ao gerar hash:', error)
  }
}

generateAdminPasswordHash()