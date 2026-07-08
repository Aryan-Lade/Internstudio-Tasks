// ─────────────────────────────────────────
//  SkyPulse – Weather App Script
// ─────────────────────────────────────────

const API_KEY = "7d5e74e7b112e34001dc87b79a2fc7c3";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// ── DOM References ──
const cityInput    = document.getElementById("city-input");
const searchBtn    = document.getElementById("search-btn");
const errorMsg     = document.getElementById("error-msg");
const loader       = document.getElementById("loader");
const weatherCard  = document.getElementById("weather-card");
const emptyState   = document.getElementById("empty-state");
const btnCelsius   = document.getElementById("btn-celsius");
const btnFahr      = document.getElementById("btn-fahrenheit");

// Weather display elements
const elCityName       = document.getElementById("city-name");
const elCountryDate    = document.getElementById("country-date");
const elConditionBadge = document.getElementById("condition-badge");
const elWeatherIcon    = document.getElementById("weather-icon");
const elTemperature    = document.getElementById("temperature");
const elFeelsLike      = document.getElementById("feels-like");
const elTempRange      = document.getElementById("temp-range");
const elHumidity       = document.getElementById("humidity");
const elWindSpeed      = document.getElementById("wind-speed");
const elVisibility     = document.getElementById("visibility");
const elPressure       = document.getElementById("pressure");
const elSunrise        = document.getElementById("sunrise");
const elSunset         = document.getElementById("sunset");
const elCloudBar       = document.getElementById("cloud-bar");
const elCloudVal       = document.getElementById("cloud-val");
const elWindDir        = document.getElementById("wind-dir");
const elCompassArrow   = document.getElementById("compass-arrow");

// ── State ──
let useCelsius = true;
let lastData   = null;

// ── Unit Toggle ──
btnCelsius.addEventListener("click", () => {
  useCelsius = true;
  btnCelsius.classList.add("active");
  btnFahr.classList.remove("active");
  if (lastData) renderWeather(lastData);
});
btnFahr.addEventListener("click", () => {
  useCelsius = false;
  btnFahr.classList.add("active");
  btnCelsius.classList.remove("active");
  if (lastData) renderWeather(lastData);
});

// ── Search Trigger ──
searchBtn.addEventListener("click", triggerSearch);
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") triggerSearch();
});

function triggerSearch() {
  const city = cityInput.value.trim();
  if (!city) return;
  fetchWeather(city);
}

// ── Fetch Weather ──
async function fetchWeather(city) {
  showLoader();
  hideError();
  hideWeatherCard();

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);

    if (response.status === 404) {
      showError();
      hideLoader();
      showEmptyState();
      return;
    }
    if (!response.ok) throw new Error("API error");

    const data = await response.json();
    lastData = data;
    hideLoader();
    hideEmptyState();
    renderWeather(data);
    showWeatherCard();

  } catch (err) {
    hideLoader();
    showError();
    showEmptyState();
    console.error("Weather fetch failed:", err);
  }
}

// ── Render Weather ──
function renderWeather(data) {
  const { name, sys, main, wind, visibility, clouds, weather, timezone } = data;

  // Location & Date
  elCityName.textContent = name;
  const now = new Date(Date.now() + (timezone * 1000) + (new Date().getTimezoneOffset() * 60000));
  elCountryDate.textContent = `${sys.country} · ${formatDate(now)}`;

  // Condition Badge
  const condition = weather[0].main;
  const description = weather[0].description;
  elConditionBadge.textContent = capitalize(description);

  // Icon
  elWeatherIcon.src = getWeatherIcon(condition);
  elWeatherIcon.alt = description;

  // Temperature
  const tempC   = main.temp;
  const feelsC  = main.feels_like;
  const maxC    = main.temp_max;
  const minC    = main.temp_min;

  if (useCelsius) {
    elTemperature.textContent = `${Math.round(tempC)}°C`;
    elFeelsLike.textContent   = `Feels like ${Math.round(feelsC)}°C`;
    elTempRange.textContent   = `↑ ${Math.round(maxC)}°C   ↓ ${Math.round(minC)}°C`;
  } else {
    elTemperature.textContent = `${toFahrenheit(tempC)}°F`;
    elFeelsLike.textContent   = `Feels like ${toFahrenheit(feelsC)}°F`;
    elTempRange.textContent   = `↑ ${toFahrenheit(maxC)}°F   ↓ ${toFahrenheit(minC)}°F`;
  }

  // Stats
  elHumidity.textContent   = `${main.humidity}%`;
  elWindSpeed.textContent  = `${Math.round(wind.speed * 3.6)} km/h`;
  elVisibility.textContent = visibility ? `${(visibility / 1000).toFixed(1)} km` : "N/A";
  elPressure.textContent   = `${main.pressure} hPa`;
  elSunrise.textContent    = formatTime(sys.sunrise, timezone);
  elSunset.textContent     = formatTime(sys.sunset, timezone);

  // Cloud cover progress bar
  const cloudPct = clouds ? clouds.all : 0;
  elCloudBar.style.width = `${cloudPct}%`;
  elCloudVal.textContent = `${cloudPct}%`;

  // Wind direction
  const deg = wind.deg || 0;
  elWindDir.textContent = degreesToDirection(deg);
  elCompassArrow.style.transform = `rotate(${deg}deg)`;

  // Dynamic card border based on weather
  applyWeatherTheme(condition, tempC);
}

// ── Helpers ──

function toFahrenheit(c) {
  return Math.round((c * 9 / 5) + 32);
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric"
  });
}

function formatTime(unixTs, timezoneOffset) {
  const localMs = (unixTs + timezoneOffset) * 1000;
  const d = new Date(localMs + new Date().getTimezoneOffset() * 60000);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function degreesToDirection(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function getWeatherIcon(condition) {
  const map = {
    "Clear":        "img/clear.png",
    "Clouds":       "img/clouds.png",
    "Rain":         "img/rain.png",
    "Drizzle":      "img/drizzle.png",
    "Mist":         "img/mist.png",
    "Haze":         "img/mist.png",
    "Fog":          "img/mist.png",
    "Snow":         "img/snow.png",
    "Thunderstorm": "img/rain.png",
  };
  return map[condition] || "img/clouds.png";
}

function applyWeatherTheme(condition, tempC) {
  const card = document.getElementById("weather-card");
  let borderCol = "rgba(255,255,255,0.12)";
  if (condition === "Clear" && tempC > 25) {
    borderCol = "rgba(251,191,36,0.35)";
  } else if (condition === "Rain" || condition === "Drizzle") {
    borderCol = "rgba(56,189,248,0.35)";
  } else if (condition === "Snow") {
    borderCol = "rgba(167,139,250,0.4)";
  } else if (condition === "Thunderstorm") {
    borderCol = "rgba(248,113,113,0.35)";
  }
  card.style.borderColor = borderCol;
}

// ── UI State Helpers ──
function showLoader()      { loader.classList.add("visible"); }
function hideLoader()      { loader.classList.remove("visible"); }
function showError()       { errorMsg.classList.add("visible"); }
function hideError()       { errorMsg.classList.remove("visible"); }
function showWeatherCard() { weatherCard.classList.add("visible"); }
function hideWeatherCard() { weatherCard.classList.remove("visible"); }
function showEmptyState()  { emptyState.style.display = "block"; }
function hideEmptyState()  { emptyState.style.display = "none"; }