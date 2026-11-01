/* ===================== Helpers ===================== */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = "demo_users";

const $ = (id) => document.getElementById(id);

/* ===================== Routing (hash) ===================== */
const views = {
  login: $("login-view"),
  signup: $("signup-view"),
};

function showView() {
  const name = location.hash === "#signup" ? "signup" : "login";
  views.login.hidden = name !== "login";
  views.signup.hidden = name !== "signup";
  document.title = name === "login" ? "Log in" : "Sign up";
  clearForm(name);
}

window.addEventListener("hashchange", showView);

/* ===================== Validation ===================== */
function validateName(name) {
  if (!name.trim()) return "Name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return "";
}

function validateEmail(email) {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(email.trim())) return "Please enter a valid email address.";
  return "";
}

function validateSignupPassword(password) {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return "Password must include letters and numbers.";
  return "";
}

function validateLoginPassword(password) {
  return password ? "" : "Password is required.";
}

/* ===================== UI helpers ===================== */
function setFieldError(inputId, message) {
  const input = $(inputId);
  $(`${inputId}-error`).textContent = message;
  input.classList.toggle("invalid", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function showAlert(alertId, type, message) {
  const el = $(alertId);
  el.textContent = message;
  el.className = `alert ${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.hidden = false;
}

function hideAlert(alertId) {
  $(alertId).hidden = true;
}

function clearForm(viewName) {
  const form = $(`${viewName}-form`);
  form.reset();
  form.querySelectorAll("input").forEach((input) => {
    setFieldError(input.id, "");
    // نرجّع حقول الباسورد مخفية
    if (input.dataset.wasVisible) delete input.dataset.wasVisible;
  });
  form.querySelectorAll(".toggle-visibility").forEach((btn) => {
    setPasswordVisibility(btn, false);
  });
  hideAlert(`${viewName}-alert`);
}

/* ===================== Password toggle ===================== */
function setPasswordVisibility(button, visible) {
  const input = $(button.dataset.target);
  input.type = visible ? "text" : "password";
  button.querySelector(".icon-show").hidden = visible;
  button.querySelector(".icon-hide").hidden = !visible;
  button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
}

document.querySelectorAll(".toggle-visibility").forEach((button) => {
  button.addEventListener("click", () => {
    const isVisible = $(button.dataset.target).type === "text";
    setPasswordVisibility(button, !isVisible);
  });
});

/* ===================== Fake auth (localStorage) ===================== */
// محاكاة فقط: المشروع Front-End بدون backend.
// مش بنخزن كلمات سر بالشكل ده في مشاريع حقيقية.
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function registerUser({ name, email, password }) {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email === normalizedEmail)) {
    return { ok: false, message: "An account with this email already exists." };
  }

  users.push({ name: name.trim(), email: normalizedEmail, password });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return { ok: true };
}

function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getUsers().find(
    (u) => u.email === normalizedEmail && u.password === password
  );
  return user
    ? { ok: true, name: user.name }
    : { ok: false, message: "Invalid email or password." };
}

/* ===================== Live validation (on blur / input) ===================== */
function attachLiveValidation(inputId, validator) {
  const input = $(inputId);
  let touched = false;

  input.addEventListener("blur", () => {
    touched = true;
    setFieldError(inputId, validator(input.value));
  });

  input.addEventListener("input", () => {
    if (touched) setFieldError(inputId, validator(input.value));
  });
}

attachLiveValidation("login-email", validateEmail);
attachLiveValidation("login-password", validateLoginPassword);
attachLiveValidation("signup-name", validateName);
attachLiveValidation("signup-email", validateEmail);
attachLiveValidation("signup-password", validateSignupPassword);

/* ===================== Login submit ===================== */
$("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  hideAlert("login-alert");

  const email = $("login-email").value;
  const password = $("login-password").value;

  const emailError = validateEmail(email);
  const passwordError = validateLoginPassword(password);
  setFieldError("login-email", emailError);
  setFieldError("login-password", passwordError);
  if (emailError || passwordError) return;

  const result = loginUser({ email, password });
  if (result.ok) {
    showAlert("login-alert", "success", `Welcome back, ${result.name}!`);
    $("login-form").reset();
    setPasswordVisibility(document.querySelector('[data-target="login-password"]'), false);
  } else {
    showAlert("login-alert", "error", result.message);
  }
});

/* ===================== Signup submit ===================== */
let redirectTimer;

$("signup-form").addEventListener("submit", (e) => {
  e.preventDefault();
  hideAlert("signup-alert");

  const name = $("signup-name").value;
  const email = $("signup-email").value;
  const password = $("signup-password").value;

  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const passwordError = validateSignupPassword(password);
  setFieldError("signup-name", nameError);
  setFieldError("signup-email", emailError);
  setFieldError("signup-password", passwordError);
  if (nameError || emailError || passwordError) return;

  const result = registerUser({ name, email, password });
  if (result.ok) {
    showAlert("signup-alert", "success", "Account created successfully! Redirecting to login...");
    $("signup-form").reset();
    clearTimeout(redirectTimer);
    redirectTimer = setTimeout(() => {
      location.hash = "#login";
    }, 2000);
  } else {
    showAlert("signup-alert", "error", result.message);
  }
});

/* ===================== Init ===================== */
showView();