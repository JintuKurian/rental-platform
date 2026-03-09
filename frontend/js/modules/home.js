import { listProperties } from "../services/propertyService.js";
import { formatCurrency, showToast } from "../utils/helpers.js";

const recommendedGrid  = document.getElementById("recommendedGrid");
const newHomesGrid     = document.getElementById("newHomesGrid");
const popularLocations = document.getElementById("popularLocations");
const homeSearch       = document.getElementById("homeSearch");

const FALLBACK_IMG = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=900&q=80";
const basePrefix   = window.location.pathname.includes("/pages/") ? "../" : "./";

// ── Property card with full detail row ───────────────────────
function renderPropertyCard(property) {
  const image     = property.property_images?.[0]?.image_url || FALLBACK_IMG;
  const ownerName = property.owners?.users?.name || "Owner";
  const type      = property.property_type || "";

  // Build a relevant detail line based on property type
  const detailParts = [];
  if (property.bedrooms    != null) detailParts.push(`🛏 ${property.bedrooms} Bed`);
  if (property.bathrooms   != null) detailParts.push(`🚿 ${property.bathrooms} Bath`);
  if (property.office_rooms != null && property.property_type?.toLowerCase() === "office") {
    detailParts.push(`🏢 ${property.office_rooms} Rooms`);
  }
  if (property.shop_units  != null && ["shop","commercial"].includes(property.property_type?.toLowerCase())) {
    detailParts.push(`🏪 ${property.shop_units} Units`);
  }
  if (property.area_sqft)  detailParts.push(`📐 ${property.area_sqft} sqft`);

  return `
    <article class="property-card card">
      <div class="property-img-wrap">
        <img class="property-img"
             src="${image}"
             alt="${property.title || "Property"}"
             onerror="this.src='${FALLBACK_IMG}'" />
        <span class="property-type-badge">${type}</span>
      </div>
      <div class="property-body">
        <h4 class="property-title">${property.title || "Untitled listing"}</h4>
        <p class="property-meta">📍 ${property.city || "—"}</p>
        ${detailParts.length
          ? `<p class="property-meta property-specs">${detailParts.join(" &nbsp;·&nbsp; ")}</p>`
          : ""}
        <p class="property-rent"><strong>${formatCurrency(property.rent_amount)}</strong> <span>/ month</span></p>
        <p class="property-meta">Listed by: ${ownerName}</p>
        <div class="actions-row compact-actions" style="margin-top:0.6rem">
          <a class="btn btn-secondary" href="${basePrefix}pages/property-details.html?id=${property.property_id}">View</a>
          <a class="btn btn-primary"   href="${basePrefix}pages/login.html">Contact Owner</a>
        </div>
      </div>
    </article>
  `;
}

// ── Popular locations (group by city) ────────────────────────
function renderLocationChips(properties) {
  if (!popularLocations) return;

  const countByCity = properties.reduce((acc, p) => {
    const city = (p.city || "Other").trim();
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  const topCities = Object.entries(countByCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  popularLocations.innerHTML = topCities.length
    ? topCities.map(([city, count]) =>
        `<button class="role-chip location-chip" type="button" data-city="${city}">
          📍 ${city} <span class="chip-count">${count}</span>
        </button>`
      ).join("")
    : `<p class="section-subtitle">No locations available yet.</p>`;

  // Clicking a city chip pre-fills the City field and searches
  popularLocations.addEventListener("click", (e) => {
    const chip = e.target.closest(".location-chip");
    if (!chip) return;
    const cityInput = document.getElementById("homeCity");
    if (cityInput) { cityInput.value = chip.dataset.city; loadHomeListings(); }
  });
}

// ── Empty state helper ────────────────────────────────────────
function emptyState(icon, title, msg) {
  return `<div class="empty-state card">
    <p class="empty-state-icon" aria-hidden="true">${icon}</p>
    <h4>${title}</h4>
    <p>${msg}</p>
  </div>`;
}

// ── Main load function ────────────────────────────────────────
async function loadHomeListings() {
  const city      = document.getElementById("homeCity")?.value.trim() || "";
  const status    = document.getElementById("homeStatus")?.value || "";
  const maxBudget = Number(document.getElementById("homeBudget")?.value || 0);

  // All filters including budget go to DB — no client-side filtering needed
  const { data, error } = await listProperties({ city, status, maxBudget });

  if (error) {
    showToast("Unable to load properties", "error");
    return;
  }

  const properties  = data || [];
  const available   = properties.filter((p) => p.status === "Available");

  // Popular locations from all returned properties
  renderLocationChips(properties);

  // Recommended = Available properties (up to 8)
  if (recommendedGrid) {
    recommendedGrid.innerHTML = available.length
      ? available.slice(0, 8).map(renderPropertyCard).join("")
      : emptyState("🔍", "No properties match these filters",
          "Try a different city, choose another status, or increase your budget.");
  }

  // Newly added = all properties ordered by created_at desc (already ordered by service)
  if (newHomesGrid) {
    const newest = properties.slice(0, 6);
    newHomesGrid.innerHTML = newest.length
      ? newest.map(renderPropertyCard).join("")
      : emptyState("🏘️", "No new homes yet", "Recently added listings will appear here.");
  }
}

// ── Events ────────────────────────────────────────────────────
if (homeSearch) homeSearch.addEventListener("click", loadHomeListings);

// Enter key in text inputs
["homeCity", "homeBudget"].forEach((id) => {
  document.getElementById(id)?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); loadHomeListings(); }
  });
});

// Retry buttons in empty states
document.addEventListener("click", (e) => {
  const btn = e.target;
  if (!(btn instanceof HTMLButtonElement)) return;
  if (["retryDiscoverSearch", "refreshNewHomes", "refreshPopularLocations"].includes(btn.id)) {
    loadHomeListings();
  }
});

// ── Init ─────────────────────────────────────────────────────
// Read URL query params — set by the home page hero search form.
// e.g. discover.html?city=Bangalore&status=Available&budget=20000
(function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const city   = params.get("city")   || "";
  const status = params.get("status") || "";
  const budget = params.get("budget") || "";

  if (city)   { const el = document.getElementById("homeCity");   if (el) el.value = city; }
  if (status) { const el = document.getElementById("homeStatus"); if (el) el.value = status; }
  if (budget) { const el = document.getElementById("homeBudget"); if (el) el.value = budget; }
})();

loadHomeListings();

