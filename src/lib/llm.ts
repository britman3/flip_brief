import Anthropic from '@anthropic-ai/sdk'
import { type ZodIssue } from 'zod'
import { BriefOutputSchema, type WizardInput, type BriefOutput, DISPLAY_LABELS } from './schema'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are a UK property flip expert generating structured JSON briefs for novice investors.

CRITICAL RULES:
1. Output ONLY valid JSON matching the exact schema provided. No markdown, no explanations.
2. No web browsing - use your knowledge of UK property markets.
3. Use conservative estimates and label confidence levels honestly.
4. Prefer actionable, UK-flip oriented language.
5. All content must fit on one A4 page - keep text concise.
6. Focus on areas within the specified travel time from the starting location.
7. Consider train links for commuter towns if travel mode includes train.
8. Use realistic UK property prices for 2024-2025 market conditions.

SHORTLIST RULES:
- Exactly 3 areas ranked by suitability
- Each area must have exactly 2 "why_fit" bullet points (max 80 chars each)
- Include specific postcode sectors (e.g., OX16, MK41)
- Entry prices should be run-down/tired properties
- Resale prices should be refurbished/done-up condition

NUMBERS RULES:
- Be conservative with profit estimates
- Include realistic stamp duty, legal, finance, and agent costs
- ROI should account for all costs
- List key assumptions clearly

RISKS RULES:
- Maximum 6 risks, prioritized by severity
- Focus on practical concerns: planning, structural, market, timing
- Keep detail text under 100 characters

SEARCH BOX RULES:
- Maximum 10 keywords for Rightmove/Zoopla searches
- Include terms like "modernisation required", "investment opportunity", "in need of updating"

NEXT ACTIONS RULES:
- Agent call script should be 2-3 sentences max
- Viewing checklist maximum 6 items
- Include calibration notes only if listing links were provided`

function buildUserPrompt(input: WizardInput): string {
  const propertyTypeLabel = DISPLAY_LABELS.propertyType[input.propertyType]
  const strategyLabel = DISPLAY_LABELS.strategy[input.strategy]
  const travelModeLabel = DISPLAY_LABELS.travelMode[input.travelMode]
  const targetBuyerLabel = DISPLAY_LABELS.targetBuyer[input.targetBuyer]
  const renovationLabel = DISPLAY_LABELS.renovationScope[input.renovationScope]
  const timelineLabel = DISPLAY_LABELS.timeline[input.timeline]
  const riskLabel = DISPLAY_LABELS.riskTolerance[input.riskTolerance]

  let prompt = `Generate a Flip Brief for the following investor requirements:

REQUIRED INPUTS:
- Starting location: ${input.startingLocation}
- Max travel time: ${input.maxTravelTime} minutes
- Travel mode: ${travelModeLabel}
- Budget (max purchase): £${input.budgetMax.toLocaleString()}
- Strategy: ${strategyLabel}
- Property type: ${propertyTypeLabel}
- Target buyer: ${targetBuyerLabel}
- Renovation scope: ${renovationLabel}
- Timeline: ${timelineLabel}
- Risk tolerance: ${riskLabel}`

  if (input.preferredAreas) {
    prompt += `\n- Preferred areas/corridors: ${input.preferredAreas}`
  }

  if (input.avoidAreas) {
    prompt += `\n- Areas to avoid: ${input.avoidAreas}`
  }

  if (input.mustHaves && input.mustHaves.length > 0) {
    const mustHaveLabels = input.mustHaves
      .map((m) => DISPLAY_LABELS.mustHaves[m as keyof typeof DISPLAY_LABELS.mustHaves] || m)
      .join(', ')
    prompt += `\n- Must-haves: ${mustHaveLabels}`
  }

  if (input.listingLinks && input.listingLinks.length > 0) {
    prompt += `\n- Reference listing links (treat as hints only): ${input.listingLinks.join(', ')}`
  }

  prompt += `

