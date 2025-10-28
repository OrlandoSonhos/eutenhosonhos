import { NextRequest, NextResponse } from 'next/server'
import { calculateShipping, validateCEP, getDefaultDimensions } from '@/lib/correios'
import { prismaWithRetry } from '@/lib/prisma-utils'

export async function POST(request: NextRequest) {
  try {
    const { cep, items } = await request.json()

    if (!cep || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'CEP e itens são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar CEP
    const cepValidation = await validateCEP(cep)
    if (!cepValidation.valid) {
      console.error('Erro na validação de CEP:', cepValidation.error)
      return NextResponse.json(
        { error: cepValidation.error || 'CEP inválido' },
        { status: 400 }
      )
    }

    // Log para debug quando usar fallback
    if (cepValidation.address?.localidade === 'Cidade não identificada') {
      console.warn('Usando validação fallback para CEP:', cep)
    }

    // Calcular peso total e buscar produtos
    let totalWeight = 0
    let totalValue = 0
    let hasFreeShipping = false
    
    for (const item of items) {
      const productId = item.productId || item.id
      const product = await prismaWithRetry.product.findUnique({
        where: { id: productId }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Produto ${productId} não encontrado` },
          { status: 404 }
        )
      }

      if (product.free_shipping) {
        hasFreeShipping = true
      }

      // Peso estimado: 100g por produto (pode ser configurado no futuro)
      const productWeight = 100 // gramas
      totalWeight += productWeight * item.quantity
      totalValue += (product.price_cents / 100) * item.quantity
    }

    // Se algum produto tem frete grátis, retornar apenas frete grátis
    if (hasFreeShipping) {
      return NextResponse.json({
        success: true,
        address: cepValidation.address,
        shippingOptions: [
          {
            codigo: 'FREE',
            nome: 'Frete Grátis',
            prazo: 5,
            valor: 0,
            valorCents: 0
          }
        ]
      })
    }

    // Obter dimensões baseadas no peso total
    const dimensions = getDefaultDimensions(totalWeight)

    // Calcular frete
    const shippingOptions = await calculateShipping({
      cepOrigem: '01310-100', // CEP da empresa
      cepDestino: cep,
      peso: totalWeight,
      comprimento: dimensions.comprimento,
      altura: dimensions.altura,
      largura: dimensions.largura,
      valorDeclarado: totalValue
    })

    return NextResponse.json({
      success: true,
      address: cepValidation.address,
      shippingOptions: shippingOptions.map(option => ({
        ...option,
        valorCents: Math.round(option.valor * 100) // Converter para centavos
      }))
    })

  } catch (error: any) {
    console.error('Erro ao calcular frete:', error)
    
    // Verificar se é erro de timeout específico
    if (error?.code === 'UND_ERR_CONNECT_TIMEOUT' || error?.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Serviço de CEP temporariamente indisponível. Tente novamente em alguns instantes.',
          fallback: true
        },
        { status: 503 }
      )
    }
    
    // Verificar se é erro de rede
    if (error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json(
        { 
          error: 'Problema de conexão com o serviço de CEP. Verifique sua conexão e tente novamente.',
          fallback: true
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Endpoint para cálculo de frete' })
}