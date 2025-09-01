"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, Sun, Cloud, CloudRain, Snow, Wind, Eye, Droplets, Thermometer, Gauge, Zap, Clock, ChevronRight } from 'lucide-react';
import { Footer } from './Footer';
import { ThemeToggle } from './ThemeToggle';

interface WeatherData {
  coord: { lat: number; lon: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: { all: number };
  dt: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  name: string;
}

interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: { all: number };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number;
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: { lat: number; lon: number };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

interface UVIndexData {
  value: number;
}

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const getWeatherIcon = (iconCode: string, className = 'w-8 h-8') => {
  const iconMap: { [key: string]: React.ReactNode } = {
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
    '11d': <Zap className={className} />,
    '11n': <Zap className={className} />,
    '13d': <Snow className={className} />,
    '13n': <Snow className={className} />,
    '50d': <Wind className={className} />,
    '50n': <Wind className={className} />,
  };
  
  return iconMap[iconCode] || <Sun className={className} />;
};

export function WeatherApp() {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [uvIndex, setUvIndex] = useState<UVIndexData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMetric, setIsMetric] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const cachedData = useMemo(() => new Map(), []);

  const addToSearchHistory = useCallback((city: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== city.toLowerCase());
      return [city, ...filtered].slice(0, 5);
    });
  }, []);

  const fetchWeatherData = useCallback(async (lat: number, lon: number, cityName?: string) => {
    if (!API_KEY) {
      setError('Weather API key is not configured. Please add NEXT_PUBLIC_OPENWEATHER_API_KEY to your environment variables.');
      return;
    }

    const cacheKey = `${lat},${lon}`;
    const cached = cachedData.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < 600000) { // 10 minutes cache
      setCurrentWeather(cached.weather);
      setForecast(cached.forecast);
      setUvIndex(cached.uv);
      setLastUpdated(new Date(cached.timestamp));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const units = isMetric ? 'metric' : 'imperial';
      
      const [weatherResponse, forecastResponse, uvResponse] = await Promise.all([
        fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`),
        fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`),
        fetch(`${BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
      ]);

      if (!weatherResponse.ok || !forecastResponse.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const weatherData: WeatherData = await weatherResponse.json();
      const forecastData: ForecastData = await forecastResponse.json();
      const uvData: UVIndexData = uvResponse.ok ? await uvResponse.json() : { value: 0 };

      cachedData.set(cacheKey, {
        weather: weatherData,
        forecast: forecastData,
        uv: uvData,
        timestamp: now
      });

      setCurrentWeather(weatherData);
      setForecast(forecastData);
      setUvIndex(uvData);
      setLastUpdated(new Date());

      if (cityName) {
        addToSearchHistory(cityName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, [API_KEY, isMetric, cachedData, addToSearchHistory]);

  const fetchWeatherByCity = useCallback(async (city: string) => {
    if (!API_KEY) {
      setError('Weather API key is not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${isMetric ? 'metric' : 'imperial'}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('City not found. Please check the spelling and try again.');
        }
        throw new Error('Failed to fetch weather data');
      }

      const data: WeatherData = await response.json();
      await fetchWeatherData(data.coord.lat, data.coord.lon, city);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setLoading(false);
    }
  }, [API_KEY, isMetric, fetchWeatherData]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherData(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError('Unable to access your location. Please search for a city instead.');
        setLoading(false);
      }
    );
  }, [fetchWeatherData]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeatherByCity(searchQuery.trim());
    }
  }, [searchQuery, fetchWeatherByCity]);

  const formatTime = useCallback((timestamp: number, timezone: number) => {
    return new Date((timestamp + timezone) * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  }, []);

  const getWindDirection = useCallback((deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(deg / 22.5) % 16];
  }, []);

  const getUVIndexColor = useCallback((uv: number) => {
    if (uv <= 2) return 'bg-green-500';
    if (uv <= 5) return 'bg-yellow-500';
    if (uv <= 7) return 'bg-orange-500';
    if (uv <= 10) return 'bg-red-500';
    return 'bg-purple-500';
  }, []);

  const convertTemp = useCallback((temp: number) => {
    return isMetric ? temp : temp;
  }, [isMetric]);

  const tempUnit = useMemo(() => isMetric ? '°C' : '°F', [isMetric]);
  const speedUnit = useMemo(() => isMetric ? 'm/s' : 'mph', [isMetric]);
  const visibilityUnit = useMemo(() => isMetric ? 'km' : 'mi', [isMetric]);

  const getCurrentDisplayData = useMemo(() => {
    if (!currentWeather) return null;
    
    return {
      temp: Math.round(convertTemp(currentWeather.main.temp)),
      feelsLike: Math.round(convertTemp(currentWeather.main.feels_like)),
      description: currentWeather.weather[0].description,
      icon: currentWeather.weather[0].icon,
      humidity: currentWeather.main.humidity,
      windSpeed: Math.round(currentWeather.wind.speed * (isMetric ? 1 : 2.237)),
      windDirection: getWindDirection(currentWeather.wind.deg),
      pressure: currentWeather.main.pressure,
      visibility: Math.round(currentWeather.visibility / (isMetric ? 1000 : 1609.34)),
      cityName: currentWeather.name,
      country: currentWeather.sys.country,
      sunrise: formatTime(currentWeather.sys.sunrise, currentWeather.timezone),
      sunset: formatTime(currentWeather.sys.sunset, currentWeather.timezone)
    };
  }, [currentWeather, convertTemp, isMetric, getWindDirection, formatTime]);

  const hourlyForecast = useMemo(() => {
    if (!forecast) return [];
    return forecast.list.slice(0, 8).map(item => ({
      time: new Date(item.dt * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      temp: Math.round(convertTemp(item.main.temp)),
      icon: item.weather[0].icon,
      description: item.weather[0].description
    }));
  }, [forecast, convertTemp]);

  const dailyForecast = useMemo(() => {
    if (!forecast) return [];
    
    const daily = forecast.list.filter((_, index) => index % 8 === 0).slice(0, 5);
    return daily.map(item => ({
      date: new Date(item.dt * 1000).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      maxTemp: Math.round(convertTemp(item.main.temp_max)),
      minTemp: Math.round(convertTemp(item.main.temp_min)),
      icon: item.weather[0].icon,
      description: item.weather[0].description
    }));
  }, [forecast, convertTemp]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentWeather) {
        fetchWeatherData(currentWeather.coord.lat, currentWeather.coord.lon);
      }
    }, 600000); // 10 minutes

    return () => clearInterval(interval);
  }, [currentWeather, fetchWeatherData]);

  if (!API_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Weather App</h1>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20 dark:border-gray-700/30">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Configuration Required</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please add your OpenWeatherMap API key to the environment variables as NEXT_PUBLIC_OPENWEATHER_API_KEY
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header with Theme Toggle */}
      <div className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Weather App</h1>
        <ThemeToggle />
      </div>

      <div className="flex-1 container mx-auto px-4 py-6">
        {/* Search Section */}
        <div className="max-w-md mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter city name..."
              className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent shadow-sm"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                className="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Use current location"
              >
                <MapPin className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-md mx-auto mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-sm">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-gray-300 text-sm">Loading weather data...</span>
            </div>
          </div>
        )}

        {/* Weather Display */}
        {currentWeather && getCurrentDisplayData && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Current Weather Card */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {getCurrentDisplayData.cityName}, {getCurrentDisplayData.country}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {lastUpdated?.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => setIsMetric(!isMetric)}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  °{isMetric ? 'C' : 'F'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Main Weather Info */}
                <div className="flex items-center gap-4">
                  <div className="text-6xl">
                    {getWeatherIcon(getCurrentDisplayData.icon, 'w-16 h-16')}
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-gray-800 dark:text-white">
                      {getCurrentDisplayData.temp}{tempUnit}
                    </div>
                    <div className="text-lg text-gray-600 dark:text-gray-300 capitalize">
                      {getCurrentDisplayData.description}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Feels like {getCurrentDisplayData.feelsLike}{tempUnit}
                    </div>
                  </div>
                </div>

                {/* Weather Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wind className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Wind</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      {getCurrentDisplayData.windSpeed} {speedUnit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getCurrentDisplayData.windDirection}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Humidity</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      {getCurrentDisplayData.humidity}%
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Visibility</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      {getCurrentDisplayData.visibility} {visibilityUnit}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Pressure</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      {getCurrentDisplayData.pressure} hPa
                    </div>
                  </div>
                </div>

                {/* Sun Times */}
                <div className="mt-6 flex justify-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Sunrise</div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">{getCurrentDisplayData.sunrise}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Sunset</div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">{getCurrentDisplayData.sunset}</div>
                  </div>
                  {uvIndex && (
                    <div className="text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">UV Index</div>
                      <div className={`text-sm font-semibold px-2 py-1 rounded text-white ${getUVIndexColor(uvIndex.value)}`}>
                        {Math.round(uvIndex.value)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hourly Forecast */}
            {hourlyForecast.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/30">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Hourly Forecast
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {hourlyForecast.map((item, index) => (
                    <div key={index} className="flex-shrink-0 text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 min-w-[100px]">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.time}
                      </div>
                      <div className="text-2xl mb-2">
                        {getWeatherIcon(item.icon, 'w-8 h-8 mx-auto')}
                      </div>
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {item.temp}{tempUnit}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 capitalize">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5-Day Forecast */}
            {dailyForecast.length > 0 && (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 dark:border-gray-700/30">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">5-Day Forecast</h3>
                <div className="space-y-3">
                  {dailyForecast.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getWeatherIcon(day.icon, 'w-8 h-8')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">
                            {day.date}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {day.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800 dark:text-white">
                          {day.maxTemp}° / {day.minTemp}°
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="max-w-md mx-auto mt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Recent Searches</h3>
            <div className="space-y-2">
              {searchHistory.slice(0, 5).map((city, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(city);
                    fetchWeatherByCity(city);
                  }}
                  className="w-full text-left px-4 py-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-lg text-gray-700 dark:text-gray-300 text-sm transition-colors flex items-center justify-between group"
                >
                  <span>{city}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}