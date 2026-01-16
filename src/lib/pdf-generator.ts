import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { BriefOutput } from './schema'

// A4 dimensions in points (72 points per inch)
const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 40
const COL_WIDTH = (A4_WIDTH - MARGIN * 3) / 2

// Colors
const BRAND_DARK = rgb(0.06, 0.09, 0.16)
const BRAND_MEDIUM = rgb(0.27, 0.33, 0.42)
const BRAND_LIGHT = rgb(0.58, 0.64, 0.72)
const GREEN = rgb(0.13, 0.55, 0.13)
const AMBER = rgb(0.8, 0.6, 0)
const RED = rgb(0.7, 0.1, 0.1)

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

function formatCurrency(amount: number): string {
  return '£' + amount.toLocaleString('en-GB')
}

function getConfidenceColor(confidence: 'high' | 'medium' | 'low') {
  switch (confidence) {
    case 'high':
      return GREEN
    case 'medium':
      return AMBER
    case 'low':
      return RED
  }
}

function getSeverityColor(severity: 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'high':
      return RED
    case 'medium':
      return AMBER
    case 'low':
      return BRAND_LIGHT
  }
}

export async function generatePdf(brief: BriefOutput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = A4_HEIGHT - MARGIN

  // === HEADER ===
  page.drawText(`Flip Brief - ${brief.meta.starting_location}`, {
    x: MARGIN,
    y,
    size: 18,
    font: helveticaBold,
    color: BRAND_DARK,
  })
  y -= 18

  const dateStr = new Date(brief.meta.generated_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  page.drawText(dateStr, {
    x: MARGIN,
    y,
    size: 9,
    font: helvetica,
    color: BRAND_LIGHT,
  })
  y -= 14

  // Strategy summary line
  const summaryText = `${formatCurrency(brief.meta.budget_max)} budget | ${brief.meta.travel_time_mins}min ${brief.meta.travel_mode} | ${brief.meta.property_type} | ${brief.meta.renovation_scope}`
  page.drawText(truncate(summaryText, 85), {
    x: MARGIN,
    y,
    size: 8,
    font: helvetica,
    color: BRAND_MEDIUM,
  })
  y -= 20

  // Horizontal line
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: BRAND_LIGHT,
  })
  y -= 15

  // === TWO COLUMN LAYOUT ===
  const leftX = MARGIN
  const rightX = MARGIN + COL_WIDTH + MARGIN
  let leftY = y
  let rightY = y

  // === LEFT COLUMN ===

  // Section A: Shortlist
  page.drawText('A) RECOMMENDED SHORTLIST', {
    x: leftX,
    y: leftY,
    size: 9,
    font: helveticaBold,
    color: BRAND_DARK,
  })
  leftY -= 14

  for (const area of brief.shortlist) {
    // Area name with confidence
    const confColor = getConfidenceColor(area.confidence)
    page.drawText(`${area.rank}. ${area.area_name}`, {
      x: leftX,
      y: leftY,
      size: 9,
      font: helveticaBold,
      color: BRAND_DARK,
    })
    page.drawText(`[${area.confidence.toUpperCase()}]`, {
      x: leftX + 140,
      y: leftY,
      size: 7,
      font: helveticaBold,
      color: confColor,
    })
    leftY -= 11

    // Postcode sectors
    page.drawText(area.postcode_sectors.join(', '), {
      x: leftX + 8,
      y: leftY,
      size: 7,
      font: helvetica,
      color: BRAND_MEDIUM,
    })
    leftY -= 10

    // Why fit bullets
    for (const reason of area.why_fit.slice(0, 2)) {
      page.drawText(`- ${truncate(reason, 55)}`, {
        x: leftX + 8,
        y: leftY,
        size: 7,
        font: helvetica,
        color: BRAND_MEDIUM,
      })
      leftY -= 9
    }

    // Price ranges
    const entryRange = `Entry: ${formatCurrency(area.entry_price_range.low)}-${formatCurrency(area.entry_price_range.high)}`
    const resaleRange = `Resale: ${formatCurrency(area.resale_price_range.low)}-${formatCurrency(area.resale_price_range.high)}`
    page.drawText(`${entryRange} -> ${resaleRange}`, {
      x: leftX + 8,
      y: leftY,
      size: 7,
      font: helvetica,
      color: BRAND_DARK,
    })
    leftY -= 12
  }

  leftY -= 8

  // Section B: Quick Deal Maths
  page.drawText('B) QUICK DEAL MATHS', {
    x: leftX,
    y: leftY,
    size: 9,
    font: helveticaBold,
    color: BRAND_DARK,
  })
  leftY -= 12

  const numbers = [
    ['Purchase', brief.numbers.purchase_range],
    ['Refurb', brief.numbers.refurb_range],
    ['Other costs', brief.numbers.other_costs_range],
    ['Net profit', brief.numbers.profit_range],
  ]

  for (const [label, range] of numbers) {
    const r = range as { low: number; high: number }
    page.drawText(`${label}: ${formatCurrency(r.low)} - ${formatCurrency(r.high)}`, {
      x: leftX,
      y: leftY,
      size: 8,
      font: helvetica,
      color: BRAND_MEDIUM,
    })
    leftY -= 10
  }

  page.drawText(
    `ROI: ${brief.numbers.roi_range_pct.low}% - ${brief.numbers.roi_range_pct.high}%`,
    {
      x: leftX,
      y: leftY,
      size: 8,
      font: helveticaBold,
      color: GREEN,
    }
  )
  leftY -= 12

  // Assumptions
  page.drawText('Assumptions:', {
    x: leftX,
    y: leftY,
    size: 7,
    font: helveticaBold,
    color: BRAND_LIGHT,
  })
  leftY -= 9

  for (const assumption of brief.numbers.assumptions.slice(0, 4)) {
    page.drawText(`- ${truncate(assumption, 50)}`, {
      x: leftX,
      y: leftY,
      size: 6,
      font: helvetica,
      color: BRAND_LIGHT,
    })
    leftY -= 8
  }

  leftY -= 8

  // Section C: Risks & Checks
  page.drawText('C) RISKS & CHECKS', {
    x: leftX,
    y: leftY,
    size: 9,
    font: helveticaBold,
    color: BRAND_DARK,
  })
  leftY -= 12

  for (const risk of brief.risks_checks.slice(0, 6)) {
    const sevColor = getSeverityColor(risk.severity)
    page.drawText(`[${risk.severity.charAt(0).toUpperCase()}]`, {
      x: leftX,
      y: leftY,
      size: 7,
      font: helveticaBold,
      color: sevColor,
    })
    page.drawText(truncate(risk.title, 35), {
      x: leftX + 18,
      y: leftY,
      size: 7,
      font: helveticaBold,
      color: BRAND_DARK,
    })
    leftY -= 9
    page.drawText(truncate(risk.detail, 50), {
      x: leftX + 18,
      y: leftY,
      size: 6,
      font: helvetica,
      color: BRAND_MEDIUM,
    })
    leftY -= 10
  }

  // === RIGHT COLUMN ===

  // Section D: Search Box
  page.drawText('D) SEARCH BOX', {
    x: rightX,
    y: rightY,
    size: 9,
    font: helveticaBold,
    color: BRAND_DARK,
  })
  rightY -= 12

  page.drawText('Keywords:', {
    x: rightX,
    y: rightY,
    size: 7,
    font: helveticaBold,
    color: BRAND_MEDIUM,
  })
  rightY -= 9

  // Keywords in two columns
  const keywords = brief.search_box.keywords.slice(0, 10)
  for (let i = 0; i < keywords.length; i += 2) {
    const kw1 = keywords[i] || ''
    const kw2 = keywords[i + 1] || ''
    page.drawText(`- ${truncate(kw1, 22)}`, {
      x: rightX,
      y: rightY,
      size: 6,
      font: helvetica,
      color: BRAND_MEDIUM,
    })
    if (kw2) {
      page.drawText(`- ${truncate(kw2, 22)}`, {
        x: rightX + COL_WIDTH / 2,
        y: rightY,
        size: 6,
        font: helvetica,
        color: BRAND_MEDIUM,
      })
    }
    rightY -= 8
  }
  rightY -= 4

  page.drawText('Must-check filters:', {
    x: rightX,
    y: rightY,
    size: 7,
    font: helveticaBold,
    color: BRAND_MEDIUM,
  })
  rightY -= 9

  for (const filter of brief.search_box.must_have_filters.slice(0, 4)) {
    page.drawText(`- ${truncate(filter, 40)}`, {
      x: rightX,
      y: rightY,
      size: 6,
      font: helvetica,
      color: BRAND_MEDIUM,
    })
    rightY -= 8
  }

  if (brief.search_box.avoid_notes.length > 0) {
    rightY -= 4
    page.drawText('Avoid:', {
      x: rightX,
      y: rightY,
      size: 7,
      font: helveticaBold,
      color: RED,
    })
    rightY -= 9
    for (const note of brief.search_box.avoid_notes.slice(0, 2)) {
      page.drawText(`- ${truncate(note, 40)}`, {
        x: rightX,
        y: rightY,
        size: 6,
        font: helvetica,
        color: BRAND_MEDIUM,
      })
      rightY -= 8
    }
  }

  rightY -= 10

  // Section E: Next Actions
  page.drawText('E) NEXT ACTIONS', {
    x: rightX,
    y: rightY,
    size: 9,
    font: helveticaBold,
    color: BRAND_DARK,
  })
  rightY -= 12

  page.drawText('Agent call script:', {
    x: rightX,
    y: rightY,
    size: 7,
    font: helveticaBold,
    color: BRAND_MEDIUM,
  })
  rightY -= 9

  // Wrap agent script
  const scriptWords = brief.next_actions.agent_call_script.split(' ')
  let scriptLine = ''
  for (const word of scriptWords) {
    if ((scriptLine + ' ' + word).length > 50) {
      page.drawText(scriptLine.trim(), {
        x: rightX,
        y: rightY,
        size: 6,
        font: helvetica,
        color: BRAND_MEDIUM,
      })
      rightY -= 8
      scriptLine = word
    } else {
      scriptLine += ' ' + word
    }
  }
  if (scriptLine.trim()) {
    page.drawText(scriptLine.trim(), {
      x: rightX,
      y: rightY,
      size: 6,
      font: helvetica,
      color: BRAND_MEDIUM,
    })
    rightY -= 8
  }
  rightY -= 4

  page.drawText('Viewing checklist:', {
    x: rightX,
    y: rightY,
    size: 7,
    font: helveticaBold,
    color: BRAND_MEDIUM,
  })
  rightY -= 9

  for (const item of brief.next_actions.viewing_checklist.slice(0, 6)) {
    page.drawText(`[ ] ${truncate(item, 40)}`, {
      x: rightX,
      y: rightY,
      size: 6,
      font: helvetica,
      color: BRAND_MEDIUM,
    })
    rightY -= 8
  }

  if (brief.next_actions.calibration_notes.length > 0) {
    rightY -= 4
    page.drawText('Calibration notes:', {
      x: rightX,
      y: rightY,
      size: 7,
      font: helveticaBold,
      color: BRAND_MEDIUM,
    })
    rightY -= 9
    for (const note of brief.next_actions.calibration_notes.slice(0, 3)) {
      page.drawText(`- ${truncate(note, 40)}`, {
        x: rightX,
        y: rightY,
        size: 6,
        font: helvetica,
        color: BRAND_LIGHT,
      })
      rightY -= 8
    }
  }

  // === FOOTER ===
  const footerY = MARGIN + 20

  page.drawLine({
    start: { x: MARGIN, y: footerY + 10 },
    end: { x: A4_WIDTH - MARGIN, y: footerY + 10 },
    thickness: 0.5,
    color: BRAND_LIGHT,
  })

  page.drawText(brief.disclaimer, {
    x: MARGIN,
    y: footerY,
    size: 7,
    font: helvetica,
    color: BRAND_LIGHT,
  })

  page.drawText('Created by Property Know How', {
    x: MARGIN,
    y: footerY - 10,
    size: 7,
    font: helvetica,
    color: BRAND_LIGHT,
  })

  return pdfDoc.save()
}
