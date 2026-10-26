/* SkyCast — asynchronous REST API client using Fetch and async/await.
   OpenWeather API docs: https://openweathermap.org/api
   Set OPENWEATHER_API_KEY below before using live weather requests. */
(() => {
  'use strict';

  // Get a free API key from https://home.openweathermap.org/api_keys
  const API_KEY = 'YOUR_OPENWEATHER_API_KEY';
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';
  const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
  const form = document.getElementById('search-form');
  const cityInput = document.getElementById('city-input');
  const searchButton = form.querySelector('button[type="submit"]');
  const statusMessage = document.getElementById('status-message');
  const dashboard = document.getElementById('weather-dashboard');
  const welcomeCard = document.getElementById('welcome-card');
  const weatherContent = document.getElementById('weather-content');
  const forecastGrid = document.getElementById('forecast-grid');
  let activeController = null;

  const weatherIcons = {
    '01d': '☀', '01n': '☾', '02d': '🌤', '02n': '☁', '03d': '☁', '03n': '☁',
    '04d': '☁', '04n': '☁', '09d': '🌧', '09n': '🌧', '10d': '🌦', '10n': '🌧',
    '11d': '⛈', '11n': '⛈', '13d': '❄', '13n': '❄', '50d': '🌫', '50n': '🌫'
  };

  function setStatus(message, type = '') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message${type ? ` ${type}` : ''}`;
  }

  function validateApiKey() {
    if (!API_KEY || API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
      throw new Error('API_KEY_MISSING');
    }
  }

  async function fetchJson(url, signal) {
    const response = await fetch(url, { signal });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('INVALID_RESPONSE');
    }
    if (!response.ok) {
      const message = data?.message || 'The weather service returned an error.';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function getCoordinates(city, signal) {
    const url = new URL(GEO_URL);
    url.search = new URLSearchParams({ q: city, limit: '1', appid: API_KEY }).toString();
    const results = await fetchJson(url, signal);
    if (!Array.isArray(results) || results.length === 0) throw new Error('CITY_NOT_FOUND');
    return results[0];
  }

  async function getCurrentWeather(lat, lon, signal) {
    const url = new URL(`${BASE_URL}/weather`);
    url.search = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: API_KEY, units: 'metric' }).toString();
    return fetchJson(url, signal);
  }

  async function getForecast(lat, lon, signal) {
    const url = new URL(`${BASE_URL}/forecast`);
    url.search = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: API_KEY, units: 'metric', cnt: '5' }).toString();
    return fetchJson(url, signal);
  }

  function formatClock(unixSeconds, timezoneOffset = 0) {
    if (!unixSeconds) return '—';
    // OpenWeather timestamps are UTC seconds; offset is seconds east of UTC.
    const localTime = new Date((unixSeconds + timezoneOffset) * 1000);
    return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(localTime);
  }

  function formatForecastTime(timestamp, timezoneOffset = 0) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', timeZone: 'UTC' }).format(date);
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function renderWeather(data, forecast, geo) {
    const weather = data.weather?.[0] || {};
    const main = data.main || {};
    const wind = data.wind || {};
    const sys = data.sys || {};
    const timezone = data.timezone || 0;
    const description = weather.description || 'Conditions unavailable';
    const icon = weatherIcons[weather.icon] || '☁';

    setText('location-name', `${data.name || geo.name || 'Unknown city'}${sys.country ? `, ${sys.country}` : ''}`);
    setText('location-meta', `LOCAL WEATHER · ${formatClock(data.dt, timezone)}`);
    setText('temperature', `${Math.round(main.temp ?? 0)}°C`);
    // The temperature unit suffix is included in the text above, so hide the decorative suffix span.
    const tempElement = document.getElementById('temperature');
    tempElement.innerHTML = `${Math.round(main.temp ?? 0)}<span>°C</span>`;
    setText('weather-description', description);
    setText('feels-like', `Feels like ${Math.round(main.feels_like ?? main.temp ?? 0)}°C`);
    setText('high-low', `High ${Math.round(main.temp_max ?? main.temp ?? 0)}° · Low ${Math.round(main.temp_min ?? main.temp ?? 0)}°`);
    setText('sunrise', `Sunrise ${formatClock(sys.sunrise, timezone)}`);
    setText('sunset', `Sunset ${formatClock(sys.sunset, timezone)}`);
    setText('updated-at', `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
    setText('humidity', `${main.humidity ?? '—'}%`);
    setText('wind-speed', `${Math.round((wind.speed ?? 0) * 3.6 * 10) / 10} km/h`);
    setText('wind-direction', `Wind direction ${Number.isFinite(wind.deg) ? `${wind.deg}°` : '—'}`);
    setText('pressure', `${main.pressure ?? '—'} hPa`);
    setText('visibility', `${Number.isFinite(data.visibility) ? (data.visibility / 1000).toFixed(1) : '—'} km`);
    document.getElementById('humidity-bar').style.width = `${Math.max(0, Math.min(100, main.humidity ?? 0))}%`;
    document.getElementById('visibility-bar').style.width = `${Math.max(0, Math.min(100, (data.visibility ?? 0) / 100))}%`;
    document.querySelector('#wind-compass span').style.transform = `rotate(${wind.deg || 0}deg)`;
    document.getElementById('weather-symbol').textContent = icon;

    forecastGrid.replaceChildren();
    const entries = forecast.list || [];
    entries.forEach(entry => {
      const item = document.createElement('article');
      item.className = 'forecast-item';
      const time = document.createElement('span');
      time.className = 'forecast-time';
      time.textContent = formatForecastTime(entry.dt, timezone);
      const symbol = document.createElement('span');
      symbol.className = 'forecast-icon';
      symbol.textContent = weatherIcons[entry.weather?.[0]?.icon] || '☁';
      symbol.setAttribute('aria-hidden', 'true');
      const temperature = document.createElement('strong');
      temperature.className = 'forecast-temp';
      temperature.textContent = `${Math.round(entry.main?.temp ?? 0)}°`;
      const desc = document.createElement('span');
      desc.className = 'forecast-desc';
      desc.textContent = entry.weather?.[0]?.description || 'Unknown';
      item.append(time, symbol, temperature, desc);
      forecastGrid.appendChild(item);
    });

    welcomeCard.hidden = true;
    weatherContent.hidden = false;
  }

  function readableError(error) {
    if (error.name === 'AbortError') return 'Search cancelled. Try another city.';
    if (error.message === 'API_KEY_MISSING') return 'Setup needed: add your OpenWeather API key in script.js before searching.';
    if (error.message === 'CITY_NOT_FOUND') return 'We could not find that city. Check the spelling and try again.';
    if (error.message === 'INVALID_RESPONSE') return 'The weather service sent an unreadable response. Please try again.';
    if (error instanceof TypeError) return 'Network error. Check your internet connection and try again.';
    if (error.status === 401) return 'The API key is invalid or not active yet. Check your OpenWeather account.';
    if (error.status === 404) return 'Weather data was not found for that location.';
    if (error.status === 429) return 'API request limit reached. Please wait a little and try again.';
    if (error.status >= 500) return 'The weather service is temporarily unavailable. Please try again later.';
    return `Could not load weather: ${error.message || 'Unknown error'}`;
  }

  async function searchWeather(city) {
    const cleanCity = city.trim();
    if (!cleanCity) {
      setStatus('Enter a city name to search.', 'error');
      cityInput.focus();
      return;
    }
    if (activeController) activeController.abort();
    activeController = new AbortController();
    const { signal } = activeController;
    dashboard.setAttribute('aria-busy', 'true');
    searchButton.disabled = true;
    searchButton.querySelector('span').textContent = 'Loading…';
    setStatus(`Fetching live weather for ${cleanCity}…`);
    try {
      validateApiKey();
      const geo = await getCoordinates(cleanCity, signal);
      // Fetch current conditions and forecast concurrently to reduce wait time.
      const [current, forecast] = await Promise.all([
        getCurrentWeather(geo.lat, geo.lon, signal),
        getForecast(geo.lat, geo.lon, signal)
      ]);
      renderWeather(current, forecast, geo);
      cityInput.value = geo.name || cleanCity;
      setStatus(`Weather loaded for ${geo.name || cleanCity}.`, 'success');
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Weather request failed:', error);
      setStatus(readableError(error), 'error');
    } finally {
      if (activeController?.signal === signal) {
        dashboard.setAttribute('aria-busy', 'false');
        searchButton.disabled = false;
        searchButton.querySelector('span').textContent = 'Search weather';
      }
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    searchWeather(cityInput.value);
  });
  document.querySelectorAll('[data-city]').forEach(button => {
    button.addEventListener('click', () => {
      cityInput.value = button.dataset.city;
      searchWeather(button.dataset.city);
    });
  });

  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeIcon.textContent = theme === 'dark' ? '☼' : '☾';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    try { localStorage.setItem('skycast-theme', theme); } catch (_) {}
  }
  let savedTheme;
  try { savedTheme = localStorage.getItem('skycast-theme'); } catch (_) {}
  applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
})();
