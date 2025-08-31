"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Wind, 
  Thermometer, 
  ThermometerSun, 
  SunMoon, 
  CloudRain, 
  CloudRainWind, 
  CloudDrizzle,
  ChartColumnBig,
  LayoutPanelTop
} from 'lucide-react';
import { toast } from 'sonner';

interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
  current: {
    temp: number;
    feels_like: number;
    condition: string;
    icon: string;
    humidity: number;
    wind_speed: number;
    wind_direction: number;
    pressure: number;
    visibility: number;
    uv: number;
    precipitation: number;
  };
  hourly: Array<{
    time: string;
    temp: number;
    condition: string;
    icon: string;
    precipitation: number;
    wind_speed: number;
  }>;
  daily: Array<{
    date: string;
    temp_min: number;
    temp_max: number;
    condition: string;
    icon: string;
    precipitation: number;
  }>;
  sunrise: string;
  sunset: string;
}

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
  units: string;
}

interface GeoSuggestion {
  name: string;
  country: string;
  lat: number;
  lon: number;
  state?: string;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const DEBOUNCE_DELAY = 500;

export default function WeatherApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const [isOffline, setIsOffline] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // API key check
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  const getCacheKey = useCallback((query: string, units: string) => {
    return `${query}_${units}`;
  }, []);

  const getCachedData = useCallback((query: string, units: string): WeatherData | null => {
    const key = getCacheKey(query, units);
    const cached = cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    
    return null;
  }, [cache, getCacheKey]);

