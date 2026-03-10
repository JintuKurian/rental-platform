import { requireUser } from "../core/auth.js";
import { listProperties, getPropertiesByOwnerUserId, deleteProperty, updateProperty, PROPERTY_IMAGE_PLACEHOLDER } from "../services/propertyService.js";
import { formatCurrency, showToast } from "../utils/helpers.js";
import supabaseClient from "../core/supabaseClient.js";

// Wrap everything in an async IIFE so top-level `return` is legal
(async () => {

const user = await requireUser(["admin", "owner", "tenant"]);
if (!user) return;

// ── Resolve owner_id for the logged-in user (owner role only) ─
// We compare against property.owner_id (FK integer) — more reliable than
// the nested owners?.user_id from the join.
let myOwnerId = null;
if (user.role === "owner") {
  const { data: ownerRow } = await supabaseClient
    .from("owners")
    .select("owner_id")
    .eq("user_id", user.user_id)
    .maybeSingle();
  myOwnerId = ownerRow?.owner_id ?? null;
}

const cityFilter    = document.getElementById("cityFilter");
const statusFilter  = document.getElementById("statusFilter");
const searchInput   = document.getElementById("searchInput");
const searchBtn     = document.getElementById("searchBtn");
const propertyCards = document.getElementById("propertyCards");

function getPropertyThumbnail(property) {
  return property.property_images?.[0]?.image_url || PROPERTY_IMAGE_PLACEHOLDER;
}

function statusClass(status) {
  const value = (status || "").toLowerCase();
  if (value === "available") return "status-pill status-available";
  if (value === "rented")    return "status-pill status-rented";
  return "status-pill status-inactive";
}

function getRelevantDetails(property) {
  const type  = (property.property_type || "").toLowerCase();
  const parts = [];

  if (property.bedrooms    != null) parts.push(`🛏 ${property.bedrooms} Bed`);
  if (property.bathrooms   != null) parts.push(`🚿 ${property.bathrooms} Bath`);
  if (property.office_rooms != null && type === "office")                       parts.push(`🏢 ${property.office_rooms} Rooms`);
  if (property.shop_units   != null && ["shop","commercial"].includes(type))    parts.push(`🏪 ${property.shop_units} Units`);
  if (property.area_sqft)   parts.push(`📐 ${property.area_sqft} sqft`);

  return parts.length ? parts.join(" &nbsp;·&nbsp; ") : "—";
}

function canEdit(property) {
  if (user.role !== "owner") return false;
  // Compare using the resolved owner_id (more reliable)
  return myOwnerId != null && myOwnerId === property.owner_id;
}

function canDelete(property) {
  if (user.role !== "owner") return false;
  return myOwnerId != null && myOwnerId === property.owner_id;
}

async function fetchProperties() {
  const searchVal = searchInput?.value.trim() || "";
  const cityVal   = cityFilter?.value.trim()   || "";
  const statusVal = statusFilter?.value.trim()  || "";
  const maxBudget = Number(document.getElementById("budgetFilter")?.value || 0);

  let data, error;

  if (user.role === "owner") {
    ({ data, error } = await getPropertiesByOwnerUserId(user.user_id, {
      city:   cityVal,
      status: statusVal,
      search: searchVal
    }));
  } else if (user.role === "tenant") {
    ({ data, error } = await listProperties({
      city:      cityVal,
      status:    "Available",
      search:    searchVal,
      maxBudget
    }));
  } else {
    ({ data, error } = await listProperties({
      city:      cityVal,
      status:    statusVal,
      search:    searchVal,
      maxBudget
    }));
  }

  if (error) {
    showToast("Failed to fetch properties", "error");
    return;
  }

  renderCards(data || []);
}

function renderCards(properties) {
  if (!properties.length) {
    propertyCards.innerHTML = `
      <div class='empty-state card'>
        <h3>No properties found</h3>
        <p>Adjust your filters or add a property to continue.</p>
        ${user.role === "owner"
          ? "<a class='btn btn-primary' href='./add-property.html'>Add Property</a>"
          : "<button class='btn btn-primary' type='button' id='resetPropertyFilters'>Reset Filters</button>"}
      </div>
    `;
    return;
  }

  propertyCards.innerHTML = properties.map((property) => {
    const imageUrl  = getPropertyThumbnail(property);
    const ownerName = property.owners?.users?.name || "Owner";
    const typeLabel = property.property_type || "";
    const specs     = getRelevantDetails(property);

    const ownerActions = `
      <a class="btn btn-primary" href="./property-details.html?id=${property.property_id}">View</a>
      ${canEdit(property)   ? `<button class='btn btn-secondary editBtn'   data-id='${property.property_id}'>Edit</button>`   : ""}
      ${canDelete(property) ? `<button class='btn btn-danger    deleteBtn' data-id='${property.property_id}'>Delete</button>` : ""}
    `;

    const tenantActions = `
      <a class="btn btn-primary" href="./property-details.html?id=${property.property_id}">View</a>
      ${property.owners?.users?.email
        ? `<a class="btn btn-secondary" href="mailto:${property.owners.users.email}">Contact Owner</a>`
        : ""}
    `;

    return `
      <article class="property-card card">
        <div class="property-img-wrap">
          <img class="property-img"
               src="${imageUrl}"
               alt="${property.title || "Property"}"
               onerror="this.src='${PROPERTY_IMAGE_PLACEHOLDER}'" />
          ${typeLabel ? `<span class="property-type-badge">${typeLabel}</span>` : ""}
        </div>
        <div class="property-body">
          <h4 class="property-title">${property.title || "Untitled listing"}</h4>
          <p class="property-meta">📍 ${property.city || "—"}</p>
          <p class="property-meta property-specs">${specs}</p>
          <p class="property-rent"><strong>${formatCurrency(property.rent_amount)}</strong> <span>/ month</span></p>
          <p class="property-meta"><strong>Status:</strong> <span class="${statusClass(property.status)}">${property.status || "Unknown"}</span></p>
          <p class="property-meta"><strong>Owner:</strong> ${ownerName}</p>
          <div class="actions-row compact-actions">
            ${user.role === "tenant" ? tenantActions : ownerActions}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

async function handleDelete(propertyId) {
  if (!confirm("Are you sure you want to delete this property?")) return;
  const { error } = await deleteProperty(propertyId);
  if (error) { showToast("Failed to delete property", "error"); return; }
  showToast("Property deleted successfully", "success");
  localStorage.setItem("propertiesUpdatedAt", String(Date.now()));
  fetchProperties();
}

async function handleEdit(propertyId) {
  const newTitle = prompt("Enter updated property title:");
  if (!newTitle) return;
  const newCity = prompt("Enter updated city:");
  if (!newCity) return;
  const newRent = prompt("Enter updated monthly rent:");
  if (!newRent) return;

  const { error } = await updateProperty(propertyId, {
    title:       newTitle.trim(),
    city:        newCity.trim(),
    rent_amount: Number(newRent)
  });

  if (error) { showToast("Failed to update property", "error"); return; }
  showToast("Property updated successfully", "success");
  fetchProperties();
}

// ── Event listeners ───────────────────────────────────────────
searchBtn?.addEventListener("click", fetchProperties);

[searchInput, cityFilter].forEach((input) => {
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); fetchProperties(); }
  });
});

propertyCards.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  if (target.id === "resetPropertyFilters") {
    if (cityFilter)   cityFilter.value   = "";
    if (statusFilter) statusFilter.value = "";
    if (searchInput)  searchInput.value  = "";
    fetchProperties();
    return;
  }

  const propertyId = Number(target.dataset.id);
  if (!propertyId) return;

  if (target.classList.contains("deleteBtn")) await handleDelete(propertyId);
  if (target.classList.contains("editBtn"))   await handleEdit(propertyId);
});

// ── Init ─────────────────────────────────────────────────────
fetchProperties();

if (user.role === "tenant" && statusFilter) {
  statusFilter.value    = "Available";
  statusFilter.disabled = true;
}

window.addEventListener("storage", (event) => {
  if (event.key === "propertiesUpdatedAt") fetchProperties();
});

})(); // end IIFE
