<template>
  <div
    class="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden"
  >
    <!-- Grid background -->
    <div class="absolute inset-0 grid-bg opacity-40" />
    <!-- Radial green glow -->
    <div
      class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] rounded-full blur-[120px]"
      style="background: hsl(152 100% 50% / 0.06)"
    />

    <div class="relative w-full max-w-md fade-up">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-3 mb-8">
        <div
          class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center pulse-glow"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4h12M2 8h8M2 12h10"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              class="text-primary-foreground"
            />
          </svg>
        </div>
        <span class="font-bold text-xl tracking-tight text-foreground"
          >Dev<span class="text-primary">fleet</span></span
        >
      </div>

      <!-- Card -->
      <div
        class="bg-card border border-border rounded-xl p-8 shadow-2xl"
        style="
          box-shadow: 0 0 40px hsl(152 100% 50% / 0.06),
            0 20px 60px hsl(220 20% 0% / 0.6);
        "
      >
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p class="text-muted-foreground text-sm">
            Sign in to your control plane
          </p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground/80 mb-2"
              >Email</label
            >
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors font-mono"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground/80 mb-2"
              >Password</label
            >
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg transition-all text-sm box-glow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {{ loading ? "Signing in..." : "Sign In" }}
          </button>
        </form>

        <div
          v-if="error"
          class="mt-4 p-3 rounded-lg text-sm"
          style="
            background: hsl(0 70% 50% / 0.1);
            border: 1px solid hsl(0 70% 50% / 0.3);
            color: hsl(0 80% 70%);
          "
        >
          {{ error }}
        </div>

        <!-- Demo note -->
        <div class="mt-6 pt-5 border-t border-border">
          <p class="text-muted-foreground text-xs text-center mb-2">
            Demo credentials
          </p>
          <div
            class="bg-secondary rounded-lg p-3 font-mono text-xs text-muted-foreground space-y-0.5"
          >
            <p><span class="text-primary">$</span> email: demo@example.com</p>
            <p><span class="text-primary">$</span> password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const handleLogin = async () => {
  loading.value = true;
  error.value = "";

  try {
    if (email.value === "demo@example.com" && password.value === "demo123") {
      const mockUser = { id: "1", email: email.value, name: "Demo User" };
      const mockToken = "mock-token-" + Date.now();
      authStore.login(mockUser, mockToken);
      router.push("/dashboard");
    } else {
      error.value = "Invalid credentials. Use demo@example.com / demo123";
    }
  } catch (err: any) {
    error.value = err.message || "Login failed";
  } finally {
    loading.value = false;
  }
};
</script>
