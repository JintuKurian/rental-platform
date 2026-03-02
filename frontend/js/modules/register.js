import supabaseClient from "../core/supabaseClient.js";
import { setFlashMessage, showToast } from "../utils/helpers.js";

const form = document.getElementById("registerForm");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  if (!name || !email || !password || !role) {
    showToast("Please fill all required fields", "error");
    return;
  }

  const { error } = await supabaseClient.from("users").insert([{ name, email, password, role }]);
  if (error) {
    console.error("Registration failed", error);
    showToast(`Registration failed: ${error.message || "unknown error"}`, "error");
    return;
  }

  setFlashMessage("Registered successfully. Complete your profile after login.", "success", "auth");
  window.location.href = "./login.html";
});
