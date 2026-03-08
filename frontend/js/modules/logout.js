import { setFlashMessage } from "../utils/helpers.js";

function logoutUser() {

  // Clear stored session
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("name");

  // Set flash message for login page
  setFlashMessage("Logout successful", "success", "auth");

  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("userEmail");

  // Redirect to home
  window.location.href = "/index.html";
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}
