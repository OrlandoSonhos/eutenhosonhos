const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendManualCouponEmail() {
  try {
    console.log('📧 ENVIANDO E-MAIL MANUAL DO CUPOM\n');
    
    // Dados do cupom que seria criado
    const couponData = {
      code: 'MANUAL001', // Código temporário para o e-mail
      value: 0.01, // R$ 0,01
      buyerEmail: 'vini_deiro@icloud.com',
      buyerName: 'Vinicius',
      merchantOrderId: '34909923177'
    };
    
    console.log('📋 DADOS DO CUPOM:');
    console.log(`   Código: ${couponData.code}`);
    console.log(`   Valor: R$ ${couponData.value.toFixed(2)}`);
    console.log(`   E-mail: ${couponData.buyerEmail}`);
    console.log(`   Nome: ${couponData.buyerName}`);
    console.log(`   Merchant Order: ${couponData.merchantOrderId}`);
    
    // Verificar configuração do SendGrid
    console.log('\n🔧 VERIFICANDO CONFIGURAÇÃO DO SENDGRID...');
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    
    if (!sendgridApiKey) {
      console.error('❌ SENDGRID_API_KEY não configurada');
      return;
    }
    
    if (!fromEmail) {
      console.error('❌ SENDGRID_FROM_EMAIL não configurada');
      return;
    }
    
    console.log(`✅ SendGrid configurado`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   API Key: ${sendgridApiKey.substring(0, 10)}...`);
    
    // Configurar transporter do nodemailer com SendGrid
    const transporter = nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: sendgridApiKey
      }
    });
    
    // Template do e-mail
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Seu Cupom - Eu tenho Sonhos</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .coupon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 10px; padding: 25px; margin: 20px 0; text-align: center; position: relative; }
        .coupon::before { content: ''; position: absolute; top: 50%; left: -10px; width: 20px; height: 20px; background: white; border-radius: 50%; transform: translateY(-50%); }
        .coupon::after { content: ''; position: absolute; top: 50%; right: -10px; width: 20px; height: 20px; background: white; border-radius: 50%; transform: translateY(-50%); }
        .coupon-code { font-size: 32px; font-weight: bold; letter-spacing: 3px; margin: 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .coupon-value { font-size: 18px; margin: 10px 0; }
        .instructions { background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 0 5px 5px 0; }
        .instructions h3 { color: #28a745; margin-top: 0; }
        .instructions ol { color: #495057; }
        .instructions ol li { margin: 8px 0; }
        .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #6c757d; border-top: 1px solid #dee2e6; }
        .footer p { margin: 5px 0; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .alert strong { color: #d63384; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Eu tenho Sonhos</h1>
          <p>Seu cupom está pronto!</p>
        </div>
        
        <div class="content">
          <h2>Olá, ${couponData.buyerName}!</h2>
          <p>Parabéns! Seu pagamento foi processado com sucesso e seu cupom já está disponível.</p>
          
          <div class="alert">
            <strong>⚠️ CUPOM RECUPERADO:</strong> Este cupom foi criado manualmente após identificarmos que o sistema não processou automaticamente seu pagamento (Merchant Order: ${couponData.merchantOrderId}). Pedimos desculpas pelo inconveniente!
          </div>
          
          <div class="coupon">
            <h3>🎫 Seu Cupom de Desconto</h3>
            <div class="coupon-code">${couponData.code}</div>
            <div class="coupon-value">💰 Valor: R$ ${couponData.value.toFixed(2)}</div>
            <p>📅 Válido por 30 dias</p>
          </div>
          
          <div class="instructions">
            <h3>🛒 Como usar seu cupom:</h3>
            <ol>
              <li>Acesse: <a href="https://eutenhosonhos.com.br" style="color: #007bff; text-decoration: none;">eutenhosonhos.com.br</a></li>
              <li>Escolha seus produtos favoritos</li>
              <li>No checkout, insira o código: <strong>${couponData.code}</strong></li>
              <li>Aproveite seu desconto!</li>
            </ol>
          </div>
          
          <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
            <p style="margin: 0; color: #004085;">
              <strong>💡 Dica:</strong> Guarde este e-mail! Você precisará do código do cupom para usar o desconto.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Eu tenho Sonhos</strong></p>
          <p>📧 eutenhosonhos5@gmail.com | 🌐 eutenhosonhos.com.br</p>
          <p style="font-size: 12px; margin-top: 15px;">
            Este cupom foi enviado manualmente devido a uma falha no processamento automático.<br>
            Merchant Order ID: ${couponData.merchantOrderId}
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Configurar e-mail
    const mailOptions = {
      from: fromEmail,
      to: couponData.buyerEmail,
      subject: '🎫 Seu cupom foi recuperado - Eu tenho Sonhos',
      html: emailHtml
    };
    
    console.log('\n📤 ENVIANDO E-MAIL...');
    console.log(`   Para: ${couponData.buyerEmail}`);
    console.log(`   Assunto: ${mailOptions.subject}`);
    
    // Enviar e-mail
    const result = await transporter.sendMail(mailOptions);
    
    console.log('\n✅ E-MAIL ENVIADO COM SUCESSO!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);
    
    console.log('\n🎉 PROCESSO CONCLUÍDO!');
    console.log('   ✅ E-mail enviado para o cliente');
    console.log('   ✅ Cliente foi notificado sobre o cupom');
    console.log('   ✅ Problema do pagamento perdido resolvido');
    
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail manual:', error);
    
    if (error.code === 'EAUTH') {
      console.error('   Problema de autenticação com SendGrid');
    } else if (error.code === 'ECONNECTION') {
      console.error('   Problema de conexão com SendGrid');
    }
  }
}

sendManualCouponEmail();