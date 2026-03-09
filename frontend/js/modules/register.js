import supabaseClient from "../core/supabaseClient.js";
import { setFlashMessage, showToast } from "../utils/helpers.js";

const form = document.getElementById("registerForm");
const REGISTRATION_ROLES = ["owner", "tenant"];

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("name").value.trim();
    const email    = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const role     = document.getElementById("role").value;

    if (!fullName || !email || !password || !role) {
      showToast("Please fill all required fields", "error");
      return;
    }

    if (!REGISTRATION_ROLES.includes(role)) {
      showToast("Only owner and tenant accounts can be self-registered", "error");
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering…";

    try {
      // ── Step 1: Create Supabase Auth user ──────────────────────────
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        const msg = signUpError.message?.toLowerCase() || "";
        if (msg.includes("already registered") || msg.includes("already been registered")) {
          throw new Error("An account with this email already exists. Please log in instead.");
        }
        throw new Error(signUpError.message || "Registration failed");
      }

      if (!signUpData?.user) {
        throw new Error("Unable to create account. Please try again.");
      }

      // ── Step 2: Sign in immediately to get an authenticated session ─
      // This is required so the public.users insert satisfies RLS policies.
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        // Auth user created but we couldn't log in yet — likely email confirmation required.
        // Still try the insert in case RLS allows it; if not, direct them to login.
        console.warn("Immediate sign-in after sign-up failed:", signInError.message);
      }

      // ── Step 3: Insert app-level user row ──────────────────────────
      // Note: password is intentionally NOT stored here — security is handled by Supabase Auth.
      const { error: profileError } = await supabaseClient.from("users").insert({
        name:  fullName,
        email,
        role
      });

      if (profileError) {
        // Sign out the partial session before showing the error
        await supabaseClient.auth.signOut();
        console.error("public.users insert error:", profileError);
        throw new Error(
          profileError.code === "42501"
            ? "Permission denied. Please ask your admin to enable user registration in the database RLS policy."
            : profileError.message || "Profile setup failed"
        );
      }

      // ── Step 4: Sign out so user must log in cleanly ────────────────
      await supabaseClient.auth.signOut();

      setFlashMessage("Registration successful! Please log in.", "success", "auth");
      window.location.href = "/pages/login.html";

    } catch (error) {
      showToast(error.message || "Registration failed", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register";
    }
  });
}
