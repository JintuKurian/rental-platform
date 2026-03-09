import supabaseClient from "./core/supabaseClient.js";
import { logout, requireUser, storeUserSession } from "./core/auth.js";
import { showToast } from "./utils/helpers.js";

const profileForm      = document.getElementById("profileForm");
const profileCard      = document.querySelector(".profile-page-card");
const editProfileBtn   = document.getElementById("editProfileBtn");
const saveProfileBtn   = document.getElementById("saveProfileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const logoutBtn        = document.getElementById("logoutBtn");

let baseUser       = null;
let roleProfile    = null;
let originalProfile = null;
let editMode       = false;

// ── Helpers ──────────────────────────────────────────────────
function getField(id)     { return document.getElementById(id); }
function getValueNode(id) { return document.getElementById(`${id}View`); }
function getEditableFields() {
  return [getField("profilePhone"), getField("profileCity")];
}
function mergedProfile() {
  return { ...baseUser, ...(roleProfile || {}) };
}

function getUserInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Render ────────────────────────────────────────────────────
function renderProfile(profile) {
  // Input values
  getField("profileName").value  = profile.name  || "";
  getField("profileEmail").value = profile.email || "";
  getField("profileRole").value  = profile.role  || "";
  getField("profilePhone").value = profile.phone || "";
  getField("profileCity").value  = profile.city  || "";

  // View text
  getValueNode("profileName").textContent  = profile.name  || "—";
  getValueNode("profileEmail").textContent = profile.email || "—";
  getValueNode("profileRole").textContent  = profile.role  || "—";
  getValueNode("profilePhone").textContent = profile.phone || "—";
  getValueNode("profileCity").textContent  = profile.city  || "—";

  // Hero strip
  const heroAvatar = document.getElementById("profileHeroAvatar");
  const heroName   = document.getElementById("profileHeroName");
  const heroRole   = document.getElementById("profileHeroRole");
  if (heroAvatar) heroAvatar.textContent = getUserInitials(profile.name || profile.email || "U");
  if (heroName)   heroName.textContent   = profile.name  || profile.email || "—";
  if (heroRole)   heroRole.textContent   = profile.role  || "—";
}

// ── Edit mode toggle ──────────────────────────────────────────
function setEditMode(enabled) {
  editMode = Boolean(enabled) && (baseUser?.role === "owner" || baseUser?.role === "tenant");

  getEditableFields().forEach((field) => {
    field.readOnly = !editMode;
  });

  profileCard?.classList.toggle("is-editing", editMode);
  editProfileBtn.hidden   = editMode;
  saveProfileBtn.hidden   = !editMode;
  cancelProfileBtn.hidden = !editMode;
}

// ── Load ──────────────────────────────────────────────────────
async function loadProfile() {
  const user = await requireUser(["admin", "owner", "tenant"]);
  if (!user) return;

  baseUser = {
    user_id: user.user_id,
    name:    user.name,
    email:   user.email,
    role:    user.role
  };

  roleProfile = null;

  if (user.role === "owner") {
    const { data: owner, error } = await supabaseClient
      .from("owners")
      .select("phone,address,city,owner_type")
      .eq("user_id", user.user_id)
      .maybeSingle();

    if (error) {
      showToast(error.message || "Unable to load owner profile", "error");
      return;
    }
    roleProfile = owner;
  }

  if (user.role === "tenant") {
    const { data: tenant, error } = await supabaseClient
      .from("tenants")
      .select("phone,occupation,permanent_address,city")
      .eq("user_id", user.user_id)
      .maybeSingle();

    if (error) {
      showToast(error.message || "Unable to load tenant profile", "error");
      return;
    }
    roleProfile = tenant;
  }

  const merged = mergedProfile();
  originalProfile = {
    name:  merged.name  || "",
    email: merged.email || "",
    role:  merged.role  || "",
    phone: merged.phone || "",
    city:  merged.city  || ""
  };

  renderProfile(originalProfile);
  storeUserSession(user, merged);
  setEditMode(false);
}

function restoreInitialValues() {
  if (!originalProfile) return;
  renderProfile(originalProfile);
  setEditMode(false);
}

// ── Save ──────────────────────────────────────────────────────
async function saveProfile() {
  if (!baseUser || !editMode) return;

  const phoneValue   = getField("profilePhone").value.trim();
  const cityValue    = getField("profileCity").value.trim();
  const addressValue = roleProfile?.address || null;

  if (baseUser.role === "owner") {
    const { error } = await supabaseClient
      .from("owners")
      .upsert(
        { user_id: baseUser.user_id, phone: phoneValue, city: cityValue, address: addressValue },
        { onConflict: "user_id" }
      );

    if (error) { showToast(error.message || "Failed to save profile", "error"); return; }
  }

  if (baseUser.role === "tenant") {
    const { error } = await supabaseClient
      .from("tenants")
      .upsert(
        {
          user_id: baseUser.user_id,
          phone:             phoneValue,
          city:              cityValue,
          occupation:        roleProfile?.occupation        || null,
          permanent_address: roleProfile?.permanent_address || null
        },
        { onConflict: "user_id" }
      );

    if (error) { showToast(error.message || "Failed to save profile", "error"); return; }
  }

  await loadProfile();
  showToast("Profile updated successfully ✓", "success");
}

// ── Events ────────────────────────────────────────────────────
editProfileBtn?.addEventListener("click", () => setEditMode(true));
cancelProfileBtn?.addEventListener("click", restoreInitialValues);
profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveProfile();
});
logoutBtn?.addEventListener("click", () => { void logout(); });

await loadProfile();
