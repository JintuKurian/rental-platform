import { getStoredUser, syncStoredUserWithSession } from "../js/core/auth.js";

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
  const avatarEl   = container.querySelector("#navAvatar");
  const nameEl     = container.querySelector("#navUserName");
  const roleEl     = container.querySelector("#navUserRole");

  if (!user) return;
  if (avatarEl) avatarEl.textContent = getUserInitials(user.name || user.email || "U");
  if (nameEl)   nameEl.textContent   = user.name  || user.email || "User";
  if (roleEl)   roleEl.textContent   = user.role  || "";
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

async function loadFooter(prefix) {
  const footerHost = document.getElementById("appFooter");
  if (!footerHost) return;

  try {
    const response = await fetch(`${prefix}components/footer.html`);
    if (!response.ok) return;
    footerHost.innerHTML = await response.text();
    footerHost.querySelectorAll("a[href^='../']").forEach((link) => {
      const href = link.getAttribute("href");
      link.setAttribute("href", prefix + href.replace(/^\.\.\//, ""));
    });
    const yearNode = footerHost.querySelector("[data-current-year]");
    if (yearNode) yearNode.textContent = String(new Date().getFullYear());
  } catch {
    // intentionally no-op
  }
}

async function loadNavbar() {
  const container = document.getElementById("dashboardNavbar");
  if (!container) return;

  await syncStoredUserWithSession();
  const user = getStoredUser();
  const role = user?.role;
  const navbarPath = getNavbarPath(role);
  if (!navbarPath) return;

  const prefix = getBasePrefix();
  const response = await fetch(`${prefix}${navbarPath}`);
  if (!response.ok) return;

  container.innerHTML = await response.text();

  // Resolve data-href → real href
  container.querySelectorAll("[data-href]").forEach((node) => {
    const href = node.getAttribute("data-href");
    node.setAttribute("href", `${prefix}${href}`);
    node.setAttribute("data-nav-link", "true");
  });

  markActiveLinks(container);
  populateUserChip(container, user);
  wireHamburger(container);
  await loadFooter(prefix);
}

void loadNavbar();
