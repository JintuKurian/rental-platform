import { getStoredUser, syncStoredUserWithSession, watchAuthState } from "../js/core/auth.js";

const navbarMarkupCache = new Map();
let renderSequence = 0;

function getBasePrefix() {
  const path = window.location.pathname;
  if (path.includes("/pages/") || path.includes("/dashboards/")) return "../";
  return "./";
}

function getNavbarPath(role) {
  if (role === "owner")  return "components/navbars/ownerNavbar.html";
  if (role === "tenant") return "components/navbars/tenantNavbar.html";
  if (role === "admin")  return "components/navbars/adminNavbar.html";
  return null;
}

function getUserInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function markActiveLinks(root) {
  const currentPath = window.location.pathname;
  root.querySelectorAll("a[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const normalizedHref = href.replace(/^\.\.\//, "/");
    const isActive = currentPath.endsWith(normalizedHref) || currentPath === normalizedHref;
    link.classList.toggle("active", isActive);
  });
}

function populateUserChip(container, user) {
  if (!user) return;
  const avatarEl = container.querySelector("#navAvatar");
  const nameEl   = container.querySelector("#navUserName");
  if (avatarEl) avatarEl.textContent = getUserInitials(user.name || user.email || "U");
  if (nameEl)   nameEl.textContent   = user.name || user.email || "User";
}

function wireHamburger(container) {
  const toggle = container.querySelector("#navToggle");
  const links  = container.querySelector("#appNavLinks");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("nav-open");
    toggle.textContent = isOpen ? "✕" : "☰";
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

async function renderNavbar(user) {
  const container = document.getElementById("dashboardNavbar");
  if (!container) return;

  const currentRender = ++renderSequence;
  const role = user?.role;
  const navbarPath = getNavbarPath(role);
  if (!navbarPath) {
    container.innerHTML = "";
    return;
  }

  const prefix = getBasePrefix();
  const cacheKey = `${prefix}${navbarPath}`;

  let markup = navbarMarkupCache.get(cacheKey);
  if (!markup) {
    const response = await fetch(cacheKey);
    if (!response.ok) {
      if (currentRender !== renderSequence) return;
      container.innerHTML = "";
      return;
    }

    markup = await response.text();
    navbarMarkupCache.set(cacheKey, markup);
  }

  if (currentRender !== renderSequence) return;

  if (!markup) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = markup;

  container.querySelectorAll("[data-href]").forEach((node) => {
    const href = node.getAttribute("data-href");
    node.setAttribute("href", `${prefix}${href}`);
    node.setAttribute("data-nav-link", "true");
  });

  markActiveLinks(container);
  populateUserChip(container, user);
  wireHamburger(container);
  // Footer intentionally NOT loaded on authenticated app pages
}

async function loadNavbar() {
  const storedUser = getStoredUser();
  if (storedUser) {
    await renderNavbar(storedUser);
  }

  const syncedUser = await syncStoredUserWithSession();
  const resolvedUser = syncedUser || getStoredUser();
  if (resolvedUser) {
    await renderNavbar(resolvedUser);
  }
}

watchAuthState((user) => {
  void renderNavbar(user || getStoredUser());
});

void loadNavbar();
