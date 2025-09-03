'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Sun, Cloud, CloudRain, Snowflake, Wind, Eye, Droplets, Thermometer } from 'lucide-react';
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
  };
  sys: {
    country: string;
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

  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  const getWeatherIcon = (iconCode: string, className: string = "w-6 h-6") => {
    const iconMap: { [key: string]: JSX.Element } = {
      '01d': <Sun className={className} />,
      '01n': <Sun className={className} />,
      '02d': <Cloud className={className} />,
      '02n': <Cloud className={className} />,
      '03d': <Cloud className={className} />,
      '03n': <Cloud className={className} />,
      '04d': <Cloud className={className} />,
      '04n': <Cloud className={className} />,
      '09d': <CloudRain className={className} />,
      '09n': <CloudRain className={className} />,
      '10d': <CloudRain className={className} />,
      '10n': <CloudRain className={className} />,
      '11d': <CloudRain className={className} />,
      '11n': <CloudRain className={className} />,
      '13d': <Snowflake className={className} />,
      '13n': <Snowflake className={className} />,
      '50d': <Wind className={className} />,
      '50n': <Wind className={className} />,
    };
    return iconMap[iconCode] || <Sun className={className} />;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Configuration Required</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please add your OpenWeatherMap API key to the environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header with Theme Toggle */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Weather App</h1>
        <ThemeToggle />
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2 max-w-md mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city name..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
              >
                {loading ? 'Loading...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
              {error}
            </div>
          )}

          {/* Current Weather */}
          {currentWeather && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentWeather.name}, {currentWeather.sys.country}
                  </h2>
                </div>
                {getWeatherIcon(currentWeather.weather[0].icon, "w-8 h-8")}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {Math.round(currentWeather.main.temp)}°C
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {currentWeather.weather[0].description}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Feels like</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {Math.round(currentWeather.main.feels_like)}°C
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Humidity</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {currentWeather.main.humidity}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Wind Speed</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {currentWeather.wind.speed} m/s
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5-Hour and 5-Day Forecast */}
          {forecast && (
            <>
              {/* 5-Hour Forecast */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">5-Hour Forecast</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {forecast.list.slice(0, 5).map((item, index) => (
                    <div key={`hour-${index}`} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          hour12: true 
                        })}
                      </div>
                      <div className="flex justify-center mb-2">
                        {getWeatherIcon(item.weather[0].icon, "w-6 h-6")}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {Math.round(item.main.temp)}°C
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {item.weather[0].description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Day Forecast */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">5-Day Forecast</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {forecast.list
                    .filter((item, index) => index % 8 === 0) // Take every 8th item (24 hours apart)
                    .slice(0, 5)
                    .map((item, index) => (
                    <div key={`day-${index}`} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="flex justify-center mb-2">
                        {getWeatherIcon(item.weather[0].icon, "w-6 h-6")}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {Math.round(item.main.temp)}°C
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {item.weather[0].description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};