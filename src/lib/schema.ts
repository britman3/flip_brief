import { z } from 'zod'

// Input schema for wizard form data
export const WizardInputSchema = z.object({
  // Required fields
  startingLocation: z.string().min(1, 'Starting location is required'),
  maxTravelTime: z.enum(['30', '45', '60', '75', '90']),
  travelMode: z.enum(['drive', 'train', 'either']),
  budgetMax: z.number().positive('Budget must be positive'),
  strategy: z.enum(['flip', 'light_refurb_flip', 'heavy_refurb_flip', 'auction_flip']),
  propertyType: z.enum(['2_bed_terrace', '3_bed_terrace', '2_bed_semi', 'any']),
  targetBuyer: z.enum(['ftb', 'young_family', 'commuter_couple', 'any']),
  renovationScope: z.enum(['cosmetic', 'full_refurb', 'back_to_brick']),
  timeline: z.enum(['8_12_weeks', '3_4_months', '4_6_months']),
  riskTolerance: z.enum(['low', 'medium', 'high']),

  // Optional fields
  preferredCorridors: z.array(z.string()).optional(),
  avoidAreas: z.string().optional(),
  mustHaves: z.array(z.string()).optional(),
  listingLinks: z.array(z.string().url()).max(5).optional(),
})

export type WizardInput = z.infer<typeof WizardInputSchema>

// Price range schema
const PriceRangeSchema = z.object({
  low: z.number(),
  high: z.number(),
})

// Shortlist item schema
const ShortlistItemSchema = z.object({
  rank: z.number().min(1).max(3),
  area_name: z.string(),
  postcode_sectors: z.array(z.string()),
  why_fit: z.array(z.string()).length(2),
  entry_price_range: PriceRangeSchema,
  resale_price_range: PriceRangeSchema,
  exit_speed: z.enum(['fast', 'medium', 'slow']),
  buyer_profile: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.array(z.string()).optional(),
})

// Numbers section schema
const NumbersSchema = z.object({
  purchase_range: PriceRangeSchema,
  refurb_range: PriceRangeSchema,
  other_costs_range: PriceRangeSchema,
  profit_range: PriceRangeSchema,
  roi_range_pct: PriceRangeSchema,
  assumptions: z.array(z.string()),
})

// Risk check item schema
const RiskCheckSchema = z.object({
  title: z.string(),
  detail: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
})

// Search box schema
const SearchBoxSchema = z.object({
  keywords: z.array(z.string()).max(10),
  must_have_filters: z.array(z.string()),
  avoid_notes: z.array(z.string()),
})

// Next actions schema
const NextActionsSchema = z.object({
  agent_call_script: z.string(),
  viewing_checklist: z.array(z.string()).max(6),
  calibration_notes: z.array(z.string()),
})

// Meta schema
const MetaSchema = z.object({
  generated_at: z.string(),
  starting_location: z.string(),
  travel_time_mins: z.number(),
  travel_mode: z.enum(['drive', 'train', 'either']),
  budget_max: z.number(),
  strategy: z.enum(['flip', 'light_refurb_flip', 'heavy_refurb_flip', 'auction_flip']),
  property_type: z.string(),
  target_buyer: z.string(),
  renovation_scope: z.enum(['cosmetic', 'full_refurb', 'back_to_brick']),
  timeline: z.string(),
  risk_tolerance: z.enum(['low', 'medium', 'high']),
})

// Complete brief output schema
export const BriefOutputSchema = z.object({
  meta: MetaSchema,
  shortlist: z.array(ShortlistItemSchema).length(3),
  numbers: NumbersSchema,
  risks_checks: z.array(RiskCheckSchema).max(6),
  search_box: SearchBoxSchema,
  next_actions: NextActionsSchema,
  disclaimer: z.string(),
})

export type BriefOutput = z.infer<typeof BriefOutputSchema>

// Display labels for form options
export const DISPLAY_LABELS = {
  travelTime: {
    '30': '30 mins',
    '45': '45 mins',
    '60': '60 mins',
    '75': '75 mins',
    '90': '90 mins',
  },
  travelMode: {
    drive: 'Drive',
    train: 'Train',
    either: 'Either',
  },
  strategy: {
    flip: 'Flip',
    light_refurb_flip: 'Light refurb flip',
    heavy_refurb_flip: 'Heavy refurb flip',
    auction_flip: 'Auction flip',
  },
  propertyType: {
    '2_bed_terrace': '2-bed terrace',
    '3_bed_terrace': '3-bed terrace',
    '2_bed_semi': '2-bed semi',
    any: 'Any',
  },
  targetBuyer: {
    ftb: 'First-time buyer',
    young_family: 'Young family',
    commuter_couple: 'Commuter couple',
    any: 'Any',
  },
  renovationScope: {
    cosmetic: 'Cosmetic',
    full_refurb: 'Full refurb',
    back_to_brick: 'Back-to-brick',
  },
  timeline: {
    '8_12_weeks': '8-12 weeks',
    '3_4_months': '3-4 months',
    '4_6_months': '4-6 months',
  },
  riskTolerance: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  },
  corridors: {
    herts: 'Hertfordshire',
    beds: 'Bedfordshire',
    bucks: 'Buckinghamshire',
    oxon: 'Oxfordshire',
    essex: 'Essex',
    kent: 'Kent',
    surrey: 'Surrey',
    m1: 'M1 Corridor',
    m4: 'M4 Corridor',
    m40: 'M40 Corridor',
  },
  mustHaves: {
    garden: 'Garden',
    parking: 'Parking',
    walk_to_station: 'Walk to station',
    period_character: 'Period character',
    loft_potential: 'Loft potential',
  },
} as const
