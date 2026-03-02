import supabaseClient from "../core/supabaseClient.js";
import { setFlashMessage, showToast } from "../utils/helpers.js";

const form = document.getElementById("registerForm");

function getFriendlyRegisterError(error) {
  const message = (error?.message || "").toLowerCase();

  if (!navigator.onLine) {
    return "No internet connection detected. Please reconnect and try again.";
  }

  if (error?.name === "AbortError" || message.includes("timed out") || message.includes("timeout")) {
    return "Registration request took too long on this network. Please try again.";
  }

  if (message.includes("failed to fetch") || message.includes("network") || message.includes("cors")) {
    return "Unable to reach the server from this device. Check mobile network/firewall settings and retry.";
  }

  return `Registration failed: ${error?.message || "unknown error"}`;
}

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

  const submitBtn = form.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Registering...";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const { error } = await supabaseClient
    .from("users")
    .insert([{ name, email, password, role }])
    .abortSignal(controller.signal);

  clearTimeout(timeoutId);

  if (error) {
    console.error("Registration failed", error);
    submitBtn.disabled = false;
    submitBtn.textContent = "Register";
    showToast(getFriendlyRegisterError(error), "error");
    return;
  }

  setFlashMessage("Registered successfully. Complete your profile after login.", "success", "auth");
  window.location.href = "./login.html";
});