  const setCachedData = useCallback((query: string, units: string, data: WeatherData) => {
    const key = getCacheKey(query, units);
    setCache(prev => new Map(prev).set(key, {
      data,
      timestamp: Date.now(),
      units
    }));
  }, [getCacheKey]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!apiKey || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      const suggestions: GeoSuggestion[] = data.map((item: any) => ({
        name: item.name,
        country: item.country,
        lat: item.lat,
        lon: item.lon,
        state: item.state
      }));

      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  }, [apiKey]);

  const debouncedFetchSuggestions = useCallback(
    debounce(fetchSuggestions, DEBOUNCE_DELAY),
    [fetchSuggestions]
  );

  const fetchWeatherData = useCallback(async (query: string) => {
    if (!apiKey) {
      setError('API key not configured. Please set NEXT_PUBLIC_OPENWEATHER_API_KEY environment variable.');
      return;
    }

    const cachedData = getCachedData(query, units);
    if (cachedData) {
      setWeatherData(cachedData);
      setLastUpdated(new Date());
      toast.success('Weather data loaded from cache');
      return;
    }

    if (isOffline) {
      setError('You are offline. Please check your internet connection.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let lat: number, lon: number, locationName: string, country: string;

      // Check if query is coordinates (lat,lon)
      if (query.includes(',')) {
        const [latStr, lonStr] = query.split(',');
        lat = parseFloat(latStr.trim());
        lon = parseFloat(lonStr.trim());
        
        // Get location name from reverse geocoding
        const geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
        );
        const geoData = await geoResponse.json();
        locationName = geoData[0]?.name || 'Unknown Location';
        country = geoData[0]?.country || '';
      } else {
        // Get coordinates from location name
        const geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`
        );
        const geoData = await geoResponse.json();
        
        if (!geoData.length) {
          throw new Error('Location not found');
        }
        
        lat = geoData[0].lat;
        lon = geoData[0].lon;
        locationName = geoData[0].name;
        country = geoData[0].country;
      }

      // Fetch current weather and forecast
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`)
      ]);

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();

      // Transform API data to our interface
      const weatherData: WeatherData = {
        location: {
          name: locationName,
          country: country,
          lat: lat,
          lon: lon,
          localtime: new Date().toISOString()
        },
        current: {
          temp: currentData.main.temp,
          feels_like: currentData.main.feels_like,
          condition: currentData.weather[0].description,
          icon: currentData.weather[0].icon,
          humidity: currentData.main.humidity,
          wind_speed: units === 'metric' ? 
            Math.round(currentData.wind.speed * 3.6) : // Convert m/s to km/h for metric
            Math.round(currentData.wind.speed * 2.237), // Convert m/s to mph for imperial
          wind_direction: currentData.wind.deg || 0,
          pressure: currentData.main.pressure,
          visibility: Math.round((currentData.visibility || 10000) / 1000),
          uv: 0, // UV data requires separate API call
          precipitation: 0 // Current precipitation not directly available
        },
        hourly: forecastData.list.slice(0, 24).map((item: any) => ({
          time: new Date(item.dt * 1000).toISOString(),
          temp: item.main.temp,
          condition: item.weather[0].description,
          icon: item.weather[0].icon,
          precipitation: Math.round((item.pop || 0) * 100),
          wind_speed: units === 'metric' ? 
            Math.round(item.wind.speed * 3.6) :
            Math.round(item.wind.speed * 2.237)
        })),
        daily: getDailyForecast(forecastData.list),
        sunrise: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        sunset: new Date(currentData.sys.sunset * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      };

      setWeatherData(weatherData);
      setCachedData(query, units, weatherData);
      setLastUpdated(new Date());
      toast.success('Weather data updated');
    } catch (error) {
      console.error('Error fetching weather data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather data. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiKey, units, getCachedData, setCachedData, isOffline]);

  const handleSearch = useCallback(async (query?: string) => {
    const searchTerm = query || searchQuery.trim();
    if (!searchTerm) return;

    setShowSuggestions(false);
    await fetchWeatherData(searchTerm);
  }, [searchQuery, fetchWeatherData]);

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationQuery = `${latitude},${longitude}`;
        await fetchWeatherData(locationQuery);
        toast.success('Location detected');
      },
      (error) => {
        let message = 'Failed to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        toast.error(message);
      }
    );
  }, [fetchWeatherData]);

  const handleUnitsChange = useCallback((checked: boolean) => {
    const newUnits = checked ? 'imperial' : 'metric';
    setUnits(newUnits);
    
    if (weatherData) {
      // Trigger refetch with new units
      fetchWeatherData(searchQuery || `${weatherData.location.lat},${weatherData.location.lon}`);
    }
  }, [weatherData, searchQuery, fetchWeatherData]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      debouncedFetchSuggestions(searchQuery);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, debouncedFetchSuggestions]);

  const getWeatherIcon = useCallback((iconCode: string) => {
    if (iconCode.includes('01')) return <SunMoon className="h-8 w-8" />;
    if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) return <CloudDrizzle className="h-8 w-8" />;
    if (iconCode.includes('09') || iconCode.includes('10')) return <CloudRain className="h-8 w-8" />;
    if (iconCode.includes('11')) return <CloudRainWind className="h-8 w-8" />;
    return <SunMoon className="h-8 w-8" />;
  }, []);

  const formatTemperature = useCallback((temp: number) => {
    return `${Math.round(temp)}°${units === 'metric' ? 'C' : 'F'}`;
  }, [units]);

  const formatTime = useCallback((timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    });
  }, []);

  const formatDay = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short'
    });
  }, []);

  const getCurrentDisplayData = useMemo(() => {
    if (!weatherData) return null;
    
    if (selectedHour !== null && weatherData.hourly[selectedHour]) {
      const hourData = weatherData.hourly[selectedHour];
      return {
        temp: hourData.temp,
        condition: hourData.condition,
        icon: hourData.icon,
        time: formatTime(hourData.time),
        precipitation: hourData.precipitation,
        wind_speed: hourData.wind_speed
      };
    }
    
    return {
      temp: weatherData.current.temp,
      condition: weatherData.current.condition,
      icon: weatherData.current.icon,
      time: 'Now',
      precipitation: weatherData.current.precipitation,
      wind_speed: weatherData.current.wind_speed
    };
  }, [weatherData, selectedHour, formatTime]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md text-center">
          <CardContent>
            <h2 className="text-xl font-heading mb-4">API Key Required</h2>
            <p className="text-muted-foreground mb-4">
              Please set your OpenWeatherMap API key in the NEXT_PUBLIC_OPENWEATHER_API_KEY environment variable.
            </p>
            <Button
              onClick={() => window.open('https://openweathermap.org/api', '_blank')}
              variant="outline"
            >
              Get API Key
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Search & Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="City or ZIP"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-10"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                </div>
              )}
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
                  <CardContent className="p-0">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start p-3 h-auto"
                        onClick={() => {
                          setSearchQuery(suggestion.name);
                          setShowSuggestions(false);
                          handleSearch(suggestion.name);
                        }}
                      >
                        <div className="text-left">
                          <div className="font-medium">{suggestion.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {suggestion.state ? `${suggestion.state}, ` : ''}{suggestion.country}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
            
            <Button onClick={() => handleSearch()} disabled={loading || !searchQuery.trim()}>
              Search
            </Button>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleGeolocation} variant="outline" size="icon">
                  <LayoutPanelTop className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use my location</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">°C</span>
              <Switch
                checked={units === 'imperial'}
                onCheckedChange={handleUnitsChange}
              />
              <span className="text-sm">°F</span>
            </div>

            {lastUpdated && (
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>

          {isOffline && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">
                You are offline. Showing cached data if available.
              </p>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && !weatherData && (
          <Card className="p-8 text-center">
            <CardContent>
              <h2 className="text-xl font-heading mb-4">Something went wrong</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => handleSearch()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!weatherData && !loading && !error && (
          <Card className="p-12 text-center">
            <CardContent>
              <h2 className="text-2xl font-heading mb-4">Search by city or ZIP to begin</h2>
              <p className="text-muted-foreground">
                Get current weather conditions and forecasts for any location
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Current Weather Skeleton */}
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3" />
                    <div className="h-16 bg-muted rounded w-1/2" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Skeleton */}
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/4 mb-4" />
                    <div className="flex space-x-4 overflow-hidden">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex-shrink-0 space-y-2">
                          <div className="h-4 bg-muted rounded w-12" />
                          <div className="h-8 bg-muted rounded w-8" />
                          <div className="h-4 bg-muted rounded w-10" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-1/2" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-4 bg-muted rounded w-12" />
                      <div className="h-6 bg-muted rounded w-6" />
                      <div className="h-4 bg-muted rounded w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weather Data Display */}
        {weatherData && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Current Weather & Hourly */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Weather Card */}
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-2xl font-heading mb-1">
                        {weatherData.location.name}, {weatherData.location.country}
                      </h1>
                      <p className="text-muted-foreground">
                        {getCurrentDisplayData?.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold mb-2">
                        {formatTemperature(getCurrentDisplayData?.temp || 0)}
                      </div>
                      <div className="flex items-center space-x-2">
                        {getWeatherIcon(getCurrentDisplayData?.icon || '')}
                        <span>{getCurrentDisplayData?.condition}</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Feels like</div>
                      <div className="font-semibold">{formatTemperature(weatherData.current.feels_like)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Humidity</div>
                      <div className="font-semibold">{weatherData.current.humidity}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Wind</div>
                      <div className="font-semibold flex items-center justify-center space-x-1">
                        <Wind className="h-4 w-4" style={{ transform: `rotate(${weatherData.current.wind_direction}deg)` }} />
                        <span>{Math.round(getCurrentDisplayData?.wind_speed || 0)} {units === 'metric' ? 'km/h' : 'mph'}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Precipitation</div>
                      <div className="font-semibold">{getCurrentDisplayData?.precipitation || 0}%</div>
                    </div>
                  </div>

                  {/* Secondary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Pressure</div>
                      <div>{weatherData.current.pressure} hPa</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Visibility</div>
                      <div>{weatherData.current.visibility} km</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Sunrise</div>
                      <div>{weatherData.sunrise}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Sunset</div>
                      <div>{weatherData.sunset}</div>
                    </div>
                  </div>

                  {/* Temperature Trend Sparkline */}
                  <div className="mt-6">
                    <svg width="100%" height="40" className="overflow-visible">
                      <polyline
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        points={weatherData.hourly.slice(0, 12).map((hour, i) => 
                          `${(i / 11) * 100},${40 - (hour.temp - Math.min(...weatherData.hourly.slice(0, 12).map(h => h.temp))) / (Math.max(...weatherData.hourly.slice(0, 12).map(h => h.temp)) - Math.min(...weatherData.hourly.slice(0, 12).map(h => h.temp))) * 30}`
                        ).join(' ')}
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              {/* Hourly Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ChartColumnBig className="h-5 w-5" />
                    <span>24-Hour Forecast</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="flex space-x-4 pb-2" style={{ width: 'max-content' }}>
                      {weatherData.hourly.map((hour, index) => (
                        <Button
                          key={index}
                          variant={selectedHour === index ? "default" : "ghost"}
                          className="flex-shrink-0 flex flex-col items-center space-y-2 h-auto p-3 min-w-[80px]"
                          onClick={() => setSelectedHour(selectedHour === index ? null : index)}
                        >
                          <div className="text-xs">{formatTime(hour.time)}</div>
                          {getWeatherIcon(hour.icon)}
                          <div className="text-sm font-semibold">{formatTemperature(hour.temp)}</div>
                          <div className="text-xs text-muted-foreground">{hour.precipitation}%</div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - 5-Day Forecast */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>5-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weatherData.daily.map((day, index) => (
                    <div key={index}>
                      <Button
                        variant="ghost"
                        className="w-full justify-between h-auto p-3"
                        onClick={() => setExpandedDay(expandedDay === index ? null : index)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium w-12 text-left">
                            {formatDay(day.date)}
                          </div>
                          {getWeatherIcon(day.icon)}
                          <div className="text-sm text-muted-foreground">
                            {day.precipitation}%
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {formatTemperature(day.temp_min)}
                          </span>
                          <span className="text-sm font-semibold">
                            {formatTemperature(day.temp_max)}
                          </span>
                        </div>
                      </Button>

                      {/* Precipitation Bar */}
                      <div className="mt-2 px-3">
                        <div className="w-full bg-muted rounded-full h-1">
                          <div
                            className="bg-primary rounded-full h-1 transition-all duration-300"
                            style={{ width: `${Math.min(day.precipitation, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Expanded Day Details */}
                      {expandedDay === index && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                              <span>Condition:</span>
                              <span>{day.condition}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Precipitation:</span>
                              <span>{day.precipitation}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Detailed Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Thermometer className="h-5 w-5" />
                    <span>Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">UV Index</div>
                      <div className="font-semibold">{weatherData.current.uv}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pressure</div>
                      <div className="font-semibold">{weatherData.current.pressure} hPa</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Humidity</div>
                      <div className="font-semibold">{weatherData.current.humidity}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Visibility</div>
                      <div className="font-semibold">{weatherData.current.visibility} km</div>
                    </div>
                  </div>

                  {/* Wind Direction Compass */}
                  <div className="text-center pt-4">
                    <div className="text-sm text-muted-foreground mb-2">Wind Direction</div>
                    <div className="relative w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                      <Wind 
                        className="h-8 w-8 text-primary transition-transform duration-500" 
                        style={{ transform: `rotate(${weatherData.current.wind_direction}deg)` }}
                      />
                    </div>
                    <div className="text-sm font-medium mt-2">
                      {weatherData.current.wind_direction}°
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function getDailyForecast(hourlyList: any[]) {
  const dailyData: { [key: string]: any } = {};
  
  hourlyList.forEach((item: any) => {
    const date = new Date(item.dt * 1000).toDateString();
    
    if (!dailyData[date]) {
      dailyData[date] = {
        date: new Date(item.dt * 1000).toISOString(),
        temps: [],
        conditions: [],
        icons: [],
        precipitations: []
      };
    }
    
    dailyData[date].temps.push(item.main.temp);
    dailyData[date].conditions.push(item.weather[0].description);
    dailyData[date].icons.push(item.weather[0].icon);
    dailyData[date].precipitations.push((item.pop || 0) * 100);
  });
  
  return Object.values(dailyData).slice(0, 5).map((day: any) => ({
    date: day.date,
    temp_min: Math.min(...day.temps),
    temp_max: Math.max(...day.temps),
    condition: day.conditions[0], // Use first condition of the day
    icon: day.icons[0], // Use first icon of the day
    precipitation: Math.max(...day.precipitations)
  }));
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}