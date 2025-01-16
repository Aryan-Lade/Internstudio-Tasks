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

// Display elements
const elCityName    = document.getElementById("city-name");
const elCountryDate = document.getElementById("country-date");
const elBadge       = document.getElementById("condition-badge");
const elIcon        = document.getElementById("weather-icon");
const elIconGlow    = document.getElementById("icon-glow");
const elTemp        = document.getElementById("temperature");
const elFeels       = document.getElementById("feels-like");
const elMax         = document.getElementById("temp-max");
const elMin         = document.getElementById("temp-min");
const elHumidity    = document.getElementById("humidity");
const elHumidBar    = document.getElementById("humidity-bar");
const elWind        = document.getElementById("wind-speed");
const elWindDirInline = document.getElementById("wind-dir-inline");
const elVis         = document.getElementById("visibility");
const elPressure    = document.getElementById("pressure");
const elSunrise     = document.getElementById("sunrise");
const elSunset      = document.getElementById("sunset");
const elCloudBar    = document.getElementById("cloud-bar");
const elCloudVal    = document.getElementById("cloud-val");
const elWindDir     = document.getElementById("wind-dir");
const elNeedle      = document.getElementById("compass-needle");
const elLogoEmoji   = document.getElementById("logo-emoji");

// ── State ──
let useCelsius = true;
let lastData   = null;

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
  liveTimEl.textContent = `${h}:${m}:${s}`;
}
updateClock();
setInterval(updateClock, 1000);

// ─────────────────────────────────────────
//  UNIT TOGGLE
// ─────────────────────────────────────────
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
  showLoader(); hideError(); hideWeatherCard();
  try {
    const res = await fetch(url);
    if (res.status === 404) { showError(); hideLoader(); showEmpty(); return; }
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    lastData = data;
    hideLoader(); hideEmpty();
    renderWeather(data);
    showWeatherCard();
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
  elCityName.textContent = name;
  const localNow = new Date(Date.now() + timezone * 1000 + new Date().getTimezoneOffset() * 60000);
  elCountryDate.textContent = `${sys.country} · ${formatDate(localNow)}`;

  // Condition
  const cond = weather[0].main;
  const desc = weather[0].description;
  elBadge.textContent = capitalize(desc);

  // Icon + glow color
  elIcon.src = getWeatherIcon(cond);
  elIcon.alt = desc;
  elLogoEmoji.textContent = getWeatherEmoji(cond);
  elIconGlow.style.background = getGlowColor(cond);

  // Temperature
  const tc = main.temp, fc = main.feels_like, xc = main.temp_max, nc = main.temp_min;
  if (useCelsius) {
    elTemp.textContent  = `${Math.round(tc)}°C`;
    elFeels.textContent = `Feels like ${Math.round(fc)}°C`;
    elMax.textContent   = `↑ ${Math.round(xc)}°C`;
    elMin.textContent   = `↓ ${Math.round(nc)}°C`;
  } else {
    elTemp.textContent  = `${toF(tc)}°F`;
    elFeels.textContent = `Feels like ${toF(fc)}°F`;
    elMax.textContent   = `↑ ${toF(xc)}°F`;
    elMin.textContent   = `↓ ${toF(nc)}°F`;
  }

  // Stats
  const hum = main.humidity;
  elHumidity.textContent = `${hum}%`;
  elHumidBar.style.width = `${hum}%`;
  elWind.textContent     = `${Math.round(wind.speed * 3.6)} km/h`;
  elVis.textContent      = visibility ? `${(visibility / 1000).toFixed(1)} km` : "N/A";
  elPressure.textContent = `${main.pressure} hPa`;
  elSunrise.textContent  = formatTime(sys.sunrise, timezone);
  elSunset.textContent   = formatTime(sys.sunset, timezone);

  // Wind direction
  const deg = wind.deg || 0;
  const dirLabel = degreesToDir(deg);
  elWindDir.textContent       = dirLabel;
  elWindDirInline.textContent = dirLabel;
  // Compass: needle points in wind direction
  elNeedle.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;

  // Cloud cover
  const cloud = clouds ? clouds.all : 0;
  elCloudBar.style.width = `${cloud}%`;
  elCloudVal.textContent = `${cloud}%`;

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