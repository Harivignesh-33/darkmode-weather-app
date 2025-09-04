'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Sun, Cloud, CloudRain, Snowflake, Wind, Eye, Droplets, Thermometer, Gauge, CloudDrizzle, CloudSnow, CloudLightning, Navigation } from 'lucide-react';
import { Footer } from './Footer';
import { ThemeToggle } from './ThemeToggle';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  visibility: number;
  wind: {
    speed: number;
    deg?: number;
  };
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
}

interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
}

export const WeatherApp = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('');

  const API_KEY = 'd0a10016d43b599ee1b636c5cacf4354';

  const getWeatherIcon = (iconCode: string, className: string = "w-6 h-6") => {
    const iconMap: { [key: string]: JSX.Element } = {
      '01d': <Sun className={`${className} text-amber-400`} />,
      '01n': <Sun className={`${className} text-slate-300`} />,
      '02d': <Cloud className={`${className} text-gray-400`} />,
      '02n': <Cloud className={`${className} text-slate-400`} />,
      '03d': <Cloud className={`${className} text-gray-500`} />,
      '03n': <Cloud className={`${className} text-slate-500`} />,
      '04d': <Cloud className={`${className} text-gray-600`} />,
      '04n': <Cloud className={`${className} text-slate-600`} />,
      '09d': <CloudDrizzle className={`${className} text-blue-400`} />,
      '09n': <CloudDrizzle className={`${className} text-blue-500`} />,
      '10d': <CloudRain className={`${className} text-blue-500`} />,
      '10n': <CloudRain className={`${className} text-blue-600`} />,
      '11d': <CloudLightning className={`${className} text-purple-500`} />,
      '11n': <CloudLightning className={`${className} text-purple-600`} />,
      '13d': <CloudSnow className={`${className} text-blue-200`} />,
      '13n': <CloudSnow className={`${className} text-blue-300`} />,
      '50d': <Wind className={`${className} text-gray-400`} />,
      '50n': <Wind className={`${className} text-slate-400`} />,
    };
    return iconMap[iconCode] || <Sun className={`${className} text-amber-400`} />;
  };

  const fetchWeatherData = useCallback(async (cityName: string) => {
    if (!API_KEY) {
      setError('API key is not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      
      if (!currentResponse.ok) {
        throw new Error('City not found');
      }

      const currentData = await currentResponse.json();
      setCurrentWeather(currentData);

      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
      );
      
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        setForecast(forecastData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [API_KEY]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeatherData(city.trim());
    }
  };

  // Default weather on load
  useEffect(() => {
    fetchWeatherData('London');
  }, [fetchWeatherData]);

  if (!API_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wind className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">Configuration Required</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Please add your OpenWeatherMap API key to the environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-500">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sun className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                WeatherLux
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Search for a city..."
                    className="w-full pl-12 pr-4 py-4 text-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-lg hover:shadow-xl"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </div>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-800/50 rounded-full flex items-center justify-center">
                  <Wind className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Weather */}
        {currentWeather && (
          <div className="mb-8">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-6 h-6 opacity-80" />
                    <div>
                      <h2 className="text-2xl font-bold">
                        {currentWeather.name}, {currentWeather.sys.country}
                      </h2>
                      <p className="text-blue-100 capitalize">
                        {currentWeather.weather[0].description}
                      </p>
                    </div>
                  </div>
                  {getWeatherIcon(currentWeather.weather[0].icon, "w-16 h-16")}
                </div>
              </div>

              {/* Main Temperature */}
              <div className="p-6">
                <div className="text-center mb-8">
                  <div className="text-6xl font-light text-slate-900 dark:text-white mb-2">
                    {Math.round(currentWeather.main.temp)}°
                  </div>
                  <div className="text-xl text-slate-600 dark:text-slate-400">
                    Feels like {Math.round(currentWeather.main.feels_like)}°C
                  </div>
                </div>

                {/* Weather Details Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-center">
                    <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {currentWeather.main.humidity}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Humidity</div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-center">
                    <Wind className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {currentWeather.wind.speed}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">m/s Wind</div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-center">
                    <Gauge className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {currentWeather.main.pressure}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">hPa</div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-center">
                    <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {Math.round(currentWeather.visibility / 1000)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">km Visibility</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forecasts */}
        {forecast && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Hourly Forecast */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full mr-3"></div>
                Next 24 Hours
              </h3>
              <div className="space-y-3">
                {forecast.list.slice(0, 8).map((item, index) => (
                  <div key={`hour-${index}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-slate-600 dark:text-slate-400 w-16">
                        {new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          hour12: true 
                        })}
                      </div>
                      {getWeatherIcon(item.weather[0].icon, "w-6 h-6")}
                      <div className="flex-1">
                        <div className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                          {item.weather[0].description}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {Math.round(item.main.temp)}°C
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Forecast */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-3"></div>
                5-Day Forecast
              </h3>
              <div className="space-y-4">
                {forecast.list
                  .filter((item, index) => index % 8 === 0)
                  .slice(0, 5)
                  .map((item, index) => (
                  <div key={`day-${index}`} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="text-slate-900 dark:text-white font-medium w-20">
                        {index === 0 ? 'Today' : new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      {getWeatherIcon(item.weather[0].icon, "w-8 h-8")}
                      <div className="flex-1">
                        <div className="text-slate-600 dark:text-slate-400 capitalize">
                          {item.weather[0].description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-slate-900 dark:text-white">
                        {Math.round(item.main.temp)}°C
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {Math.round(item.main.temp_min)}° / {Math.round(item.main.temp_max)}°
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};