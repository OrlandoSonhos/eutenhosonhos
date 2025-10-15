interface ShippingCalculationParams {
  cepOrigem: string
  cepDestino: string
  peso: number // em gramas
  comprimento: number // em cm
  altura: number // em cm
  largura: number // em cm
  valorDeclarado?: number // em reais
}

interface ShippingOption {
  codigo: string
  nome: string
  prazo: number
  valor: number
  erro?: string
}

interface TrackingEvent {
  data: string
  hora: string
  local: string
  status: string
  observacao?: string
}

interface TrackingInfo {
  codigo: string
  eventos: TrackingEvent[]
  erro?: string
}

// CEP de origem (seu endereço/empresa)
const CEP_ORIGEM = '01310-100' // Exemplo: São Paulo - SP

/**
 * Calcula o frete usando a API dos Correios
 */
export async function calculateShipping(params: ShippingCalculationParams): Promise<ShippingOption[]> {
  try {
    // Usando API pública dos Correios via ViaCEP + Correios
    const response = await fetch('https://viacep.com.br/ws/correios/frete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cepOrigem: params.cepOrigem,
        cepDestino: params.cepDestino,
        peso: params.peso,
        formato: 1, // Caixa/pacote
        comprimento: params.comprimento,
        altura: params.altura,
        largura: params.largura,
        diametro: 0,
        maoPropria: 'N',
        valorDeclarado: params.valorDeclarado || 0,
        avisoRecebimento: 'N'
      })
    })

    if (!response.ok) {
      // Fallback: cálculo estimado baseado na distância
      return await calculateShippingFallback(params.cepDestino)
    }

    const data = await response.json()
    
    return [
      {
        codigo: '04014',
        nome: 'SEDEX',
        prazo: data.sedex?.prazo || 2,
        valor: parseFloat(data.sedex?.valor?.replace(',', '.') || '15.00')
      },
      {
        codigo: '04510',
        nome: 'PAC',
        prazo: data.pac?.prazo || 7,
        valor: parseFloat(data.pac?.valor?.replace(',', '.') || '10.00')
      }
    ]
  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    return await calculateShippingFallback(params.cepDestino)
  }
}

/**
 * Cálculo de frete simplificado (fallback)
 */
async function calculateShippingFallback(cepDestino: string): Promise<ShippingOption[]> {
  try {
    // Buscar informações do CEP para determinar região
    const cepInfo = await fetch(`https://viacep.com.br/ws/${cepDestino}/json/`)
    const data = await cepInfo.json()
    
    if (data.erro) {
      throw new Error('CEP inválido')
    }

    // Cálculo baseado na região
    const estado = data.uf
    let sedexPrice = 15.00
    let pacPrice = 10.00
    let sedexDays = 2
    let pacDays = 7

    // Ajustar preços por região
    const regioesSudeste = ['SP', 'RJ', 'MG', 'ES']
    const regioesSul = ['RS', 'SC', 'PR']
    const regioesNordeste = ['BA', 'SE', 'AL', 'PE', 'PB', 'RN', 'CE', 'PI', 'MA']
    const regioesNorte = ['AM', 'RR', 'AP', 'PA', 'TO', 'RO', 'AC']
    const regioesCentroOeste = ['MT', 'MS', 'GO', 'DF']

    if (regioesSudeste.includes(estado)) {
      // Região Sudeste - mais próximo
      sedexPrice = 12.00
      pacPrice = 8.00
      sedexDays = 1
      pacDays = 5
    } else if (regioesSul.includes(estado)) {
      sedexPrice = 18.00
      pacPrice = 12.00
      sedexDays = 3
      pacDays = 8
    } else if (regioesNordeste.includes(estado)) {
      sedexPrice = 25.00
      pacPrice = 18.00
      sedexDays = 4
      pacDays = 12
    } else if (regioesNorte.includes(estado)) {
      sedexPrice = 35.00
      pacPrice = 25.00
      sedexDays = 6
      pacDays = 15
    } else if (regioesCentroOeste.includes(estado)) {
      sedexPrice = 22.00
      pacPrice = 15.00
      sedexDays = 3
      pacDays = 10
    }

    return [
      {
        codigo: '04014',
        nome: 'SEDEX',
        prazo: sedexDays,
        valor: sedexPrice
      },
      {
        codigo: '04510',
        nome: 'PAC',
        prazo: pacDays,
        valor: pacPrice
      }
    ]
  } catch (error) {
    console.error('Erro no fallback de frete:', error)
    // Valores padrão em caso de erro
    return [
      {
        codigo: '04014',
        nome: 'SEDEX',
        prazo: 3,
        valor: 20.00
      },
      {
        codigo: '04510',
        nome: 'PAC',
        prazo: 10,
        valor: 15.00
      }
    ]
  }
}

/**
 * Rastrear encomenda pelos Correios
 */
export async function trackPackage(trackingCode: string): Promise<TrackingInfo> {
  try {
    // Usando API pública de rastreamento
    const response = await fetch(`https://api.linketrack.com/track/json?user=teste&token=1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f&codigo=${trackingCode}`)
    
    if (!response.ok) {
      throw new Error('Erro ao consultar rastreamento')
    }

    const data = await response.json()
    
    if (data.erro) {
      return {
        codigo: trackingCode,
        eventos: [],
        erro: 'Código de rastreamento não encontrado'
      }
    }

    const eventos = data.eventos?.map((evento: any) => ({
      data: evento.data,
      hora: evento.hora,
      local: evento.local,
      status: evento.status,
      observacao: evento.observacao
    })) || []

    return {
      codigo: trackingCode,
      eventos
    }
  } catch (error) {
    console.error('Erro ao rastrear encomenda:', error)
    return {
      codigo: trackingCode,
      eventos: [],
      erro: 'Erro ao consultar rastreamento. Tente novamente mais tarde.'
    }
  }
}

/**
 * Validar CEP
 */
export async function validateCEP(cep: string): Promise<{ valid: boolean; address?: any; error?: string }> {
  try {
    const cleanCEP = cep.replace(/\D/g, '')
    
    if (cleanCEP.length !== 8) {
      return { valid: false, error: 'CEP deve ter 8 dígitos' }
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
    const data = await response.json()

    if (data.erro) {
      return { valid: false, error: 'CEP não encontrado' }
    }

    return {
      valid: true,
      address: {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
        ibge: data.ibge,
        gia: data.gia,
        ddd: data.ddd,
        siafi: data.siafi
      }
    }
  } catch (error) {
    console.error('Erro ao validar CEP:', error)
    return { valid: false, error: 'Erro ao validar CEP. Tente novamente.' }
  }
}

/**
 * Formatar CEP
 */
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '')
  return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/**
 * Calcular dimensões padrão do produto baseado no peso
 */
export function getDefaultDimensions(weightGrams: number) {
  // Dimensões estimadas baseadas no peso
  if (weightGrams <= 100) {
    return { comprimento: 20, altura: 5, largura: 15 }
  } else if (weightGrams <= 500) {
    return { comprimento: 25, altura: 8, largura: 20 }
  } else if (weightGrams <= 1000) {
    return { comprimento: 30, altura: 10, largura: 25 }
  } else {
    return { comprimento: 40, altura: 15, largura: 30 }
  }
}