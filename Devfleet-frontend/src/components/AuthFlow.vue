<template>
  <div class="auth-container">
    <!-- Grid bg -->
    <div class="auth-grid-bg" />
    <!-- Radial glow -->
    <div class="auth-glow" />

    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-logo">
        <div class="auth-logo-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4h12M2 8h8M2 12h10"
              stroke="hsl(220,20%,4%)"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <span class="auth-logo-text"
          >Dev<span class="auth-logo-accent">fleet</span></span
        >
      </div>

      <!-- Email Step -->
      <div v-if="authStore.currentStep === 'email'" class="auth-step">
        <div class="auth-header">
          <h2>Welcome to DevFleet</h2>
          <p>Enter your email to get started</p>
        </div>

        <form @submit.prevent="handleSendOTP" class="auth-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              v-model="emailForm.email"
              type="email"
              placeholder="you@example.com"
              :disabled="authStore.isLoading"
              autocomplete="email"
              tabindex="0"
              required
            />
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="authStore.isLoading || !emailForm.email"
          >
            <span v-if="authStore.isLoading" class="loading-spinner"></span>
            {{ authStore.isLoading ? "Sending..." : "Send OTP" }}
          </button>
        </form>

        <div class="or-divider">
          <span>or</span>
        </div>

        <button
          @click="handleGitHubAuth"
          class="btn-github"
          :disabled="authStore.isLoading"
        >
          <svg class="github-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="currentColor"
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          Continue with GitHub
        </button>

        <div class="auth-footer">
          <p>
            Already have an account?
            <button @click="authStore.switchToLogin" class="link-button">
              Sign in
            </button>
          </p>
        </div>
      </div>

      <!-- OTP Verification Step -->
      <div v-else-if="authStore.currentStep === 'otp'" class="auth-step">
        <div class="auth-header">
          <h2>Verify Your Email</h2>
          <p>
            We sent a code to
            <strong style="color: hsl(152, 100%, 50%)">{{
              authStore.email
            }}</strong>
          </p>
        </div>

        <form @submit.prevent="handleVerifyOTP" class="auth-form">
          <div class="form-group">
            <label for="otp">Verification Code</label>
            <input
              id="otp"
              v-model="otpForm.otp"
              type="text"
              placeholder="000000"
              maxlength="6"
              :disabled="authStore.isLoading"
              autocomplete="one-time-code"
              tabindex="0"
              class="otp-input"
              required
            />
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="authStore.isLoading || otpForm.otp.length !== 6"
          >
            <span v-if="authStore.isLoading" class="loading-spinner"></span>
            {{ authStore.isLoading ? "Verifying..." : "Verify OTP" }}
          </button>
        </form>

        <div class="auth-footer">
          <button @click="handleResendOTP" class="link-button">
            Didn't receive the code? Resend
          </button>
        </div>
      </div>

      <!-- Registration Step -->
      <div v-else-if="authStore.currentStep === 'register'" class="auth-step">
        <div class="auth-header">
          <h2>Complete Your Profile</h2>
          <p>Almost done! Please provide your details</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              id="name"
              v-model="registerForm.name"
              type="text"
              placeholder="Your name"
              :disabled="authStore.isLoading"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="registerForm.password"
              type="password"
              placeholder="••••••••"
              :disabled="authStore.isLoading"
              required
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="••••••••"
              :disabled="authStore.isLoading"
              required
            />
            <div
              v-if="
                registerForm.password &&
                registerForm.confirmPassword &&
                registerForm.password !== registerForm.confirmPassword
              "
              class="error-message"
            >
              Passwords don't match
            </div>
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="authStore.isLoading || !isRegisterFormValid"
          >
            <span v-if="authStore.isLoading" class="loading-spinner"></span>
            {{ authStore.isLoading ? "Creating Account..." : "Create Account" }}
          </button>
        </form>
      </div>

      <!-- Login Step -->
      <div v-else-if="authStore.currentStep === 'login'" class="auth-step">
        <div class="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your control plane</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="loginEmail">Email Address</label>
            <input
              id="loginEmail"
              v-model="loginForm.email"
              type="email"
              placeholder="you@example.com"
              :disabled="authStore.isLoading"
              required
            />
          </div>

          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input
              id="loginPassword"
              v-model="loginForm.password"
              type="password"
              placeholder="••••••••"
              :disabled="authStore.isLoading"
              required
            />
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="
              authStore.isLoading || !loginForm.email || !loginForm.password
            "
          >
            <span v-if="authStore.isLoading" class="loading-spinner"></span>
            {{ authStore.isLoading ? "Signing In..." : "Sign In" }}
          </button>
        </form>

        <div class="or-divider">
          <span>or</span>
        </div>

        <button
          @click="handleGitHubAuth"
          class="btn-github"
          :disabled="authStore.isLoading"
        >
          <svg class="github-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="currentColor"
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          Continue with GitHub
        </button>

        <div class="auth-footer">
          <p>
            Don't have an account?
            <button @click="authStore.switchToSignup" class="link-button">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toastStore = useToastStore();

