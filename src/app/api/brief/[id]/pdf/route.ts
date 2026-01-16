import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePdf } from '@/lib/pdf-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const brief = await db.brief.findUnique({
      where: { id },
    })

    if (!brief) {
      return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
    }

    if (brief.status !== 'completed' || !brief.output) {
      return NextResponse.json(
        { error: 'Brief not ready for PDF generation' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBytes = await generatePdf(brief.output)

    // Create filename
    const location = brief.output.meta.starting_location.replace(/[^a-zA-Z0-9]/g, '-')
    const date = new Date().toISOString().split('T')[0]
    const filename = `Flip-Brief-${location}-${date}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
