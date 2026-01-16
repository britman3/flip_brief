/**
 * External data providers for UK property data
 * - Land Registry: Free sold prices (3-month lag)
 * - EPC API: Free energy performance certificates
 */

// Land Registry Price Paid Data API
// Documentation: https://landregistry.data.gov.uk/

export interface SoldPrice {
  address: string
  postcode: string
  price: number
  date: string
  propertyType: string // D=Detached, S=Semi, T=Terraced, F=Flat
  newBuild: boolean
}

export interface PostcodeStats {
  postcode: string
  averagePrice: number
  medianPrice: number
  minPrice: number
  maxPrice: number
  transactionCount: number
  pricesByType: {
    detached?: number
    semi?: number
    terraced?: number
    flat?: number
  }
}

export interface EPCData {
  address: string
  postcode: string
  currentRating: string // A-G
  potentialRating: string
  currentScore: number
  potentialScore: number
  propertyType: string
  builtForm: string
  floorArea: number
  heatingCost: number
  hotWaterCost: number
  lightingCost: number
}

/**
 * Fetch sold prices from Land Registry for a postcode area
 * Uses the Price Paid Data SPARQL endpoint
 */
export async function getLandRegistrySoldPrices(
  postcodePrefix: string,
  propertyType?: 'terraced' | 'semi' | 'detached' | 'flat',
  months: number = 24
): Promise<SoldPrice[]> {
  try {
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Property type filter for SPARQL
    const typeFilter = propertyType
      ? `FILTER(?propertyType = <http://landregistry.data.gov.uk/def/common/${getPropertyTypeUri(propertyType)}>)`
      : ''

    // SPARQL query for Land Registry
    const query = `
      PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
      PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      SELECT ?address ?postcode ?price ?date ?propertyType ?newBuild
      WHERE {
        ?tranx lrppi:pricePaid ?price ;
               lrppi:transactionDate ?date ;
               lrppi:propertyAddress ?addr ;
               lrppi:propertyType ?propertyType ;
               lrppi:newBuild ?newBuild .

        ?addr lrcommon:postcode ?postcode ;
              lrcommon:paon ?paon .

        OPTIONAL { ?addr lrcommon:saon ?saon }
        OPTIONAL { ?addr lrcommon:street ?street }
        OPTIONAL { ?addr lrcommon:town ?town }

        BIND(CONCAT(COALESCE(?saon, ""), " ", ?paon, " ", COALESCE(?street, ""), ", ", COALESCE(?town, "")) AS ?address)

        FILTER(STRSTARTS(?postcode, "${postcodePrefix.toUpperCase()}"))
        FILTER(?date >= "${startDateStr}"^^xsd:date && ?date <= "${endDateStr}"^^xsd:date)
        ${typeFilter}
      }
      ORDER BY DESC(?date)
      LIMIT 100
    `

    const url = `https://landregistry.data.gov.uk/landregistry/query?query=${encodeURIComponent(query)}&output=json`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
      },
    })

    if (!response.ok) {
      console.error('Land Registry API error:', response.status, response.statusText)
      return []
    }

    const data = await response.json()

    if (!data.results?.bindings) {
      return []
    }

    return data.results.bindings.map(
      (row: {
        address?: { value: string }
        postcode?: { value: string }
        price?: { value: string }
        date?: { value: string }
        propertyType?: { value: string }
        newBuild?: { value: string }
      }) => ({
        address: row.address?.value || '',
        postcode: row.postcode?.value || '',
        price: parseInt(row.price?.value || '0'),
        date: row.date?.value || '',
        propertyType: parsePropertyType(row.propertyType?.value || ''),
        newBuild: row.newBuild?.value === 'true',
      })
    )
  } catch (error) {
    console.error('Error fetching Land Registry data:', error)
    return []
  }
}

/**
 * Calculate statistics for a postcode area from sold prices
 */
export function calculatePostcodeStats(
  postcodePrefix: string,
  soldPrices: SoldPrice[]
): PostcodeStats | null {
  if (soldPrices.length === 0) return null

  const prices = soldPrices.map((s) => s.price).sort((a, b) => a - b)
  const sum = prices.reduce((a, b) => a + b, 0)

  // Calculate by property type
  const byType: Record<string, number[]> = {}
  for (const sale of soldPrices) {
    const type = sale.propertyType
    if (!byType[type]) byType[type] = []
    byType[type].push(sale.price)
  }

  const pricesByType: PostcodeStats['pricesByType'] = {}
  if (byType['T']?.length) pricesByType.terraced = average(byType['T'])
  if (byType['S']?.length) pricesByType.semi = average(byType['S'])
  if (byType['D']?.length) pricesByType.detached = average(byType['D'])
  if (byType['F']?.length) pricesByType.flat = average(byType['F'])

  return {
    postcode: postcodePrefix,
    averagePrice: Math.round(sum / prices.length),
    medianPrice: prices[Math.floor(prices.length / 2)],
    minPrice: prices[0],
    maxPrice: prices[prices.length - 1],
    transactionCount: prices.length,
    pricesByType,
  }
}

