// ─────────────────────────────────────────
//  SkyPulse v2.0 – Weather App Script
// ─────────────────────────────────────────

const API_KEY = "7d5e74e7b112e34001dc87b79a2fc7c3";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// ── DOM References ──
const cityInput    = document.getElementById("city-input");
const searchBtn    = document.getElementById("search-btn");
const locBtn       = document.getElementById("loc-btn");
const errorMsg     = document.getElementById("error-msg");
const loader       = document.getElementById("loader");
const weatherCard  = document.getElementById("weather-card");
const emptyState   = document.getElementById("empty-state");
const btnCelsius   = document.getElementById("btn-celsius");
const btnFahr      = document.getElementById("btn-fahrenheit");
const liveTimEl    = document.getElementById("live-time");
const canvas       = document.getElementById("particle-canvas");

// New card v2 elements
const elCityName     = document.getElementById("city-name");
const elCountryDate  = document.getElementById("country-date");
const elCondName     = document.getElementById("condition-name");
const elIcon         = document.getElementById("weather-icon");
const elIconGlow     = document.getElementById("icon-glow");
const elTemp         = document.getElementById("temperature");
const elTempUnit     = document.getElementById("temp-unit");
const elFeels        = document.getElementById("feels-like");
const elMax          = document.getElementById("temp-max");
const elMin          = document.getElementById("temp-min");
const elHeatIndex    = document.getElementById("heat-index");
const elWindSummary  = document.getElementById("wind-summary");
const elWindGusts    = document.getElementById("wind-gusts");
const elHumidity     = document.getElementById("humidity");
const elVis          = document.getElementById("visibility");
const elAqiInline    = document.getElementById("aqi-inline");
const elPressure     = document.getElementById("pressure");
const elSunrise      = document.getElementById("sunrise");
const elSunset       = document.getElementById("sunset");
const elCloudBar     = document.getElementById("cloud-bar");
const elCloudVal     = document.getElementById("cloud-val");
const elWindDir      = document.getElementById("wind-dir");
const elNeedle       = document.getElementById("compass-needle");
const elLogoEmoji    = document.getElementById("logo-emoji");
const elWcTime       = document.getElementById("wc-time");
const elMoreBtn      = document.getElementById("more-details-btn");
const elMoreSection  = document.getElementById("more-section");

// ── State ──
let useCelsius = true;
let lastData   = null;

// ── More Details Toggle ──
if (elMoreBtn && elMoreSection) {
  elMoreBtn.addEventListener("click", () => {
    elMoreBtn.classList.toggle("open");
    elMoreSection.classList.toggle("open");
  });
}

// ─────────────────────────────────────────
//  PARTICLE CANVAS
// ─────────────────────────────────────────
const ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function createParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.3,
    dx: (Math.random() - 0.5) * 0.3,
    dy: -Math.random() * 0.4 - 0.1,
    alpha: Math.random() * 0.5 + 0.1,
  };
}

for (let i = 0; i < 120; i++) particles.push(createParticle());

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,190,255,${p.alpha})`;
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    if (p.y < -5 || p.x < -5 || p.x > canvas.width + 5) {
      particles[i] = createParticle();
      particles[i].y = canvas.height + 5;
    }
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ─────────────────────────────────────────
//  LIVE CLOCK
// ─────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const timeStr = `${h}:${m}:${s}`;
  liveTimEl.textContent = timeStr;
  if (elWcTime) elWcTime.textContent = `${h}:${m} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
}
updateClock();
setInterval(updateClock, 1000);

// ─────────────────────────────────────────
//  UNIT TOGGLE
// ─────────────────────────────────────────
btnCelsius.addEventListener("click", () => {
  if (useCelsius) return;
  useCelsius = true;
  btnCelsius.classList.add("active");
  btnFahr.classList.remove("active");
  if (lastData && lastData.name) fetchWeather(lastData.name);
});
btnFahr.addEventListener("click", () => {
  if (!useCelsius) return;
  useCelsius = false;
  btnFahr.classList.add("active");
  btnCelsius.classList.remove("active");
  if (lastData && lastData.name) fetchWeather(lastData.name);
});

