import supabaseClient from "../core/supabaseClient.js";
import { renderFlashMessage, setFlashMessage, showToast } from "../utils/helpers.js";

const form = document.getElementById("loginForm");
renderFlashMessage("auth");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showToast("Please enter email and password", "error");
    return;
  }

  const submitBtn = form.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  const { data, error } = await supabaseClient.from("users").select("*").eq("email", email).eq("password", password).single();

  if (error || !data) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
    showToast("Invalid email or password", "error");
    return;
  }

  localStorage.setItem("user", JSON.stringify(data));
  localStorage.setItem("userId", data.user_id);
  localStorage.setItem("role", data.role);
  localStorage.setItem("name", data.name);

  setFlashMessage("Login successful", "success", "dashboard");

  if (data.role === "admin") window.location.href = "../dashboards/admin.html";
  else if (data.role === "owner") window.location.href = "../dashboards/owner.html";
  else window.location.href = "../dashboards/tenant.html";
});
