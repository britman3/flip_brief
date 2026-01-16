import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { WizardInputSchema } from '@/lib/schema'
import { generateBrief } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const inputResult = WizardInputSchema.safeParse(body)
    if (!inputResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: inputResult.error.issues },
        { status: 400 }
      )
    }

    const input = inputResult.data

    // Create brief record
    const brief = await db.brief.create({
      data: { input },
    })

    // Update status to generating
    await db.brief.update({
      where: { id: brief.id },
      data: { status: 'generating' },
    })

    try {
      // Generate brief using LLM
      const output = await generateBrief(input)

      // Update with completed output
      await db.brief.update({
        where: { id: brief.id },
        data: {
          output,
          status: 'completed',
        },
      })

      return NextResponse.json({
        id: brief.id,
        status: 'completed',
      })
    } catch (llmError) {
      console.error('LLM generation error:', llmError)

      // Update with error status
      await db.brief.update({
        where: { id: brief.id },
        data: {
          status: 'failed',
          error: llmError instanceof Error ? llmError.message : 'Unknown error',
        },
      })

      return NextResponse.json(
        { error: 'Brief generation failed', id: brief.id },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating brief:', error)
    return NextResponse.json({ error: 'Failed to create brief' }, { status: 500 })
  }
}