// Check for GitHub OAuth errors on mount
onMounted(() => {
  const error = route.query.error as string;
  if (error) {
    toastStore.showError(decodeURIComponent(error));
    // Clean up the URL
    router.replace({ path: route.path });
  }
});

// Form data
const emailForm = ref({
  email: "",
});

const otpForm = ref({
  otp: "",
});

const registerForm = ref({
  name: "",
  password: "",
  confirmPassword: "",
});

const loginForm = ref({
  email: "",
  password: "",
});

// Computed
const isRegisterFormValid = computed(() => {
  return (
    registerForm.value.name &&
    registerForm.value.password &&
    registerForm.value.confirmPassword &&
    registerForm.value.password === registerForm.value.confirmPassword &&
    registerForm.value.password.length >= 6
  );
});

// Methods
const handleSendOTP = async () => {
  const result = await authStore.sendOTP(emailForm.value.email);
  if (result.success) {
    toastStore.showSuccess(result.message);
  } else {
    toastStore.showError(result.message);
  }
};

const handleVerifyOTP = async () => {
  const result = await authStore.verifyOTP(otpForm.value.otp);
  if (result.success) {
    toastStore.showSuccess(result.message);
  } else {
    toastStore.showError(result.message);
  }
};

const handleResendOTP = async () => {
  const result = await authStore.sendOTP(authStore.email);
  if (result.success) {
    toastStore.showSuccess(result.message);
  } else {
    toastStore.showError(result.message);
  }
  otpForm.value.otp = "";
};

const handleRegister = async () => {
  if (!isRegisterFormValid.value) return;

  const result = await authStore.register(
    registerForm.value.name,
    registerForm.value.password,
    registerForm.value.confirmPassword,
  );
  if (result.success) {
    toastStore.showSuccess(result.message);
    router.push("/dashboard");
  } else {
    toastStore.showError(result.message);
  }
};

const handleLogin = async () => {
  const result = await authStore.login(
    loginForm.value.email,
    loginForm.value.password,
  );
  if (result.success) {
    toastStore.showSuccess(result.message);
    router.push("/dashboard");
  } else {
    toastStore.showError(result.message);

    // If the error mentions GitHub, suggest using GitHub login
    if (result.message.includes("GitHub")) {
      setTimeout(() => {
        toastStore.showInfo(
          'Try using the "Continue with GitHub" button instead',
        );
      }, 2000);
    }
  }
};

const handleGitHubAuth = () => {
  authStore.loginWithGitHub();
};
</script>

<style scoped>
/* ===== Layout ===== */
.auth-container {
  position: relative;
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(220, 20%, 4%);
  padding: 2rem;
  overflow: hidden;
}

.auth-grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(hsl(220 14% 16% / 0.5) 1px, transparent 1px),
    linear-gradient(90deg, hsl(220 14% 16% / 0.5) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.4;
  pointer-events: none;
}

.auth-glow {
  position: absolute;
  top: 33%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 500px;
  border-radius: 50%;
  background: hsl(152 100% 50% / 0.05);
  filter: blur(120px);
  pointer-events: none;
}

