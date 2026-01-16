'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DISPLAY_LABELS } from '@/lib/schema'

type FormData = {
  // Required
  startingLocation: string
  maxTravelTime: string
  travelMode: string
  budgetMax: string
  strategy: string
  propertyType: string
  targetBuyer: string
  renovationScope: string
  timeline: string
  riskTolerance: string
  // Optional
  preferredAreas: string
  avoidAreas: string
  mustHaves: string[]
  listingLinks: string[]
}

const initialFormData: FormData = {
  startingLocation: '',
  maxTravelTime: '',
  travelMode: '',
  budgetMax: '',
  strategy: '',
  propertyType: '',
  targetBuyer: '',
  renovationScope: '',
  timeline: '',
  riskTolerance: '',
  preferredAreas: '',
  avoidAreas: '',
  mustHaves: [],
  listingLinks: ['', '', '', '', ''],
}

export default function CreatePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const totalSteps = 4

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (field: 'mustHaves', value: string) => {
    setFormData((prev) => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v) => v !== value) }
      } else {
        return { ...prev, [field]: [...current, value] }
      }
    })
  }

  const updateListingLink = (index: number, value: string) => {
    setFormData((prev) => {
      const links = [...prev.listingLinks]
      links[index] = value
      return { ...prev, listingLinks: links }
    })
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.startingLocation && formData.maxTravelTime && formData.travelMode
      case 2:
        return formData.budgetMax && formData.strategy && formData.propertyType
      case 3:
        return (
          formData.targetBuyer &&
          formData.renovationScope &&
          formData.timeline &&
          formData.riskTolerance
        )
      case 4:
        return true // Optional fields
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      // Build payload
      const payload = {
        startingLocation: formData.startingLocation,
        maxTravelTime: formData.maxTravelTime,
        travelMode: formData.travelMode,
        budgetMax: parseFloat(formData.budgetMax),
        strategy: formData.strategy,
        propertyType: formData.propertyType,
        targetBuyer: formData.targetBuyer,
        renovationScope: formData.renovationScope,
        timeline: formData.timeline,
        riskTolerance: formData.riskTolerance,
        preferredAreas: formData.preferredAreas || undefined,
        avoidAreas: formData.avoidAreas || undefined,
        mustHaves: formData.mustHaves.length > 0 ? formData.mustHaves : undefined,
        listingLinks: formData.listingLinks.filter((l) => l.trim()) || undefined,
      }

      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate brief')
      }

      const data = await response.json()
      router.push(`/result/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 border-b border-brand-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-brand-900 hover:text-brand-700">
            Flip Brief Generator
          </Link>
          <span className="text-sm text-brand-500">
            Step {step} of {totalSteps}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-brand-100">
        <div className="max-w-4xl mx-auto">
          <div className="h-1 bg-brand-200">
            <div
              className="h-1 bg-brand-700 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Location & Travel */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-brand-900 mb-2">Location & Travel</h2>
              <p className="text-brand-500 mb-8">Where are you based and how far will you go?</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Starting location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.startingLocation}
                    onChange={(e) => updateField('startingLocation', e.target.value)}
                    placeholder="e.g. Harpenden, St Albans, London"
                  />
                  <p className="text-xs text-brand-400 mt-1">
                    Town or area you want to commute from or be based near
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Maximum travel time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.maxTravelTime}
                    onChange={(e) => updateField('maxTravelTime', e.target.value)}
                  >
                    <option value="">Select travel time</option>
                    {Object.entries(DISPLAY_LABELS.travelTime).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Travel mode <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {Object.entries(DISPLAY_LABELS.travelMode).map(([value, label]) => (
                      <label key={value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="travelMode"
                          value={value}
                          checked={formData.travelMode === value}
                          onChange={(e) => updateField('travelMode', e.target.value)}
                          className="mr-2"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Strategy */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-brand-900 mb-2">Budget & Strategy</h2>
              <p className="text-brand-500 mb-8">What's your budget and flip approach?</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Maximum purchase budget (£) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => updateField('budgetMax', e.target.value)}
                    placeholder="e.g. 250000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Flip strategy <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.strategy}
                    onChange={(e) => updateField('strategy', e.target.value)}
                  >
                    <option value="">Select strategy</option>
                    {Object.entries(DISPLAY_LABELS.strategy).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Property type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => updateField('propertyType', e.target.value)}
                  >
                    <option value="">Select property type</option>
                    {Object.entries(DISPLAY_LABELS.propertyType).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Target & Risk */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-brand-900 mb-2">Target & Risk</h2>
              <p className="text-brand-500 mb-8">Who's your buyer and what's your risk appetite?</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Target buyer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.targetBuyer}
                    onChange={(e) => updateField('targetBuyer', e.target.value)}
                  >
                    <option value="">Select target buyer</option>
                    {Object.entries(DISPLAY_LABELS.targetBuyer).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Renovation scope <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.renovationScope}
                    onChange={(e) => updateField('renovationScope', e.target.value)}
                  >
                    <option value="">Select renovation scope</option>
                    {Object.entries(DISPLAY_LABELS.renovationScope).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Timeline <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => updateField('timeline', e.target.value)}
                  >
                    <option value="">Select timeline</option>
                    {Object.entries(DISPLAY_LABELS.timeline).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Risk tolerance <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {Object.entries(DISPLAY_LABELS.riskTolerance).map(([value, label]) => (
                      <label key={value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="riskTolerance"
                          value={value}
                          checked={formData.riskTolerance === value}
                          onChange={(e) => updateField('riskTolerance', e.target.value)}
                          className="mr-2"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Optional Preferences */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-brand-900 mb-2">Optional Preferences</h2>
              <p className="text-brand-500 mb-8">
                Fine-tune your search (all fields optional)
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Preferred areas/corridors
                  </label>
                  <input
                    type="text"
                    value={formData.preferredAreas}
                    onChange={(e) => updateField('preferredAreas', e.target.value)}
                    placeholder="e.g. Greater Manchester, M62 corridor, West Yorkshire"
                  />
                  <p className="text-xs text-brand-400 mt-1">
                    Counties, regions, or transport corridors you want to focus on
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Areas to avoid
                  </label>
                  <input
                    type="text"
                    value={formData.avoidAreas}
                    onChange={(e) => updateField('avoidAreas', e.target.value)}
                    placeholder="e.g. Luton town centre, specific estates"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">Must-haves</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(DISPLAY_LABELS.mustHaves).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex items-center cursor-pointer p-2 rounded border border-brand-200 hover:bg-brand-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.mustHaves.includes(value)}
                          onChange={() => toggleArrayField('mustHaves', value)}
                          className="mr-2"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-2">
                    Listing links (up to 5 URLs for calibration)
                  </label>
                  <div className="space-y-2">
                    {formData.listingLinks.map((link, index) => (
                      <input
                        key={index}
                        type="url"
                        value={link}
                        onChange={(e) => updateListingLink(index, e.target.value)}
                        placeholder={`Listing URL ${index + 1} (optional)`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-brand-400 mt-1">
                    Paste Rightmove/Zoopla links as reference hints (not scraped)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 flex justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-brand-700 hover:text-brand-900 transition-colors"
              >
                Back
              </button>
            ) : (
              <Link
                href="/"
                className="px-6 py-3 text-brand-700 hover:text-brand-900 transition-colors"
              >
                Cancel
              </Link>
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-8 py-3 bg-brand-900 text-white rounded-lg font-medium hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-brand-900 text-white rounded-lg font-medium hover:bg-brand-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Generating Brief...' : 'Generate Brief'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
