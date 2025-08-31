import WeatherApp from '@/components/WeatherApp';

export default function Page() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">WeatherApp</h1>
            <div className="flex items-center space-x-4">
              {/* Optional utility icons space */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <WeatherApp />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-sm text-zinc-400 text-center">
            Weather data provided by OpenWeatherMap API
          </p>
        </div>
      </footer>
    </div>
  );
}