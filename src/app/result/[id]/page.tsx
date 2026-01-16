'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import type { BriefOutput } from '@/lib/schema'

interface BriefRecord {
  id: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  output: BriefOutput | null
  error: string | null
}

function formatCurrency(amount: number): string {
  return '£' + amount.toLocaleString('en-GB')
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[confidence]}`}>
      {confidence.toUpperCase()}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[severity]}`}>
      {severity.charAt(0).toUpperCase()}
    </span>
  )
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [brief, setBrief] = useState<BriefRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        const response = await fetch(`/api/brief/${id}`)
        if (!response.ok) {
          throw new Error('Brief not found')
        }
        const data = await response.json()
        setBrief(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load brief')
      } finally {
        setLoading(false)
      }
    }

    fetchBrief()
  }, [id])

  const handleDownload = () => {
    window.open(`/api/brief/${id}/pdf`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-700 mx-auto mb-4" />
          <p className="text-brand-600">Loading brief...</p>
        </div>
      </div>
    )
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Brief not found'}</p>
          <Link href="/" className="text-brand-700 hover:text-brand-900">
            Return home
          </Link>
        </div>
      </div>
    )
  }

  if (brief.status === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-700 mx-auto mb-4" />
          <p className="text-brand-600">Generating your brief...</p>
          <p className="text-sm text-brand-400 mt-2">This may take up to 30 seconds</p>
        </div>
      </div>
    )
  }

  if (brief.status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-2">Brief generation failed</p>
          <p className="text-sm text-brand-500 mb-4">{brief.error}</p>
          <Link
            href="/create"
            className="inline-block bg-brand-900 text-white px-6 py-2 rounded-lg hover:bg-brand-800"
          >
            Try again
          </Link>
        </div>
      </div>
    )
  }

  const output = brief.output!

  return (
    <div className="min-h-screen flex flex-col bg-brand-50">
      {/* Header */}
      <header className="py-6 px-4 border-b border-brand-200 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-brand-900 hover:text-brand-700">
            Flip Brief Generator
          </Link>
          <button
            onClick={handleDownload}
            className="bg-brand-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-800 transition-colors"
          >
            Download PDF
          </button>
        </div>
      </header>

      {/* Brief Content */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="bg-white rounded-xl shadow-sm border border-brand-200 p-6 mb-6">
            <h1 className="text-2xl font-bold text-brand-900 mb-2">
              Flip Brief — {output.meta.starting_location}
            </h1>
            <p className="text-brand-500">
              {new Date(output.meta.generated_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-sm text-brand-400 mt-2">
              {formatCurrency(output.meta.budget_max)} budget | {output.meta.travel_time_mins}min{' '}
              {output.meta.travel_mode} | {output.meta.property_type} | {output.meta.renovation_scope}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Shortlist */}
              <div className="bg-white rounded-xl shadow-sm border border-brand-200 p-6">
                <h2 className="text-lg font-semibold text-brand-900 mb-4">
                  A) Recommended Shortlist
                </h2>
                <div className="space-y-4">
                  {output.shortlist.map((area) => (
                    <div key={area.rank} className="border-b border-brand-100 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-brand-900">
                          {area.rank}. {area.area_name}
                        </h3>
                        <ConfidenceBadge confidence={area.confidence} />
                      </div>
                      <p className="text-sm text-brand-500 mb-2">
                        {area.postcode_sectors.join(', ')}
                      </p>
                      <ul className="text-sm text-brand-600 mb-2 space-y-1">
                        {area.why_fit.map((reason, i) => (
                          <li key={i}>• {reason}</li>
                        ))}
                      </ul>
                      <p className="text-sm font-medium text-brand-700">
                        Entry: {formatCurrency(area.entry_price_range.low)}-
                        {formatCurrency(area.entry_price_range.high)} → Resale:{' '}
                        {formatCurrency(area.resale_price_range.low)}-
                        {formatCurrency(area.resale_price_range.high)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Numbers */}
              <div className="bg-white rounded-xl shadow-sm border border-brand-200 p-6">
                <h2 className="text-lg font-semibold text-brand-900 mb-4">B) Quick Deal Maths</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-brand-600">Purchase</span>
                    <span className="font-medium">
                      {formatCurrency(output.numbers.purchase_range.low)} -{' '}
                      {formatCurrency(output.numbers.purchase_range.high)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-600">Refurb</span>
                    <span className="font-medium">
                      {formatCurrency(output.numbers.refurb_range.low)} -{' '}
                      {formatCurrency(output.numbers.refurb_range.high)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-600">Other costs</span>
                    <span className="font-medium">
                      {formatCurrency(output.numbers.other_costs_range.low)} -{' '}
                      {formatCurrency(output.numbers.other_costs_range.high)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-brand-600">Net profit</span>
                    <span className="font-semibold text-green-700">
                      {formatCurrency(output.numbers.profit_range.low)} -{' '}
                      {formatCurrency(output.numbers.profit_range.high)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-600">ROI</span>
                    <span className="font-semibold text-green-700">
                      {output.numbers.roi_range_pct.low}% - {output.numbers.roi_range_pct.high}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-brand-100">
                  <p className="text-xs font-medium text-brand-400 mb-2">Assumptions:</p>
                  <ul className="text-xs text-brand-500 space-y-1">
                    {output.numbers.assumptions.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Risks */}
              <div className="bg-white rounded-xl shadow-sm border border-brand-200 p-6">
                <h2 className="text-lg font-semibold text-brand-900 mb-4">C) Risks & Checks</h2>
                <div className="space-y-3">
                  {output.risks_checks.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <SeverityBadge severity={risk.severity} />
                      <div>
                        <p className="font-medium text-brand-900 text-sm">{risk.title}</p>
                        <p className="text-xs text-brand-500">{risk.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Search Box */}
              <div className="bg-white rounded-xl shadow-sm border border-brand-200 p-6">
                <h2 className="text-lg font-semibold text-brand-900 mb-4">D) Search Box</h2>

                <div className="mb-4">
                  <p className="text-sm font-medium text-brand-700 mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {output.search_box.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-brand-100 text-brand-700 text-xs rounded"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-brand-700 mb-2">Must-check filters</p>
                  <ul className="text-sm text-brand-600 space-y-1">
                    {output.search_box.must_have_filters.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>

                {output.search_box.avoid_notes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">Avoid</p>
                    <ul className="text-sm text-brand-600 space-y-1">
                      {output.search_box.avoid_notes.map((n, i) => (
                        <li key={i}>• {n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Next Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-brand-200 p-6">
                <h2 className="text-lg font-semibold text-brand-900 mb-4">E) Next Actions</h2>

                <div className="mb-4">
                  <p className="text-sm font-medium text-brand-700 mb-2">Agent call script</p>
                  <p className="text-sm text-brand-600 bg-brand-50 p-3 rounded italic">
                    "{output.next_actions.agent_call_script}"
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-brand-700 mb-2">Viewing checklist</p>
                  <ul className="text-sm text-brand-600 space-y-1">
                    {output.next_actions.viewing_checklist.map((item, i) => (
                      <li key={i} className="flex items-center">
                        <span className="mr-2">☐</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {output.next_actions.calibration_notes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-brand-700 mb-2">Calibration notes</p>
                    <ul className="text-sm text-brand-500 space-y-1">
                      {output.next_actions.calibration_notes.map((n, i) => (
                        <li key={i}>• {n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">{output.disclaimer}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={handleDownload}
              className="bg-brand-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-800 transition-colors"
            >
              Download PDF
            </button>
            <Link
              href="/create"
              className="bg-white text-brand-700 px-8 py-3 rounded-lg font-medium border border-brand-300 hover:bg-brand-50 transition-colors"
            >
              Create New Brief
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-brand-200 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-brand-400">Created by Property Know How</p>
        </div>
      </footer>
    </div>
  )
}
