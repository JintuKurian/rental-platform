import { requireUser, logout } from "../core/auth.js";
import { getOwnerByUserId, saveOwnerProfile } from "../services/userService.js";
import { displaySuccessMessage, showToast } from "../utils/helpers.js";

const user = requireUser(["admin", "owner", "tenant"]);
if (!user) throw new Error("Unauthorized");

const profileDetails = document.getElementById("profileDetails");
const ownerProfileEditForm = document.getElementById("ownerProfileEditForm");
const editProfileBtn = document.getElementById("editProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");

const phoneInput = document.getElementById("profilePhone");
const ownerTypeInput = document.getElementById("profileOwnerType");
const cityInput = document.getElementById("profileCity");
const addressInput = document.getElementById("profileAddress");

let isEditMode = false;
let ownerProfile = null;

function valueOrFallback(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function setOwnerFieldInteractivity(enabled) {
  phoneInput.disabled = !enabled;
  ownerTypeInput.disabled = !enabled;
  cityInput.disabled = !enabled;
  addressInput.disabled = !enabled;
}

function renderOwnerInputs(profile) {
  phoneInput.value = profile?.phone || "";
  ownerTypeInput.value = profile?.owner_type || "Local";
  cityInput.value = profile?.city || "";
  addressInput.value = profile?.address || "";
}

function renderProfileDetails() {
  profileDetails.innerHTML = `
    <article class="profile-item"><p class="profile-label">Name</p><p class="profile-value">${valueOrFallback(user.name)}</p></article>
    <article class="profile-item"><p class="profile-label">Email</p><p class="profile-value">${valueOrFallback(user.email)}</p></article>
    <article class="profile-item"><p class="profile-label">Role</p><p class="profile-value role-chip">${valueOrFallback(user.role)}</p></article>
    <article class="profile-item"><p class="profile-label">User ID</p><p class="profile-value">${valueOrFallback(user.user_id)}</p></article>
    <article class="profile-item"><p class="profile-label">Phone</p><p class="profile-value">${valueOrFallback(ownerProfile?.phone)}</p></article>
    <article class="profile-item"><p class="profile-label">Owner Type</p><p class="profile-value">${valueOrFallback(ownerProfile?.owner_type)}</p></article>
    <article class="profile-item"><p class="profile-label">City</p><p class="profile-value">${valueOrFallback(ownerProfile?.city)}</p></article>
    <article class="profile-item"><p class="profile-label">Address</p><p class="profile-value">${valueOrFallback(ownerProfile?.address)}</p></article>
  `;
}

async function loadOwnerProfile() {
  if (user.role !== "owner") {
    ownerProfileEditForm.style.display = "none";
    editProfileBtn.style.display = "none";
    ownerProfile = null;
    renderProfileDetails();
    return;
  }

  const { data, error } = await getOwnerByUserId(user.user_id);
  if (error) {
    showToast("Unable to fetch owner profile details", "error");
    ownerProfile = null;
    renderProfileDetails();
    return;
  }

  ownerProfile = data || null;
  renderOwnerInputs(ownerProfile);
  renderProfileDetails();
}

editProfileBtn.addEventListener("click", async () => {
  if (user.role !== "owner") return;

  if (!isEditMode) {
    isEditMode = true;
    setOwnerFieldInteractivity(true);
    editProfileBtn.textContent = "Save Changes";
    return;
  }

  const payload = {
    phone: phoneInput.value.trim(),
    owner_type: ownerTypeInput.value.trim(),
    city: cityInput.value.trim(),
    address: addressInput.value.trim()
  };

  if (!payload.phone || !payload.owner_type || !payload.city || !payload.address) {
    showToast("Please fill all profile fields before saving", "error");
    return;
  }

  const { data, error } = await saveOwnerProfile(user.user_id, payload);
  if (error) {
    showToast(error.message || "Unable to save owner profile", "error");
    return;
  }

  ownerProfile = data;
  renderOwnerInputs(ownerProfile);
  renderProfileDetails();
  displaySuccessMessage("Profile saved successfully");

  isEditMode = false;
  setOwnerFieldInteractivity(false);
  editProfileBtn.textContent = "Edit Profile";
});

logoutBtn.addEventListener("click", logout);
setOwnerFieldInteractivity(false);
loadOwnerProfile();
