import { requireUser } from "../core/auth.js";
import { PROPERTY_IMAGE_PLACEHOLDER, listProperties } from "../services/propertyService.js";
import { formatCurrency, showToast } from "../utils/helpers.js";

const user = await requireUser(["tenant"]);
if (!user) throw new Error("Unauthorised");

const browseGrid = document.getElementById("browseRentalsGrid");
const browseSummary = document.getElementById("browseSummary");
const searchInput = document.getElementById("browseSearchInput");
const cityFilter = document.getElementById("browseCityFilter");
const statusFilter = document.getElementById("browseStatusFilter");
const budgetFilter = document.getElementById("browseBudgetFilter");
const searchBtn = document.getElementById("browseSearchBtn");

function renderEmptyState(title, message) {
  return `
    <div class="empty-state card">
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
}

function renderPropertyCard(property) {
  const image = property.property_images?.[0]?.image_url || PROPERTY_IMAGE_PLACEHOLDER;
  const ownerName = property.owners?.users?.name || "Owner";
  const specs = [];
  const propertyType = property.property_type || "";

  if (property.bedrooms != null) specs.push(`${property.bedrooms} Bed`);
  if (property.bathrooms != null) specs.push(`${property.bathrooms} Bath`);
  if (property.office_rooms != null && propertyType.toLowerCase() === "office") specs.push(`${property.office_rooms} Rooms`);
  if (property.shop_units != null && ["shop", "commercial"].includes(propertyType.toLowerCase())) specs.push(`${property.shop_units} Units`);
  if (property.area_sqft) specs.push(`${property.area_sqft} sqft`);

  const viewUrl = `./property-details.html?id=${property.property_id}&source=browse-rentals`;

  return `
    <article class="property-card card">
      <div class="property-img-wrap">
        <img class="property-img" src="${image}" alt="${property.title || "Property"}" onerror="this.src='${PROPERTY_IMAGE_PLACEHOLDER}'" />
        ${propertyType ? `<span class="property-type-badge">${propertyType}</span>` : ""}
      </div>
      <div class="property-body">
        <h4 class="property-title">${property.title || "Untitled listing"}</h4>
        <p class="property-meta">Location: ${[property.address, property.city].filter(Boolean).join(", ") || "-"}</p>
        ${specs.length ? `<p class="property-meta property-specs">${specs.join(" | ")}</p>` : ""}
        <p class="property-rent"><strong>${formatCurrency(property.rent_amount)}</strong> <span>/ month</span></p>
        <p class="property-meta"><strong>Status:</strong> ${property.status || "Unknown"}</p>
        <p class="property-meta"><strong>Listed by:</strong> ${ownerName}</p>
        <div class="actions-row compact-actions">
          <a class="btn btn-primary" href="${viewUrl}">View Details</a>
        </div>
      </div>
    </article>
  `;
}

async function loadBrowseRentals() {
  if (!browseGrid) return;

  const search = searchInput?.value.trim() || "";
  const city = cityFilter?.value.trim() || "";
  const status = statusFilter?.value || "Available";
  const maxBudget = Number(budgetFilter?.value || 0);

  const { data, error } = await listProperties({
    search,
    city,
    status,
    maxBudget
  });

  if (error) {
    browseGrid.innerHTML = renderEmptyState("Unable to load rentals", "Please try again.");
    if (browseSummary) browseSummary.textContent = "Rental listings could not be loaded.";
    showToast(error.message || "Failed to load rentals", "error");
    return;
  }

  const listings = data || [];
  if (browseSummary) {
    const activeFilters = [search, city, status, maxBudget ? `up to Rs ${maxBudget}` : ""].filter(Boolean);
    browseSummary.textContent = listings.length
      ? `Showing ${listings.length} listing${listings.length === 1 ? "" : "s"}${activeFilters.length ? ` for ${activeFilters.join(", ")}` : ""}.`
      : "No listings matched the current filters.";
  }

  browseGrid.innerHTML = listings.length
    ? listings.map((property) => renderPropertyCard(property)).join("")
    : renderEmptyState("No rentals found", "Try another city, widen your budget, or reset the filters.");
}

searchBtn?.addEventListener("click", () => {
  void loadBrowseRentals();
});

[searchInput, cityFilter, budgetFilter].forEach((field) => {
  field?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void loadBrowseRentals();
  });
});

statusFilter?.addEventListener("change", () => {
  void loadBrowseRentals();
});

await loadBrowseRentals();
