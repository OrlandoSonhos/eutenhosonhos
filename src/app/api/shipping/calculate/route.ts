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
      return NextResponse.json(
        { error: cepValidation.error },
        { status: 400 }
      )
    }

    // Calcular peso total e buscar produtos
    let totalWeight = 0
    let totalValue = 0
    
    for (const item of items) {
      const product = await prismaWithRetry.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 404 }
        )
      }

      // Peso estimado: 100g por produto (pode ser configurado no futuro)
      const productWeight = 100 // gramas
      totalWeight += productWeight * item.quantity
      totalValue += (product.price_cents / 100) * item.quantity
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

  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Endpoint para cálculo de frete' })
}