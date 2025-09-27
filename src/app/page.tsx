import Link from "next/link";

export default function HomePage() {
  const aggregators = [
    {
      name: "newsapi",
      url: "https://newsapi.org",
      description: "real-time news from 80,000+ sources worldwide",
      features: ["70+ million articles", "50+ languages", "historical data"]
    },
    {
      name: "the guardian",
      url: "https://open-platform.theguardian.com",
      description: "quality journalism from the guardian and the observer",
      features: ["1.9+ million articles", "rich metadata", "full content access"]
    },
    {
      name: "new york times",
      url: "https://developer.nytimes.com",
      description: "trusted news from the new york times",
      features: ["article search api", "semantic api", "archive access"]
    },
    {
      name: "jina ai reader",
      url: "https://jina.ai/reader",
      description: "live web scraping and article extraction from any url",
      features: ["llm-friendly markdown", "real-time scraping", "clean content extraction"]
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-black px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-xl font-normal">lift.news</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-12 border-b border-black pb-8">
          <h2 className="mb-4 text-3xl font-normal">
            a curated feed of positive news from around the world
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-gray-700">
            we aggregate uplifting stories from trusted sources, filtering out negativity to bring you news that inspires hope, celebrates progress, and highlights humanity&apos;s best moments.
          </p>
          <div className="flex gap-4">
            <Link
              href="/news"
              className="inline-block border border-black px-6 py-3 text-sm hover:bg-black hover:text-white transition-colors"
            >
              view news feed
            </Link>
            <Link
              href="/signin"
              className="inline-block border border-black px-6 py-3 text-sm hover:bg-black hover:text-white transition-colors"
            >
              sign in
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-6 text-xl font-normal">our news sources</h3>
          <div className="space-y-px bg-black">
            {aggregators.map((source) => (
              <div
                key={source.name}
                className="bg-white p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="mb-2">
                  <h4 className="text-lg font-normal">{source.name}</h4>
                </div>
                <p className="mb-3 text-sm text-gray-700">{source.description}</p>
                <ul className="mb-2 flex flex-wrap gap-2">
                  {source.features.map((feature) => (
                    <li
                      key={feature}
                      className="border border-black px-2 py-1 text-xs"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline hover:no-underline"
                >
                  {source.url}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-black p-6">
          <h3 className="mb-3 text-lg font-normal">how it works</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li>1. we fetch articles from multiple trusted news sources</li>
            <li>2. content is filtered using positive/negative keyword analysis</li>
            <li>3. articles are categorized and scored for positivity</li>
            <li>4. you get a personalized feed of uplifting news</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
