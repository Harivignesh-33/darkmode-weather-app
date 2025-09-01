"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, MapPin, Thermometer, Droplets, Wind, Eye, Gauge, Sun, Moon, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export const WeatherApp = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [uvIndex, setUvIndex] = useState<UVIndexData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMetric, setIsMetric] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-8">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Required</h1>
              <p className="text-muted-foreground">
                Please add your OpenWeatherMap API key to the environment variables as NEXT_PUBLIC_OPENWEATHER_API_KEY
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Weather App</h1>
          <p className="text-muted-foreground">Get current weather and forecasts for any location</p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for a city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={loading}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Current Location
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMetric(!isMetric)}
              >
                {isMetric ? '°C' : '°F'}
              </Button>
            </form>

            {searchHistory.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Recent searches:</p>
                <div className="flex gap-2 flex-wrap">
                  {searchHistory.map((city, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => fetchWeatherByCity(city)}
                    >
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading weather data...</p>
            </CardContent>
          </Card>
        )}

        {getCurrentDisplayData && (
          <>
            {/* Current Weather */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {getCurrentDisplayData.cityName}, {getCurrentDisplayData.country}
                    </div>
                    {lastUpdated && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {lastUpdated.toLocaleTimeString()}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-6xl font-bold mb-2">
                        {getCurrentDisplayData.temp}{tempUnit}
                      </div>
                      <p className="text-xl text-muted-foreground capitalize mb-2">
                        {getCurrentDisplayData.description}
                      </p>
                      <p className="text-muted-foreground">
                        Feels like {getCurrentDisplayData.feelsLike}{tempUnit}
                      </p>
                    </div>
                    <img
                      src={`https://openweathermap.org/img/wn/${getCurrentDisplayData.icon}@4x.png`}
                      alt={getCurrentDisplayData.description}
                      className="w-32 h-32"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sun & Moon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="h-5 w-5 text-yellow-500" />
                      <span>Sunrise</span>
                    </div>
                    <span className="font-mono">{getCurrentDisplayData.sunrise}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="h-5 w-5 text-blue-500" />
                      <span>Sunset</span>
                    </div>
                    <span className="font-mono">{getCurrentDisplayData.sunset}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Feels like</p>
                      <p className="text-2xl font-bold">{getCurrentDisplayData.feelsLike}{tempUnit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="text-2xl font-bold">{getCurrentDisplayData.humidity}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Wind className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Wind</p>
                      <p className="text-2xl font-bold">
                        {getCurrentDisplayData.windSpeed} {speedUnit}
                      </p>
                      <p className="text-xs text-muted-foreground">{getCurrentDisplayData.windDirection}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Gauge className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pressure</p>
                      <p className="text-2xl font-bold">{getCurrentDisplayData.pressure}</p>
                      <p className="text-xs text-muted-foreground">hPa</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8 text-gray-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Visibility</p>
                      <p className="text-2xl font-bold">{getCurrentDisplayData.visibility}</p>
                      <p className="text-xs text-muted-foreground">{visibilityUnit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {uvIndex && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Sun className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">UV Index</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{uvIndex.value}</p>
                          <div className={`w-3 h-3 rounded-full ${getUVIndexColor(uvIndex.value)}`} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Forecasts */}
            <Tabs defaultValue="hourly" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hourly">Hourly Forecast</TabsTrigger>
                <TabsTrigger value="daily">5-Day Forecast</TabsTrigger>
              </TabsList>

              <TabsContent value="hourly">
                <Card>
                  <CardHeader>
                    <CardTitle>24-Hour Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                      {hourlyForecast.map((hour, index) => (
                        <div key={index} className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground mb-2">{hour.time}</p>
                          <img
                            src={`https://openweathermap.org/img/wn/${hour.icon}@2x.png`}
                            alt={hour.description}
                            className="w-12 h-12 mx-auto mb-2"
                          />
                          <p className="font-bold">{hour.temp}{tempUnit}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="daily">
                <Card>
                  <CardHeader>
                    <CardTitle>5-Day Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dailyForecast.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-4">
                            <p className="font-medium min-w-20">{day.date}</p>
                            <img
                              src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                              alt={day.description}
                              className="w-12 h-12"
                            />
                            <p className="text-muted-foreground capitalize">{day.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold">{day.maxTemp}{tempUnit}</span>
                            <span className="text-muted-foreground">{day.minTemp}{tempUnit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};