import sgMail from '@sendgrid/mail'
import nodemailer from 'nodemailer'

// Configurar SendGrid se a API key estiver disponível
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Configurar SMTP como fallback
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailData) {
  try {
    const fromEmail = process.env.SMTP_USER || 'eutenhosonhos5@gmail.com'
    
    // Tentar SendGrid primeiro
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to,
        from: fromEmail,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Remove HTML tags for text version
      })
      console.log('Email enviado via SendGrid para:', to)
      return
    }

    // Fallback para SMTP
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      })
      console.log('Email enviado via SMTP para:', to)
      return
    }

    // Se nenhum método estiver configurado, apenas log
    console.log('Email simulado (configuração não encontrada):', { to, subject })
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    throw error
  }
}

export function generateCouponEmailTemplate(
  userName: string,
  couponCode: string,
  faceValue: string,
  expiresAt: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Seu Cartão - Eu tenho Sonhos</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .coupon { background: white; border: 2px dashed #4f46e5; padding: 20px; margin: 20px 0; text-align: center; }
        .coupon-code { font-size: 24px; font-weight: bold; color: #4f46e5; letter-spacing: 2px; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Eu tenho Sonhos</h1>
          <p>Seu cartão está pronto!</p>
        </div>
        <div class="content">
          <h2>Olá, ${userName}!</h2>
          <p>Parabéns! Sua compra foi processada com sucesso e seu cartão já está disponível.</p>
          
          <div class="coupon">
            <h3>Seu Cartão de Desconto</h3>
            <div class="coupon-code">${couponCode}</div>
            <p><strong>Valor:</strong> ${faceValue}</p>
            <p><strong>Válido até:</strong> ${expiresAt}</p>
          </div>
          
          <p>Para usar seu cartão:</p>
          <ol>
            <li>Adicione produtos ao carrinho</li>
            <li>No checkout, insira o código do cartão</li>
            <li>O desconto será aplicado automaticamente</li>
          </ol>
          
          <p><strong>Importante:</strong> Este cartão pode ser usado apenas uma vez e expira na data indicada.</p>
        </div>
        <div class="footer">
          <p>Obrigado por escolher a Eu tenho Sonhos!</p>
          <p>Em caso de dúvidas, entre em contato conosco:</p>
          <p>📧 eutenhosonhos5@gmail.com</p>
          <p>🌐 ${process.env.APP_URL || 'http://localhost:3000'}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Função auxiliar para enviar e-mail de cupom
export async function sendCouponEmail({
  to,
  couponCode,
  couponValue,
  customerName
}: {
  to: string
  couponCode: string
  couponValue: number // valor em centavos
  customerName: string
}) {
  const faceValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(couponValue / 100)

  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR') // 1 ano

  const html = generateCouponEmailTemplate(
    customerName,
    couponCode,
    faceValue,
    expiresAt
  )

  await sendEmail({
    to,
    subject: `Seu cupom ${couponCode} - Eu tenho Sonhos`,
    html
  })
}

export function generateOrderConfirmationTemplate(
  userName: string,
  orderId: string,
  total: string,
  items: Array<{ name: string; quantity: number; price: string }>
) {
  const itemsHtml = items.map(item => 
    `<tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price}</td>
    </tr>`
  ).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmação de Pedido - Eu tenho Sonhos</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f4f4f4; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Eu tenho Sonhos</h1>
          <p>Pedido Confirmado!</p>
        </div>
        <div class="content">
          <h2>Olá, ${userName}!</h2>
          <p>Seu pedido foi confirmado e está sendo processado.</p>
          
          <p><strong>Número do Pedido:</strong> ${orderId}</p>
          
          <h3>Itens do Pedido:</h3>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Preço</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <p><strong>Total:</strong> ${total}</p>
          
          <p>Você receberá uma nova notificação quando seu pedido for enviado.</p>
        </div>
        <div class="footer">
          <p>Obrigado por escolher a Eu tenho Sonhos!</p>
          <p>📧 eutenhosonhos5@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Função auxiliar para enviar e-mail de confirmação de pedido
export async function sendOrderConfirmationEmail({
  to,
  orderId,
  customerName,
  totalCents,
  items
}: {
  to: string
  orderId: string
  customerName: string
  totalCents: number
  items: Array<{ name: string; quantity: number; priceCents: number }>
}) {
  const total = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(totalCents / 100)

  const formattedItems = items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(item.priceCents / 100)
  }))

  const html = generateOrderConfirmationTemplate(
    customerName,
    orderId,
    total,
    formattedItems
  )

  await sendEmail({
    to,
    subject: `Pedido confirmado #${orderId} - Eu tenho Sonhos`,
    html
  })
}