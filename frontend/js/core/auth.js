import { getUserByEmail } from "../services/userService.js";

function getLoginPath() {
  return "/pages/login.html";
}

function getIndexPath() {
  return "/index.html";
}

export function getStoredAuthUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  const raw = localStorage.getItem("appUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeUserSession(authUser, appUser = null) {
  if (authUser) {
    localStorage.setItem("user", JSON.stringify(authUser));
  }

  if (appUser) {
    localStorage.setItem("loggedInUser", appUser.email || "");
    localStorage.setItem("appUser", JSON.stringify(appUser));
    localStorage.setItem("userId", String(appUser.user_id));
    localStorage.setItem("role", appUser.role || "");
    localStorage.setItem("name", appUser.name || "");
    localStorage.setItem("userEmail", appUser.email || "");
  }
}

export function clearStoredUser() {
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("user");
  localStorage.removeItem("appUser");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("userEmail");
}

export async function syncStoredUserWithSession() {
  const email = localStorage.getItem("loggedInUser") || localStorage.getItem("userEmail");
  if (!email) {
    clearStoredUser();
    return null;
  }

  const { data: appUser } = await getUserByEmail(email);
  if (!appUser) {
    clearStoredUser();
    return null;
  }

  storeUserSession(getStoredAuthUser(), appUser);
  return appUser;
}

export async function requireUser(allowedRoles = []) {
  const user = await syncStoredUserWithSession();
  if (!user) {
    window.location.href = getLoginPath();
    return null;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = getLoginPath();
    return null;
  }

  return user;
}

export async function logout() {
  clearStoredUser();
  window.location.href = getIndexPath();
}
