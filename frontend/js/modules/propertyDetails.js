import { listProperties, listPropertyImagesForPropertyId, PROPERTY_IMAGE_PLACEHOLDER } from "../services/propertyService.js";
import { formatCurrency } from "../utils/helpers.js";
import supabaseClient from "../core/supabaseClient.js";

const details    = document.getElementById("propertyDetails");
const propertyId = Number(new URLSearchParams(window.location.search).get("id"));

// ── Get current user role (if logged in) ─────────────────────
// We read from localStorage cache — no auth redirect needed on this page.
let currentUser = null;
try {
  const raw = localStorage.getItem("appUser");
  if (raw) currentUser = JSON.parse(raw);
} catch (_) { /* not logged in */ }

// ── Resolve owner id from stored user ────────────────────────
async function getOwnerIdForCurrentUser() {
  if (!currentUser?.user_id) return null;
  const { data } = await supabaseClient
    .from("owners")
    .select("owner_id")
    .eq("user_id", currentUser.user_id)
    .maybeSingle();
  return data?.owner_id ?? null;
}

function getPropertyThumbnail(property) {
  return property.property_images?.[0]?.image_url || PROPERTY_IMAGE_PLACEHOLDER;
}

async function loadProperty() {
  if (!propertyId) {
    details.innerHTML = "<div class='empty-state'>Invalid property ID.</div>";
    return;
  }

  // Fetch single property by ID directly
  const { data: rows, error } = await listProperties();
  if (error) {
    details.innerHTML = "<div class='empty-state'>Unable to load property details.</div>";
    return;
  }

  const property = (rows || []).find((row) => row.property_id === propertyId);
  if (!property) {
    details.innerHTML = "<div class='empty-state'>Property not found.</div>";
    return;
  }

  // Fetch images separately (more reliable)
  const { data: propertyImages } = await listPropertyImagesForPropertyId(property.property_id);
  const resolvedImages = (propertyImages || []).map((row) => ({ image_url: row.image_url }));
  property.property_images = resolvedImages;

  const gallery = resolvedImages.length
    ? resolvedImages.map((img) =>
        `<img src='${img.image_url}' alt='property image'
              onerror="this.src='${PROPERTY_IMAGE_PLACEHOLDER}'" />`
      ).join("")
    : `<img src="${PROPERTY_IMAGE_PLACEHOLDER}" alt="property image" />`;

  // ── Track recently viewed ─────────────────────────────────
  try {
    const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    if (!recentlyViewed.includes(property.property_id)) {
      recentlyViewed.unshift(property.property_id);
      localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed.slice(0, 8)));
    }
  } catch (_) { /* ignore */ }

  // ── Determine if current user is the owner of THIS property ─
  const myOwnerId = await getOwnerIdForCurrentUser();
  const isOwner   = myOwnerId != null && myOwnerId === property.owner_id;

  // ── Contact owner button (only for tenant, admin, or logged-out guest) ─
  const ownerEmail = property.owners?.users?.email || "";
  const contactBtn = (!isOwner && ownerEmail)
    ? `<a class="btn btn-primary" href="mailto:${ownerEmail}">Contact Owner</a>`
    : "";

  // ── Owner-only action buttons ─────────────────────────────
  const ownerBtns = isOwner
    ? `<a class="btn btn-secondary" href="./property-list.html">Back to my properties</a>`
    : `<a class="btn btn-secondary" href="javascript:history.back()">Back to listings</a>`;

  // ── Specs ─────────────────────────────────────────────────
  const type  = (property.property_type || "").toLowerCase();
  const specs = [];
  if (property.bedrooms    != null) specs.push(`🛏 ${property.bedrooms} Bedroom${property.bedrooms !== 1 ? "s" : ""}`);
  if (property.bathrooms   != null) specs.push(`🚿 ${property.bathrooms} Bathroom${property.bathrooms !== 1 ? "s" : ""}`);
  if (property.office_rooms != null && type === "office")                      specs.push(`🏢 ${property.office_rooms} Office Room${property.office_rooms !== 1 ? "s" : ""}`);
  if (property.shop_units  != null && ["shop","commercial"].includes(type))    specs.push(`🏪 ${property.shop_units} Shop Unit${property.shop_units !== 1 ? "s" : ""}`);
  if (property.area_sqft)  specs.push(`📐 ${property.area_sqft} sqft`);

  const specsHtml = specs.length
    ? `<ul class="property-spec-list">${specs.map((s) => `<li>${s}</li>`).join("")}</ul>`
    : "";

  details.innerHTML = `
    <img style="width:100%;max-height:420px;object-fit:cover;border-radius:var(--radius-md);"
         src="${getPropertyThumbnail(property)}"
         alt="${property.title || "Property"}"
         onerror="this.src='${PROPERTY_IMAGE_PLACEHOLDER}'" />

    <div style="margin-top:1.25rem" class="split-grid">
      <div>
        <h2>${property.title || "Property"}</h2>
        <p class="section-subtitle">📍 ${[property.address, property.city].filter(Boolean).join(", ")}</p>
        ${property.allowed_usage ? `<p><strong>Usage:</strong> ${property.allowed_usage}</p>` : ""}
        ${specsHtml}
        ${resolvedImages.length > 1 ? `<div class="gallery-preview" style="margin-top:1rem">${gallery}</div>` : ""}
      </div>

      <div class="panel card">
        <h3>Rent</h3>
        <p class="kpi-value">${formatCurrency(property.rent_amount)} <span style="font-size:1rem;font-weight:400">/ month</span></p>
        <p class="property-meta">Availability: <strong>${property.status || "Unknown"}</strong></p>
        <p class="property-meta">Listed by: ${property.owners?.users?.name || "Owner"}</p>
        <p class="property-meta">Type: ${property.property_type || "—"}</p>
        <div class="actions-row" style="margin-top:1rem">
          ${contactBtn}
          ${ownerBtns}
        </div>
      </div>
    </div>
  `;
}

loadProperty();
