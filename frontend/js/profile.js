import supabaseClient from "./core/supabaseClient.js";
import { showToast } from "./utils/helpers.js";

const profileForm = document.getElementById("profileForm");
const editProfileBtn = document.getElementById("editProfileBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");

let isEditing = false;
let baseUser = null;
let roleProfile = null;

function getField(id) {
  return document.getElementById(id);
}

function renderProfile(profile) {
  getField("profileName").value = profile.name || "";
  getField("profileEmail").value = profile.email || "";
  getField("profileRole").value = profile.role || "";
  getField("profilePhone").value = profile.phone || "";
  getField("profileCity").value = profile.city || "";
}

function toggleEditMode(enabled) {
  isEditing = enabled;
  const role = baseUser?.role;
  const editable = enabled && (role === "owner" || role === "tenant");

  getField("profileName").disabled = true;
  getField("profileEmail").disabled = true;
  getField("profileRole").disabled = true;
  getField("profilePhone").disabled = !editable;
  getField("profileCity").disabled = !editable;

  editProfileBtn.hidden = enabled;
  saveProfileBtn.hidden = !enabled;
  cancelProfileBtn.hidden = !enabled;
}

async function loadProfile() {
  const email = localStorage.getItem("loggedInUser") || localStorage.getItem("userEmail");
  if (!email) {
    window.location.href = "/pages/login.html";
    return;
  }

  const { data: user, error: userError } = await supabaseClient
    .from("users")
    .select("user_id,name,email,role")
    .eq("email", email)
    .single();

  if (userError || !user) {
    showToast(userError?.message || "Unable to load user profile", "error");
    window.location.href = "/pages/login.html";
    return;
  }

  baseUser = user;
  roleProfile = null;

  if (user.role === "owner") {
    const { data: owner, error } = await supabaseClient
      .from("owners")
      .select("phone,address,city,owner_type")
      .eq("user_id", user.user_id)
      .single();

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
      .single();

    if (error) {
      showToast(error.message || "Unable to load tenant profile", "error");
      return;
    }

    roleProfile = tenant;
  }

  const merged = {
    ...user,
    ...(roleProfile || {})
  };

  renderProfile(merged);
  localStorage.setItem("appUser", JSON.stringify(merged));
  localStorage.setItem("userId", String(user.user_id));
  localStorage.setItem("role", user.role);
  toggleEditMode(false);
}

function restoreInitialValues() {
  renderProfile({ ...baseUser, ...(roleProfile || {}) });
  toggleEditMode(false);
}

async function saveProfile() {
  if (!baseUser) return;

  const phone = getField("profilePhone").value.trim();
  const city = getField("profileCity").value.trim();

  if (baseUser.role === "owner") {
    const { error } = await supabaseClient
      .from("owners")
      .update({
        phone,
        address: roleProfile?.address || null,
        city,
        owner_type: roleProfile?.owner_type || "Local"
      })
      .eq("user_id", baseUser.user_id);

    if (error) {
      showToast(error.message || "Failed to save profile", "error");
      return;
    }
  }

  if (baseUser.role === "tenant") {
    const { error } = await supabaseClient
      .from("tenants")
      .update({
        phone,
        occupation: roleProfile?.occupation || null,
        permanent_address: roleProfile?.permanent_address || null,
        city
      })
      .eq("user_id", baseUser.user_id);

    if (error) {
      showToast(error.message || "Failed to save profile", "error");
      return;
    }
  }

  await loadProfile();
  showToast("Profile updated successfully", "success");
}

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () => {
    toggleEditMode(true);
  });
}

if (cancelProfileBtn) {
  cancelProfileBtn.addEventListener("click", () => {
    restoreInitialValues();
  });
}

if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveProfile();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user");
    localStorage.removeItem("appUser");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "/index.html";
  });
}

await loadProfile();
