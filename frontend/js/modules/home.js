import { listProperties } from "../services/propertyService.js";
import { formatCurrency, showToast } from "../utils/helpers.js";

const newHomesGrid = document.getElementById("newHomesGrid");
const popularLocations = document.getElementById("popularLocations");

const FALLBACK_IMG = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=900&q=80";
const basePrefix = window.location.pathname.includes("/pages/") ? "../" : "./";
const isDiscoverPage = window.location.pathname.endsWith("/pages/discover.html");

let locationChipsBound = false;

// ── Property card renderer ──────────────────────────────────────
function renderPropertyCard(property) {
  const image = property.property_images?.[0]?.image_url || FALLBACK_IMG;
  const ownerName = property.owners?.users?.name || "Owner";
  const type = property.property_type || "";
  const detailParts = [];
  const normalizedType = String(property.property_type || "").toLowerCase();

  if (property.bedrooms != null) detailParts.push(`${property.bedrooms} Bed`);
  if (property.bathrooms != null) detailParts.push(`${property.bathrooms} Bath`);
  if (property.office_rooms != null && normalizedType === "office") detailParts.push(`${property.office_rooms} Rooms`);
  if (property.shop_units != null && ["shop", "commercial"].includes(normalizedType)) detailParts.push(`${property.shop_units} Units`);
  if (property.area_sqft) detailParts.push(`${property.area_sqft} sqft`);

  const viewUrl = `${basePrefix}pages/public-property.html?id=${property.property_id}&source=discover`;

  return `
    <article class="property-card card">
      <div class="property-img-wrap">
        <img class="property-img" src="${image}" alt="${property.title || "Property"}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'" />
        ${type ? `<span class="property-type-badge">${type}</span>` : ""}
      </div>
      <div class="property-body">
        <h4 class="property-title">${property.title || "Untitled listing"}</h4>
        <p class="property-meta">📍 ${property.city || "-"}</p>
        ${detailParts.length ? `<p class="property-meta property-specs">${detailParts.join(" · ")}</p>` : ""}
        <p class="property-rent"><strong>${formatCurrency(property.rent_amount)}</strong> <span>/ month</span></p>
        <p class="property-meta" style="font-size:0.8rem">Listed by: ${ownerName}</p>
        <div class="actions-row compact-actions">
          <a class="btn btn-primary btn-sm" href="${viewUrl}">View details</a>
        </div>
      </div>
    </article>
  `;
}

function emptyState(title, message) {
  return `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon">🏠</div>
      <h4>${title}</h4>
      <p>${message}</p>
      <a class="btn btn-primary btn-sm" href="${basePrefix}pages/discover.html">Browse all listings</a>
    </div>
  `;
}

// ── Location chips ───────────────────────────────────────────────
// FIX: On the home page, clicking a city chip navigates to discover.html
// with the city as a URL param — instead of trying to filter on this page
// (which has no filter inputs).
function renderLocationChips(properties) {
  if (!popularLocations) return;

  const countByCity = properties.reduce((acc, property) => {
    const city = (property.city || "Other").trim();
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  const topCities = Object.entries(countByCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  popularLocations.innerHTML = topCities.length
    ? topCities.map(([city, count]) => `
        <button class="role-chip location-chip" type="button" data-city="${city}">
          ${city} <span class="chip-count">${count}</span>
        </button>
      `).join("")
    : `<p class="section-subtitle">No locations available yet.</p>`;

  if (!locationChipsBound) {
    popularLocations.addEventListener("click", (event) => {
      const chip = event.target.closest(".location-chip");
      if (!chip) return;
      const city = chip.dataset.city || "";
      // Navigate to discover page with city pre-filled as a URL param
      window.location.href = `${basePrefix}pages/discover.html?city=${encodeURIComponent(city)}`;
    });
    locationChipsBound = true;
  }
}

// ── Hero featured listing ────────────────────────────────────────
function populateHeroCard(properties) {
  const featured = properties[0];
  if (!featured) return;

  const metaEl   = document.getElementById("heroFeaturedMeta");
  const priceEl  = document.getElementById("heroFeaturedPrice");
  const specsEl  = document.getElementById("heroFeaturedSpecs");

  if (metaEl)  metaEl.textContent  = `${featured.title || "Available property"} · ${featured.city || ""}`;
  if (priceEl) priceEl.innerHTML   = `${formatCurrency(featured.rent_amount)} <span>/ month</span>`;

  if (specsEl) {
    const parts = [];
    if (featured.bedrooms  != null) parts.push(`🛏 ${featured.bedrooms}`);
    if (featured.bathrooms != null) parts.push(`🚿 ${featured.bathrooms}`);
    if (featured.area_sqft)         parts.push(`📐 ${featured.area_sqft} sqft`);
    specsEl.innerHTML = parts.map(p => `<span class="hero-card-spec">${p}</span>`).join("");
  }
}

// ── Hero stats ───────────────────────────────────────────────────
function populateHeroStats(properties) {
  const statListings = document.getElementById("statListings");
  const statCities   = document.getElementById("statCities");

  if (statListings) statListings.textContent = properties.length;
  if (statCities) {
    const uniqueCities = new Set(properties.map(p => p.city).filter(Boolean));
    statCities.textContent = uniqueCities.size;
  }
}

// ── Main loader ──────────────────────────────────────────────────
async function loadHomeListings() {
  const { data, error } = await listProperties({ status: "Available" });

  if (error) {
    if (newHomesGrid) {
      newHomesGrid.innerHTML = emptyState("Could not load listings", "Please check your connection and try again.");
    }
    showToast(error.message || "Failed to load properties", "error");
    return;
  }

  const properties = data || [];

  // Populate stats and featured card
  populateHeroStats(properties);
  populateHeroCard(properties);

  // Location chips
  renderLocationChips(properties);

  // New homes grid — show 6 most recent
  if (newHomesGrid) {
    const newest = properties.slice(0, 6);
    newHomesGrid.innerHTML = newest.length
      ? newest.map(renderPropertyCard).join("")
      : emptyState("No listings yet", "Be the first to list a property on NestFinder.");
  }
}

// ── Discover page: apply URL city param to city input ────────────
// This runs on discover.html when navigating from a location chip.
if (isDiscoverPage) {
  (function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const city   = params.get("city")   || "";
    const status = params.get("status") || "";
    const budget = params.get("budget") || "";

    if (city)   { const el = document.getElementById("homeCity");   if (el) el.value = city; }
    if (status) { const el = document.getElementById("homeStatus"); if (el) el.value = status; }
    if (budget) { const el = document.getElementById("homeBudget"); if (el) el.value = budget; }
  })();
}

void loadHomeListings();