// ─────────────────────────────────────────
//  SEARCH
// ─────────────────────────────────────────
searchBtn.addEventListener("click", triggerSearch);
cityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") triggerSearch(); });

// Quick City Buttons
document.querySelectorAll(".quick-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    cityInput.value = btn.dataset.city;
    fetchWeather(btn.dataset.city);
  });
});

function triggerSearch() {
  const city = cityInput.value.trim();
  if (!city) { cityInput.focus(); return; }
  fetchWeather(city);
}

// ─────────────────────────────────────────
//  GEOLOCATION
// ─────────────────────────────────────────
locBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return;
  locBtn.style.animation = "spin360 1s linear infinite";
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      locBtn.style.animation = "";
      const { latitude: lat, longitude: lon } = pos.coords;
      const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      fetchWeatherByUrl(url);
    },
    () => { locBtn.style.animation = ""; }
  );
});

// ─────────────────────────────────────────
//  FETCH WEATHER
// ─────────────────────────────────────────
async function fetchWeather(city) {
  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  fetchWeatherByUrl(url);
}

async function fetchWeatherByUrl(url) {
  showLoader(); hideError(); hideWeatherCard(); hideForecast(); hideAqi();
  try {
    const res = await fetch(url);
    if (res.status === 404) { showError(); hideLoader(); showEmpty(); return; }
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    lastData = data;

    // Fetch forecast + AQI in parallel using city coords
    const { coord: { lat, lon } } = data;
    const [forecastRes, aqiRes, meteoRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=10`)
    ]);
    const forecastData = forecastRes.ok ? await forecastRes.json() : null;
    const aqiData      = aqiRes.ok      ? await aqiRes.json()      : null;
    const meteoData    = meteoRes.ok    ? await meteoRes.json()    : null;

    hideLoader(); hideEmpty();
    renderWeather(data);
    showWeatherCard();
    if (forecastData) { renderHourlyForecast(forecastData.list, data.timezone); }
    if (meteoData)    { renderTenDayForecast(meteoData); }
    if (forecastData || meteoData) { showForecast(); }
    if (aqiData)      { renderAQI(aqiData); showAqi(); }
  } catch (err) {
    hideLoader(); showError(); showEmpty();
    console.error("Fetch failed:", err);
  }
}

// ─────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────
function renderWeather(data) {
  const { name, sys, main, wind, visibility, clouds, weather, timezone } = data;

  // Location
  elCityName.textContent  = name;
  const localNow = new Date(Date.now() + timezone * 1000 + new Date().getTimezoneOffset() * 60000);
  elCountryDate.textContent = `${sys.country} · ${formatDate(localNow)}`;

  // Condition name & logo emoji
  const cond = weather[0].main;
  const desc = weather[0].description;
  if (elCondName) elCondName.textContent = capitalize(cond);
  elLogoEmoji.textContent       = getWeatherEmoji(cond);
  elIcon.src                    = getWeatherIcon(cond);
  elIcon.alt                    = desc;
  elIconGlow.style.background   = getGlowColor(cond);

  // Temperature
  const tc = main.temp, fc = main.feels_like, xc = main.temp_max, nc = main.temp_min;
  if (useCelsius) {
    elTemp.textContent      = Math.round(tc);
    if (elTempUnit) elTempUnit.textContent = "°C";
    elFeels.textContent     = `RealFeel® ${Math.round(fc)}°`;
    elHeatIndex.textContent = `${Math.round(fc)}°`;
    elMax.textContent       = `↑ ${Math.round(xc)}°C`;
    elMin.textContent       = `↓ ${Math.round(nc)}°C`;
  } else {
    elTemp.textContent      = toF(tc);
    if (elTempUnit) elTempUnit.textContent = "°F";
    elFeels.textContent     = `RealFeel® ${toF(fc)}°`;
    elHeatIndex.textContent = `${toF(fc)}°`;
    elMax.textContent       = `↑ ${toF(xc)}°F`;
    elMin.textContent       = `↓ ${toF(nc)}°F`;
  }

  // Wind
  const deg      = wind.deg || 0;
  const dirLabel = degreesToDir(deg);
  const speedKmh = Math.round(wind.speed * 3.6);
  const gustKmh  = wind.gust ? Math.round(wind.gust * 3.6) : null;
  elWindSummary.textContent  = `${dirLabel} ${speedKmh} km/h`;
  elWindGusts.textContent    = gustKmh ? `${gustKmh} km/h` : "N/A";
  elWindDir.textContent      = dirLabel;
  elNeedle.style.transform   = `translate(-50%, -50%) rotate(${deg}deg)`;

  // Right column stats
  const hum = main.humidity;
  elHumidity.textContent   = `${hum}%`;
  elVis.textContent        = visibility ? `${(visibility / 1000).toFixed(1)} km` : "N/A";
  elPressure.textContent   = `${main.pressure} hPa`;
  elSunrise.textContent    = formatTime(sys.sunrise, timezone);
  elSunset.textContent     = formatTime(sys.sunset, timezone);

  // Cloud cover
  const cloud = clouds ? clouds.all : 0;
  elCloudBar.style.width = `${cloud}%`;
  elCloudVal.textContent = `${cloud}%`;

  // AQI inline placeholder (filled later by renderAQI)
  if (elAqiInline) { elAqiInline.textContent = "–"; elAqiInline.style.color = ""; }

  // Dynamic background theme
  applyTheme(cond, tc);
}

// ─────────────────────────────────────────
//  DYNAMIC THEME
// ─────────────────────────────────────────
function applyTheme(cond, tempC) {
  const orb1 = document.getElementById("orb-1");
  const orb2 = document.getElementById("orb-2");
  const orb3 = document.getElementById("orb-3");
  const sky  = document.getElementById("sky-layer");

  const themes = {
    Clear: {
      o1: "rgba(251,191,36,0.22)", o2: "rgba(251,146,60,0.18)", o3: "rgba(253,224,71,0.14)",
      sky: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(251,191,36,0.15) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 80% 110%, rgba(251,146,60,0.12) 0%, transparent 70%)",
    },
    Clouds: {
      o1: "rgba(148,163,184,0.2)", o2: "rgba(100,116,139,0.18)", o3: "rgba(129,140,248,0.15)",
      sky: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(148,163,184,0.12) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 80% 110%, rgba(100,116,139,0.1) 0%, transparent 70%)",
    },
    Rain: {
      o1: "rgba(56,189,248,0.25)", o2: "rgba(14,165,233,0.2)", o3: "rgba(99,102,241,0.18)",
      sky: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(56,189,248,0.18) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 80% 110%, rgba(14,165,233,0.15) 0%, transparent 70%)",
    },
    Drizzle: {
      o1: "rgba(56,189,248,0.2)", o2: "rgba(14,165,233,0.16)", o3: "rgba(99,102,241,0.14)",
      sky: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(56,189,248,0.14) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 80% 110%, rgba(14,165,233,0.1) 0%, transparent 70%)",
    },
    Snow: {
      o1: "rgba(167,139,250,0.22)", o2: "rgba(199,210,254,0.2)", o3: "rgba(224,231,255,0.15)",
      sky: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(167,139,250,0.18) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 80% 110%, rgba(199,210,254,0.15) 0%, transparent 70%)",
    },
    Thunderstorm: {
      o1: "rgba(248,113,113,0.22)", o2: "rgba(99,102,241,0.2)", o3: "rgba(129,140,248,0.18)",
      sky: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(248,113,113,0.15) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 80% 110%, rgba(99,102,241,0.12) 0%, transparent 70%)",
    },
    Mist: {
      o1: "rgba(148,163,184,0.18)", o2: "rgba(100,116,139,0.15)", o3: "rgba(129,140,248,0.12)",
      sky: "radial-gradient(ellipse 80% 60% at 20% -10%, rgba(148,163,184,0.1) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 80% 110%, rgba(100,116,139,0.08) 0%, transparent 70%)",
    },
  };

  const t = themes[cond] || themes["Clouds"];
  const makeOrb = (c) =>
    `radial-gradient(circle, ${c}, transparent 70%)`;

  orb1.style.background = makeOrb(t.o1);
  orb2.style.background = makeOrb(t.o2);
  orb3.style.background = makeOrb(t.o3);
  sky.style.background  = t.sky;
}

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────
function toF(c) { return Math.round(c * 9 / 5 + 32); }

function formatDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(ts, tz) {
  const ms = (ts + tz) * 1000 + new Date().getTimezoneOffset() * 60000;
  return new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function degreesToDir(d) {
  return ["N","NE","E","SE","S","SW","W","NW"][Math.round(d / 45) % 8];
}

function getWeatherIcon(cond) {
  const m = { Clear:"img/clear.png", Clouds:"img/clouds.png", Rain:"img/rain.png",
    Drizzle:"img/drizzle.png", Mist:"img/mist.png", Haze:"img/mist.png",
    Fog:"img/mist.png", Snow:"img/snow.png", Thunderstorm:"img/rain.png" };
  return m[cond] || "img/clouds.png";
}

function getWeatherEmoji(cond) {
  const m = { Clear:"☀️", Clouds:"⛅", Rain:"🌧️", Drizzle:"🌦️",
    Snow:"❄️", Thunderstorm:"⛈️", Mist:"🌫️", Haze:"🌫️", Fog:"🌫️" };
  return m[cond] || "🌤";
}

function getGlowColor(cond) {
  const m = { Clear:"radial-gradient(circle, rgba(251,191,36,0.55), transparent 70%)",
    Rain:"radial-gradient(circle, rgba(56,189,248,0.5), transparent 70%)",
    Drizzle:"radial-gradient(circle, rgba(56,189,248,0.4), transparent 70%)",
    Snow:"radial-gradient(circle, rgba(199,210,254,0.5), transparent 70%)",
    Thunderstorm:"radial-gradient(circle, rgba(248,113,113,0.5), transparent 70%)" };
  return m[cond] || "radial-gradient(circle, rgba(129,140,248,0.45), transparent 70%)";
}

// ── UI State Helpers ──
function showLoader()      { loader.classList.add("visible"); }
function hideLoader()      { loader.classList.remove("visible"); }
function showError()       { errorMsg.classList.add("visible"); }
function hideError()       { errorMsg.classList.remove("visible"); }
function showWeatherCard() { weatherCard.classList.add("visible"); }
function hideWeatherCard() { weatherCard.classList.remove("visible"); }
function showEmpty()       { emptyState.style.display = "block"; }
function hideEmpty()       { emptyState.style.display = "none"; }
function showForecast()    {
  document.getElementById("forecast-section").classList.add("visible");
  document.getElementById("hourly-section").classList.add("visible");
}
function hideForecast()    {
  document.getElementById("forecast-section").classList.remove("visible");
  document.getElementById("hourly-section").classList.remove("visible");
}
function showAqi()  { document.getElementById("aqi-section").classList.add("visible"); }
function hideAqi()  { document.getElementById("aqi-section").classList.remove("visible"); }

// ─────────────────────────────────────────
//  RENDER FORECAST
// ─────────────────────────────────────────
function getMeteoCondition(code) {
  if (code === 0) return { cond: "Clear", desc: "Clear sky" };
  if (code === 1 || code === 2 || code === 3) return { cond: "Clouds", desc: "Partly cloudy" };
  if (code === 45 || code === 48) return { cond: "Fog", desc: "Foggy" };
  if (code >= 51 && code <= 57) return { cond: "Drizzle", desc: "Drizzle" };
  if (code >= 61 && code <= 67) return { cond: "Rain", desc: "Rain" };
  if (code >= 71 && code <= 77) return { cond: "Snow", desc: "Snow" };
  if (code >= 80 && code <= 82) return { cond: "Rain", desc: "Rain showers" };
  if (code >= 85 && code <= 86) return { cond: "Snow", desc: "Snow showers" };
  if (code >= 95 && code <= 99) return { cond: "Thunderstorm", desc: "Thunderstorm" };
  return { cond: "Clouds", desc: "Unknown" };
}

function renderTenDayForecast(data) {
  const listEl = document.getElementById("tenday-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  const { time, weathercode, temperature_2m_max, temperature_2m_min, precipitation_probability_max } = data.daily;
  
  // Use today's date in local time of the user to match 'time' which is YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < time.length; i++) {
    const isToday = time[i] === today;
    const date = new Date(time[i]);
    const dayName = isToday ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    const maxT = temperature_2m_max[i];
    const minT = temperature_2m_min[i];
    const rain = precipitation_probability_max ? precipitation_probability_max[i] : 0;
    const { cond, desc } = getMeteoCondition(weathercode[i]);

    const maxDisp = useCelsius ? `${Math.round(maxT)}°` : `${toF(maxT)}°`;
    const minDisp = useCelsius ? `${Math.round(minT)}°` : `${toF(minT)}°`;

    const row = document.createElement("div");
    row.className = `tenday-row${isToday ? " today" : ""}`;
    row.innerHTML = `
      <div class="tday-date">
        <span class="tday-name ${isToday ? 'today-label' : ''}">${isToday ? 'TODAY' : dayName.toUpperCase()}</span>
        <span class="tday-sub">${dateStr}</span>
      </div>
      <div class="tday-icon-temp">
        <img class="tday-icon" src="${getWeatherIcon(cond)}" alt="${desc}" />
        <span class="tday-temp-high">${maxDisp}</span>
        <span class="tday-temp-low">${minDisp}</span>
      </div>
      <div class="tday-desc">${desc}</div>
      <div class="tday-rain">${rain}%</div>
    `;
    listEl.appendChild(row);
  }
}

function renderHourlyForecast(list, timezone) {
  const track = document.getElementById("hourly-track");
  track.innerHTML = "";

  // Take first 8 entries (24 hours, every 3h)
  const entries = list.slice(0, 8);
  const nowHour = new Date(
    (Math.floor(Date.now() / 1000) + timezone) * 1000 + new Date().getTimezoneOffset() * 60000
  ).getHours();

  entries.forEach((entry, idx) => {
    const localMs = (entry.dt + timezone) * 1000 + new Date().getTimezoneOffset() * 60000;
    const d = new Date(localMs);
    const timeStr = idx === 0 ? "Now" : d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    const cond = entry.weather[0].main;
    const temp = useCelsius ? `${Math.round(entry.main.temp)}°C` : `${toF(entry.main.temp)}°F`;
    const rain = Math.round((entry.pop || 0) * 100);

    const card = document.createElement("div");
    card.className = "hourly-card";
    card.innerHTML = `
      <div class="hcard-time ${idx === 0 ? 'hcard-now' : ''}">${timeStr}</div>
      <img class="hcard-img" src="${getWeatherIcon(cond)}" alt="${cond}" />
      <div class="hcard-temp">${temp}</div>
      ${rain > 5 ? `<div class="hcard-rain">💧 ${rain}%</div>` : ''}
    `;
    track.appendChild(card);
  });
}

// ─────────────────────────────────────────
//  RENDER AQI
// ─────────────────────────────────────────
function renderAQI(data) {
  const entry = data.list[0];
  const aqiVal = entry.main.aqi;       // 1–5
  const comp   = entry.components;

  // AQI level metadata
  const aqiMeta = {
    1: { label: "Good",      color: "#34d399", bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.4)",
         desc: "Air quality is satisfactory. Pollution poses little or no risk.",
         advice: "✅ It's a great day to be outside! Enjoy outdoor activities freely." },
    2: { label: "Fair",      color: "#a3e635", bg: "rgba(163,230,53,0.15)",  border: "rgba(163,230,53,0.4)",
         desc: "Air quality is acceptable. Some pollutants may affect sensitive groups.",
         advice: "🟡 Unusually sensitive people should consider reducing prolonged outdoor exertion." },
    3: { label: "Moderate",  color: "#facc15", bg: "rgba(250,204,21,0.15)",  border: "rgba(250,204,21,0.4)",
         desc: "Members of sensitive groups may experience health effects.",
         advice: "⚠️ Sensitive groups should limit prolonged outdoor exertion." },
    4: { label: "Poor",      color: "#fb923c", bg: "rgba(251,146,60,0.15)",  border: "rgba(251,146,60,0.4)",
         desc: "Everyone may begin to experience health effects. Sensitive groups at higher risk.",
         advice: "🚨 Everyone should reduce prolonged outdoor exertion. Wear a mask outdoors." },
    5: { label: "Very Poor", color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)",
         desc: "Health warnings of emergency conditions. Entire population is more likely to be affected.",
         advice: "🔴 Avoid all outdoor activities. Keep windows closed. Use air purifiers indoors." },
  };

  const m = aqiMeta[aqiVal] || aqiMeta[3];

  // AQI Badge (in AQI section header)
  const badge = document.getElementById("aqi-badge");
  badge.textContent      = m.label;
  badge.style.color      = m.color;
  badge.style.background = m.bg;
  badge.style.borderColor = m.border;

  // AQI Inline (in weather card right column)
  if (elAqiInline) {
    elAqiInline.textContent = m.label;
    elAqiInline.style.color = m.color;
  }

  // SVG Arc — total arc length ≈ 173px for our path
  const arcLength = 173;
  const fraction  = (aqiVal - 1) / 4;          // 0.0 → 1.0
  const offset    = arcLength - fraction * arcLength;
  const arc = document.getElementById("aqi-arc");
  arc.style.strokeDashoffset = offset;
  arc.setAttribute("stroke", m.color);

  // Score text
  document.getElementById("aqi-score-text").textContent = aqiVal;

  // Info panel
  document.getElementById("aqi-label").textContent  = m.label;
  document.getElementById("aqi-label").style.color   = m.color;
  document.getElementById("aqi-desc").textContent   = m.desc;
  document.getElementById("aqi-advice").textContent = m.advice;

  // Pollutants — WHO reference limits for bar scaling
  const pollutants = [
    { id: "pm2_5", barId: "pm25-bar", val: comp.pm2_5,  limit: 75,   color: "#818cf8" },
    { id: "pm10",  barId: "pm10-bar", val: comp.pm10,   limit: 150,  color: "#a78bfa" },
    { id: "o3",    barId: "o3-bar",   val: comp.o3,     limit: 240,  color: "#38bdf8" },
    { id: "no2",   barId: "no2-bar",  val: comp.no2,    limit: 200,  color: "#fb923c" },
    { id: "so2",   barId: "so2-bar",  val: comp.so2,    limit: 350,  color: "#facc15" },
    { id: "co",    barId: "co-bar",   val: comp.co,     limit: 10000, color: "#f472b6" },
  ];

  pollutants.forEach(({ id, barId, val, limit, color }) => {
    document.getElementById(id).textContent = val.toFixed(1);
    const pct = Math.min((val / limit) * 100, 100);
    const bar = document.getElementById(barId);
    bar.style.width      = `${pct}%`;
    bar.style.background = color;
  });
}