/**
 * Fetch EPC data for properties in a postcode
 * Requires API key from https://epc.opendatacommunities.org/
 */
export async function getEPCData(postcode: string): Promise<EPCData[]> {
  const apiKey = process.env.EPC_API_KEY

  if (!apiKey) {
    console.warn('EPC_API_KEY not set, skipping EPC data fetch')
    return []
  }

  try {
    // Clean postcode for API
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase()

    const url = `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${cleanPostcode}&size=100`

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
    })

    if (!response.ok) {
      console.error('EPC API error:', response.status, response.statusText)
      return []
    }

    const data = await response.json()

    if (!data.rows) {
      return []
    }

    return data.rows.map(
      (row: {
        address?: string
        postcode?: string
        'current-energy-rating'?: string
        'potential-energy-rating'?: string
        'current-energy-efficiency'?: number
        'potential-energy-efficiency'?: number
        'property-type'?: string
        'built-form'?: string
        'total-floor-area'?: number
        'heating-cost-current'?: number
        'hot-water-cost-current'?: number
        'lighting-cost-current'?: number
      }) => ({
        address: row.address || '',
        postcode: row.postcode || '',
        currentRating: row['current-energy-rating'] || 'Unknown',
        potentialRating: row['potential-energy-rating'] || 'Unknown',
        currentScore: row['current-energy-efficiency'] || 0,
        potentialScore: row['potential-energy-efficiency'] || 0,
        propertyType: row['property-type'] || '',
        builtForm: row['built-form'] || '',
        floorArea: row['total-floor-area'] || 0,
        heatingCost: row['heating-cost-current'] || 0,
        hotWaterCost: row['hot-water-cost-current'] || 0,
        lightingCost: row['lighting-cost-current'] || 0,
      })
    )
  } catch (error) {
    console.error('Error fetching EPC data:', error)
    return []
  }
}

/**
 * Calculate EPC statistics for a postcode
 */
export function calculateEPCStats(epcData: EPCData[]): {
  averageRating: string
  ratingDistribution: Record<string, number>
  averageFloorArea: number
  poorRatingCount: number // D, E, F, G ratings
} | null {
  if (epcData.length === 0) return null

  const ratingDistribution: Record<string, number> = {}
  let totalScore = 0
  let totalArea = 0
  let poorRatingCount = 0

  for (const epc of epcData) {
    // Count ratings
    ratingDistribution[epc.currentRating] = (ratingDistribution[epc.currentRating] || 0) + 1

    // Sum scores
    totalScore += epc.currentScore
    totalArea += epc.floorArea

    // Count poor ratings (D, E, F, G)
    if (['D', 'E', 'F', 'G'].includes(epc.currentRating)) {
      poorRatingCount++
    }
  }

  const avgScore = totalScore / epcData.length

  // Convert average score to rating
  let averageRating = 'G'
  if (avgScore >= 92) averageRating = 'A'
  else if (avgScore >= 81) averageRating = 'B'
  else if (avgScore >= 69) averageRating = 'C'
  else if (avgScore >= 55) averageRating = 'D'
  else if (avgScore >= 39) averageRating = 'E'
  else if (avgScore >= 21) averageRating = 'F'

  return {
    averageRating,
    ratingDistribution,
    averageFloorArea: Math.round(totalArea / epcData.length),
    poorRatingCount,
  }
}

/**
 * Get market data for multiple postcodes
 * Returns aggregated stats useful for brief generation
 */
export async function getMarketDataForAreas(
  postcodes: string[],
  propertyType?: 'terraced' | 'semi' | 'detached' | 'flat'
): Promise<
  Map<
    string,
    {
      soldStats: PostcodeStats | null
      epcStats: ReturnType<typeof calculateEPCStats>
    }
  >
> {
  const results = new Map()

  for (const postcode of postcodes) {
    // Fetch sold prices
    const soldPrices = await getLandRegistrySoldPrices(postcode, propertyType, 24)
    const soldStats = calculatePostcodeStats(postcode, soldPrices)

    // Fetch EPC data
    const epcData = await getEPCData(postcode)
    const epcStats = calculateEPCStats(epcData)

    results.set(postcode, {
      soldStats,
      epcStats,
    })

    // Rate limiting - be nice to the APIs
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return results
}

// Helper functions

function getPropertyTypeUri(type: string): string {
  switch (type) {
    case 'terraced':
      return 'terraced'
    case 'semi':
      return 'semi-detached'
    case 'detached':
      return 'detached'
    case 'flat':
      return 'flat-maisonette'
    default:
      return ''
  }
}

function parsePropertyType(uri: string): string {
  if (uri.includes('terraced')) return 'T'
  if (uri.includes('semi')) return 'S'
  if (uri.includes('detached')) return 'D'
  if (uri.includes('flat') || uri.includes('maisonette')) return 'F'
  return 'O' // Other
}

function average(arr: number[]): number {
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
}