Return a JSON object matching this exact schema:
{
  "meta": {
    "generated_at": "ISO-8601 timestamp",
    "starting_location": "string",
    "travel_time_mins": number,
    "travel_mode": "drive|train|either",
    "budget_max": number,
    "strategy": "flip|light_refurb_flip|heavy_refurb_flip|auction_flip",
    "property_type": "string (display label)",
    "target_buyer": "string (display label)",
    "renovation_scope": "cosmetic|full_refurb|back_to_brick",
    "timeline": "string (display label)",
    "risk_tolerance": "low|medium|high"
  },
  "shortlist": [
    {
      "rank": 1,
      "area_name": "Town name",
      "postcode_sectors": ["XX00"],
      "why_fit": ["Reason 1 (max 80 chars)", "Reason 2 (max 80 chars)"],
      "entry_price_range": {"low": number, "high": number},
      "resale_price_range": {"low": number, "high": number},
      "exit_speed": "fast|medium|slow",
      "buyer_profile": "Description of likely buyer",
      "confidence": "high|medium|low",
      "notes": ["Optional notes"]
    }
  ],
  "numbers": {
    "purchase_range": {"low": number, "high": number},
    "refurb_range": {"low": number, "high": number},
    "other_costs_range": {"low": number, "high": number},
    "profit_range": {"low": number, "high": number},
    "roi_range_pct": {"low": number, "high": number},
    "assumptions": ["Assumption 1", "Assumption 2"]
  },
  "risks_checks": [
    {"title": "Risk title", "detail": "Brief detail (max 100 chars)", "severity": "low|medium|high"}
  ],
  "search_box": {
    "keywords": ["keyword1", "keyword2"],
    "must_have_filters": ["filter1", "filter2"],
    "avoid_notes": ["note1"]
  },
  "next_actions": {
    "agent_call_script": "2-3 sentence script for calling agents",
    "viewing_checklist": ["Item 1", "Item 2"],
    "calibration_notes": ["Note if listing links provided"]
  },
  "disclaimer": "Estimates only. Verify sold comps + costs before offering."
}

IMPORTANT: Return ONLY the JSON object, no other text.`

  return prompt
}

export async function generateBrief(input: WizardInput): Promise<BriefOutput> {
  const userPrompt = buildUserPrompt(input)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: SYSTEM_PROMPT,
  })

  // Extract text content from response
  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in LLM response')
  }

  let jsonString = textContent.text.trim()

  // Remove markdown code blocks if present
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7)
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.slice(3)
  }
  if (jsonString.endsWith('```')) {
    jsonString = jsonString.slice(0, -3)
  }
  jsonString = jsonString.trim()

  // Parse JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    console.error('Raw response:', textContent.text)
    throw new Error('Failed to parse LLM response as JSON')
  }

  // Validate against schema
  const result = BriefOutputSchema.safeParse(parsed)
  if (!result.success) {
    console.error('Schema validation errors:', result.error.issues)
    // Attempt repair
    return await repairBrief(parsed, result.error.issues)
  }

  return result.data
}

async function repairBrief(
  invalidJson: unknown,
  issues: ZodIssue[]
): Promise<BriefOutput> {
  const errorSummary = issues
    .slice(0, 5)
    .map((e) => `- Path: ${e.path.join('.')}, Error: ${e.message}`)
    .join('\n')

  const repairPrompt = `The following JSON has validation errors. Fix ONLY the errors and return valid JSON.

ERRORS:
${errorSummary}

INVALID JSON:
${JSON.stringify(invalidJson, null, 2)}

Return ONLY the corrected JSON, no explanations.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: repairPrompt,
      },
    ],
    system: 'You are a JSON repair assistant. Fix validation errors and return only valid JSON.',
  })

  const textContent = response.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in repair response')
  }

  let jsonString = textContent.text.trim()
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7)
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.slice(3)
  }
  if (jsonString.endsWith('```')) {
    jsonString = jsonString.slice(0, -3)
  }
  jsonString = jsonString.trim()

  const parsed = JSON.parse(jsonString)
  const result = BriefOutputSchema.safeParse(parsed)

  if (!result.success) {
    console.error('Repair failed, errors:', result.error.issues)
    throw new Error('Failed to repair brief JSON after second attempt')
  }

  return result.data
}