/* ===== Card ===== */
.auth-card {
  position: relative;
  background: hsl(220, 18%, 7%);
  border: 1px solid hsl(220, 14%, 16%);
  border-radius: 16px;
  box-shadow:
    0 0 40px hsl(152 100% 50% / 0.06),
    0 20px 60px hsl(220 20% 0% / 0.6);
  width: 100%;
  max-width: 460px;
  overflow: hidden;
}

/* ===== Logo ===== */
.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 2rem 2.5rem 0;
}

.auth-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: hsl(152, 100%, 50%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 12px hsl(152 100% 50% / 0.5);
  animation: pulse-glow-keyframe 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse-glow-keyframe {
  0%, 100% { box-shadow: 0 0 5px hsl(152 100% 50% / 0.3); }
  50%       { box-shadow: 0 0 20px hsl(152 100% 50% / 0.7); }
}

.auth-logo-text {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  color: hsl(150, 10%, 92%);
  letter-spacing: -0.01em;
}

.auth-logo-accent {
  color: hsl(152, 100%, 50%);
}

/* ===== Step ===== */
.auth-step {
  padding: 2rem 2.5rem 2.5rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(150, 10%, 92%);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.auth-header p {
  color: hsl(220, 10%, 55%);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ===== Form ===== */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: hsl(150, 10%, 80%);
  font-size: 0.8rem;
  letter-spacing: 0.01em;
}

.form-group input {
  padding: 0.65rem 1rem;
  border: 1px solid hsl(220, 14%, 16%);
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background-color: hsl(220, 16%, 12%);
  color: hsl(150, 10%, 92%);
  font-family: 'JetBrains Mono', 'Inter', monospace;
  width: 100%;
  display: block;
}

.form-group input::placeholder {
  color: hsl(220, 10%, 45%);
}

.form-group input:focus {
  outline: none;
  border-color: hsl(152, 100%, 50%);
  box-shadow: 0 0 0 3px hsl(152 100% 50% / 0.15);
}

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.otp-input {
  font-size: 1.2rem !important;
  letter-spacing: 0.3em;
  text-align: center;
}

.error-message {
  color: hsl(0, 70%, 65%);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* ===== Buttons ===== */
.btn-primary {
  background: hsl(152, 100%, 50%);
  color: hsl(220, 20%, 4%);
  border: none;
  padding: 0.7rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 44px;
  width: 100%;
  box-shadow: 0 0 20px hsl(152 100% 50% / 0.2), 0 0 40px hsl(152 100% 50% / 0.06);
  font-family: 'Inter', system-ui, sans-serif;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-github {
  background: hsl(220, 16%, 12%);
  color: hsl(150, 10%, 85%);
  border: 1px solid hsl(220, 14%, 16%);
  padding: 0.7rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 44px;
  width: 100%;
  font-family: 'Inter', system-ui, sans-serif;
}

.btn-github:hover:not(:disabled) {
  border-color: hsl(220, 14%, 24%);
  background: hsl(220, 14%, 14%);
  transform: translateY(-1px);
}

.btn-github:active:not(:disabled) {
  transform: translateY(0);
}

.btn-github:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.github-icon {
  flex-shrink: 0;
}

/* ===== Loading spinner ===== */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== Divider ===== */
.or-divider {
  position: relative;
  text-align: center;
  margin: 1.25rem 0;
}

.or-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: hsl(220, 14%, 16%);
}

.or-divider span {
  background: hsl(220, 18%, 7%);
  color: hsl(220, 10%, 45%);
  padding: 0 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  position: relative;
}

/* ===== Footer ===== */
.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid hsl(220, 14%, 16%);
}

.auth-footer p {
  color: hsl(220, 10%, 55%);
  font-size: 0.85rem;
}

.link-button {
  background: none;
  border: none;
  color: hsl(152, 100%, 50%);
  font-weight: 600;
  cursor: pointer;
  font-size: inherit;
  transition: opacity 0.15s;
  font-family: inherit;
}

.link-button:hover {
  opacity: 0.8;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .auth-container {
    padding: 1rem;
  }
  .auth-card {
    max-width: 100%;
  }
  .auth-step {
    padding: 1.5rem 1.5rem 2rem;
  }
  .auth-logo {
    padding: 1.5rem 1.5rem 0;
  }
}
</style>
