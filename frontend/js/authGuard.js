import { getUserByEmail } from "./services/userService.js";

const DASHBOARD_GUARDS = {
  "/dashboards/owner.html": "owner",
  "/dashboards/tenant.html": "tenant",
  "/dashboards/admin.html": "admin"
};

function updatePublicAuthButtonsVisibility() {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const userEmail = localStorage.getItem("loggedInUser") || localStorage.getItem("userEmail");

  if (userEmail) {
    if (loginBtn) loginBtn.style.display = "none";
    if (signupBtn) signupBtn.style.display = "none";
    return;
  }

  if (loginBtn) loginBtn.style.display = "";
  if (signupBtn) signupBtn.style.display = "";
}

function getDashboardRoleForPath(pathname) {
  const normalized = Object.keys(DASHBOARD_GUARDS).find((path) => pathname.endsWith(path));
  return normalized ? DASHBOARD_GUARDS[normalized] : null;
}

async function protectDashboardPage() {
  const requiredRole = getDashboardRoleForPath(window.location.pathname);
  if (!requiredRole) return;

  const email = localStorage.getItem("loggedInUser") || localStorage.getItem("userEmail");
  if (!email) {
    window.location.href = "/pages/login.html";
    return;
  }

  const { data: user, error } = await getUserByEmail(email);
  if (error || !user || user.role !== requiredRole) {
    localStorage.removeItem("loggedInUser");
    window.location.href = "/pages/login.html";
    return;
  }

  localStorage.setItem("loggedInUser", user.email);
  localStorage.setItem("appUser", JSON.stringify(user));
  localStorage.setItem("userId", String(user.user_id));
  localStorage.setItem("role", user.role);
  localStorage.setItem("userEmail", user.email);
}

document.addEventListener("DOMContentLoaded", async () => {
  await protectDashboardPage();
  updatePublicAuthButtonsVisibility();
});
