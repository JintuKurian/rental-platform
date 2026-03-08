import supabaseClient from "./supabaseClient.js";
import { setFlashMessage } from "../utils/helpers.js";

const {
  data: { session: initialSession }
} = await supabaseClient.auth.getSession();

let cachedSession = initialSession;

supabaseClient.auth.onAuthStateChange((_event, session) => {
  cachedSession = session;
});

function getStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Invalid user session data:", error);
    return null;
  }
}

function clearStoredUser() {
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
}

async function refreshSession() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();
  cachedSession = session;
  return session;
}

export function getCurrentUser() {
  const user = getStoredUser();

  if (!cachedSession) {
    clearStoredUser();
    return null;
  }

  return user;
}

export function requireUser(allowedRoles = []) {
  const user = getStoredUser();

  if (!user) {
    window.location.href = "../pages/login.html";
    return null;
  }

  if (!cachedSession) {
    void refreshSession().then((session) => {
      if (!session) {
        clearStoredUser();
        window.location.href = "../pages/login.html";
      }
    });

    clearStoredUser();
    window.location.href = "../pages/login.html";
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    setFlashMessage("Access denied", "error", "auth");
    window.location.href = "../pages/login.html";
    return null;
  }

  return user;
}

export function logout() {
  setFlashMessage("Logout successful", "success", "auth");

  void supabaseClient.auth.signOut();
  localStorage.clear();

  window.location.href = "../pages/login.html";
}
