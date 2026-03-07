export function formatCurrency(amount) {
  const numeric = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(numeric);
}

export function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN");
}

function getFlashStorageKey(scope) {
  return `flash:${scope || "global"}`;
}

export function setFlashMessage(message, type = "success", scope = "global") {
  sessionStorage.setItem(getFlashStorageKey(scope), JSON.stringify({ message, type }));
}

function ensureToastStack() {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

export function showToast(message, type = "success") {
  const stack = ensureToastStack();
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : "success"}`;
  toast.textContent = message;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2800);
}

function ensureFloatingMessageStyles() {
  if (document.getElementById("floatingMessageStyles")) return;

  const style = document.createElement("style");
  style.id = "floatingMessageStyles";
  style.textContent = `
    .floating-success-message {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 1200;
      background: #16a34a;
      color: #ffffff;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-weight: 600;
      box-shadow: 0 12px 26px rgba(22, 163, 74, 0.28);
      animation: floatingSuccessIn 0.25s ease-out;
    }

    @keyframes floatingSuccessIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  document.head.appendChild(style);
}

export function displaySuccessMessage(message = "Profile saved successfully") {
  ensureFloatingMessageStyles();

  const existing = document.querySelector(".floating-success-message");
  if (existing) {
    existing.remove();
  }

  const popup = document.createElement("div");
  popup.className = "floating-success-message";
  popup.textContent = message;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 2000);
}

export function renderFlashMessage(scope = "global") {
  const raw = sessionStorage.getItem(getFlashStorageKey(scope));
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.message) {
      showToast(parsed.message, parsed.type || "success");
    }
  } catch (error) {
    console.error("Invalid flash message payload:", error);
  }

  sessionStorage.removeItem(getFlashStorageKey(scope));
}
