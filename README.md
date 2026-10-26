# SkyCast Weather Dashboard — Naseem Khan

A responsive weather dashboard demonstrating asynchronous JavaScript, Fetch API, async/await, REST endpoints, JSON parsing, dynamic DOM rendering, and error handling.

## Project files
- `index.html` — semantic dashboard markup
- `style.css` — responsive UI, metrics cards, light/dark theme
- `script.js` — API requests, async control flow, error handling, JSON rendering
- `README.md` — setup and testing guide

## Required setup: OpenWeather API key
The app uses OpenWeather's public REST API. A free API key is required to retrieve live weather.

1. Create or sign in to an account at https://openweathermap.org/
2. Generate an API key at https://home.openweathermap.org/api_keys
3. Open `script.js`.
4. Replace:
   ```js
   const API_KEY = 'YOUR_OPENWEATHER_API_KEY';
   ```
   with your actual key:
   ```js
   const API_KEY = 'paste_your_key_here';
   ```
5. Save the file. New API keys can take some time to activate.
6. Run `index.html` in a browser. If `file://` causes browser restrictions, use VS Code's Live Server extension.

**Security note:** A key embedded in client-side JavaScript is visible to anyone who can inspect the website. This is acceptable for a local learning exercise, but for a public production app use a small backend/proxy and restrict the key according to the provider's options. Do not commit a private key to a public GitHub repository.

## Features
- City search with popular-city shortcut buttons
- Geocoding endpoint converts city name to latitude/longitude
- Current weather and five upcoming forecast entries
- Fetch API and `async/await`
- Parallel current-weather and forecast requests using `Promise.all`
- JSON parsing and nested object handling (`main`, `weather`, `wind`, `sys`, `forecast.list`)
- HTTP, missing API key, city-not-found, invalid JSON, network, rate-limit, and service errors
- AbortController cancels the previous search when a new search starts
- Dynamic DOM rendering, humidity/visibility indicators, wind direction
- Celsius temperatures and wind speed converted from m/s to km/h
- Responsive design and light/dark theme persistence

## API endpoints used
- Geocoding: `https://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={API_KEY}`
- Current weather: `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric`
- 5-entry forecast: `https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric&cnt=5`

## Test checklist
1. Add a valid API key and search `London`.
2. Try a different city and a quick-city shortcut.
3. Try an invalid city name and confirm the error is clear.
4. Temporarily remove the internet connection and check the network error message.
5. Test mobile widths around 320px, 390px, and 768px.
6. Toggle light/dark mode and refresh.

Live data is unavailable until a valid OpenWeather API key is configured. The dashboard intentionally does not fake weather readings.
