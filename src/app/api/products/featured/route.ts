import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Primeiro, tenta buscar produtos marcados como 'featured'
    let products = await prisma.product.findMany({
      where: {
        active: true,
        featured: true, // Produtos marcados como em destaque
        stock: {
          gt: 0 // Apenas produtos em estoque
        }
      },
      orderBy: [
        { created_at: 'desc' },
        { id: 'desc' }
      ],
      take: 6,
      select: {
        id: true,
        title: true,
        description: true,
        price_cents: true,
        stock: true,
        images: true,
        active: true,
        featured: true,
        category_id: true,
        is_auction: true,
        auction_date: true,
        auction_end_date: true,
        created_at: true,
        updated_at: true
      }
    })

    // Se não há produtos em destaque, busca os mais recentes
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: {
          active: true,
          stock: {
            gt: 0
          }
        },
        orderBy: [
          { created_at: 'desc' },
          { id: 'desc' }
        ],
        take: 6,
        select: {
          id: true,
          title: true,
          description: true,
          price_cents: true,
          stock: true,
          images: true,
          active: true,
          featured: true,
          category_id: true,
          is_auction: true,
          auction_date: true,
          auction_end_date: true,
          created_at: true,
          updated_at: true
        }
      })
    }

    // Processa as imagens (converte string JSON para array)
    const processedProducts = products.map(product => ({
      ...product,
      images: (() => {
        try {
          return JSON.parse(product.images)
        } catch {
          return []
        }
      })()
    }))

    return NextResponse.json({
      success: true,
      products: processedProducts,
      total: processedProducts.length,
      featured_count: products.filter(p => p.featured).length
    })

  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        products: [],
        total: 0,
        featured_count: 0
      },
      { status: 500 }
    )
  }
}