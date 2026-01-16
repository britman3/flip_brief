import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 border-b border-brand-200">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold text-brand-900">Flip Brief Generator</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-brand-900 mb-4">Flip Brief Generator</h2>
            <p className="text-xl text-brand-600 mb-4">
              Get AI-powered location recommendations and deal numbers for your next property flip.
            </p>
            <p className="text-sm text-brand-500">
              Answer a few questions and receive a one-page brief with target areas, deal maths,
              risks, and next actions.
            </p>
          </div>

          {/* CTA Button */}
          <div className="text-center mb-12">
            <Link
              href="/create"
              className="inline-block bg-brand-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-brand-800 transition-colors"
            >
              Create Brief
            </Link>
          </div>

          {/* What you get Card */}
          <div className="bg-white rounded-xl shadow-sm border border-brand-200 p-8 mb-12">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">What you get</h3>
            <div className="space-y-4 text-brand-600">
              <p>
                A one-page PDF brief tailored to your budget, location, and flip strategy. Each
                brief includes:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-brand-400 mr-2">•</span>
                  <span>
                    <strong>Top 3 recommended areas</strong> with postcode sectors and confidence
                    ratings
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-400 mr-2">•</span>
                  <span>
                    <strong>Entry vs resale price ranges</strong> based on your property type and
                    refurb scope
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-400 mr-2">•</span>
                  <span>
                    <strong>Quick deal maths</strong> with profit and ROI estimates
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-400 mr-2">•</span>
                  <span>
                    <strong>Key risks and checks</strong> to investigate before committing
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-brand-400 mr-2">•</span>
                  <span>
                    <strong>Search keywords and agent script</strong> to start sourcing deals
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-brand-700 font-semibold">1</span>
              </div>
              <h4 className="font-medium text-brand-900 mb-1">Enter your criteria</h4>
              <p className="text-sm text-brand-500">
                Location, budget, strategy, timeline, and preferences
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-brand-700 font-semibold">2</span>
              </div>
              <h4 className="font-medium text-brand-900 mb-1">AI generates brief</h4>
              <p className="text-sm text-brand-500">
                Our AI analyzes UK property markets for your criteria
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-brand-700 font-semibold">3</span>
              </div>
              <h4 className="font-medium text-brand-900 mb-1">Download your brief</h4>
              <p className="text-sm text-brand-500">Get a one-page PDF ready to action</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center text-sm text-brand-400">
            <p>
              This tool provides estimates based on AI analysis. Always verify with sold comps and
              professional advice before making offers.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-brand-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-brand-500 mb-1">Created by Property Know How</p>
          <p className="text-sm text-brand-400">Built from real deal analysis, not theory.</p>
        </div>
      </footer>
    </div>
  )
}
