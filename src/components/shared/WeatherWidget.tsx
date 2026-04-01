"use client";

import { useState, useEffect } from "react";

const WMO: Record<number, { label: string; emoji: string }> = {
  0:  { label: "Clear",          emoji: "☀️" },
  1:  { label: "Mostly clear",   emoji: "🌤️" },
  2:  { label: "Partly cloudy",  emoji: "⛅" },
  3:  { label: "Overcast",       emoji: "☁️" },
  45: { label: "Foggy",          emoji: "🌫️" },
  48: { label: "Icy fog",        emoji: "🌫️" },
  51: { label: "Light drizzle",  emoji: "🌦️" },
  53: { label: "Drizzle",        emoji: "🌦️" },
  55: { label: "Heavy drizzle",  emoji: "🌧️" },
  61: { label: "Light rain",     emoji: "🌧️" },
  63: { label: "Rain",           emoji: "🌧️" },
  65: { label: "Heavy rain",     emoji: "🌧️" },
  71: { label: "Light snow",     emoji: "🌨️" },
  73: { label: "Snow",           emoji: "❄️" },
  75: { label: "Heavy snow",     emoji: "❄️" },
  80: { label: "Showers",        emoji: "🌦️" },
  81: { label: "Rain showers",   emoji: "🌧️" },
  82: { label: "Heavy showers",  emoji: "⛈️" },
  95: { label: "Thunderstorm",   emoji: "⛈️" },
  99: { label: "Hail storm",     emoji: "⛈️" },
};

function wmoInfo(code: number) {
  return WMO[code] ?? WMO[Math.floor(code / 10) * 10] ?? { label: "Unknown", emoji: "🌡️" };
}

const CACHE_KEY = "nova_weather_cache";
const CACHE_TTL = 30 * 60 * 1000; // 30 min

type WeatherData = {
  city: string;
  temp: number;
  feelsLike: number;
  windSpeed: number;
  weatherCode: number;
  fetchedAt: number;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "denied" }
  | { status: "error" }
  | { status: "ok"; data: WeatherData };

export function WeatherWidget() {
  const [state, setState] = useState<State>({ status: "idle" });

  const fetchWeather = (forceRefresh = false) => {
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: WeatherData = JSON.parse(cached);
          if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
            setState({ status: "ok", data: parsed });
            return;
          }
        }
      } catch { /* ignore */ }
    }

    if (!navigator.geolocation) {
      setState({ status: "error" });
      return;
    }

    setState({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const [weatherRes, geoRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
          ]);
          const weatherJson = await weatherRes.json();
          const geoJson     = await geoRes.json();

          const c = weatherJson.current;
          const city =
            geoJson.address?.city ||
            geoJson.address?.town ||
            geoJson.address?.village ||
            geoJson.address?.county ||
            "Your location";

          const data: WeatherData = {
            city,
            temp:        Math.round(c.temperature_2m),
            feelsLike:   Math.round(c.apparent_temperature),
            windSpeed:   Math.round(c.wind_speed_10m),
            weatherCode: c.weather_code,
            fetchedAt:   Date.now(),
          };

          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          setState({ status: "ok", data });
        } catch {
          setState({ status: "error" });
        }
      },
      (err) => {
        setState({ status: err.code === err.PERMISSION_DENIED ? "denied" : "error" });
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchWeather();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden rounded-2xl border border-nova-border bg-white shadow-card">
        <div className="text-center">
          <p className="text-2xl mb-1">{state.status === "loading" ? "⏳" : "🌍"}</p>
          <p className="text-xs text-nova-muted">
            {state.status === "loading" ? "Getting weather…" : "Fetching location…"}
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "denied") {
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden rounded-2xl border border-nova-border bg-white p-4 shadow-card">
        <div className="text-center">
          <p className="text-2xl mb-1">📍</p>
          <p className="text-xs text-nova-muted mb-2">Location access denied</p>
          <button
            onClick={() => fetchWeather(true)}
            className="text-xs text-theme-accent hover:underline font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden rounded-2xl border border-nova-border bg-white p-4 shadow-card">
        <div className="text-center">
          <p className="text-2xl mb-1">⚠️</p>
          <p className="text-xs text-nova-muted mb-2">Couldn't load weather</p>
          <button
            onClick={() => fetchWeather(true)}
            className="text-xs text-theme-accent hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { data } = state;
  const info = wmoInfo(data.weatherCode);
  const now = new Date();
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-nova-border bg-white px-4 py-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 to-transparent pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-nova-hint">Weather</p>
          <p className="mt-1 text-sm font-medium text-nova-text truncate max-w-[140px]">{data.city}</p>
          <p className="mt-1 text-xs text-nova-muted">Updated {timeLabel}</p>
        </div>
        <span className="text-3xl leading-none">{info.emoji}</span>
      </div>

      <div className="relative mt-5">
        <p className="font-serif text-4xl text-nova-text leading-none">{data.temp}°F</p>
        <p className="mt-1.5 text-sm text-nova-muted">{info.label}</p>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl bg-nova-bg px-3 py-2 text-center">
          <p className="text-nova-hint">Feels</p>
          <p className="mt-1 font-medium text-nova-text">{data.feelsLike}°F</p>
        </div>
        <div className="rounded-xl bg-nova-bg px-3 py-2 text-center">
          <p className="text-nova-hint">Wind</p>
          <p className="mt-1 font-medium text-nova-text">{data.windSpeed} mph</p>
        </div>
        <button
          onClick={() => fetchWeather(true)}
          className="rounded-xl bg-nova-bg px-3 py-2 text-center text-nova-muted transition-colors hover:text-nova-text"
          title="Refresh"
        >
          <p className="text-nova-hint">Refresh</p>
          <p className="mt-1 font-medium">↻</p>
        </button>
      </div>
    </div>
  );
}
