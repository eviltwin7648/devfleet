<template>
  <div class="min-h-screen bg-background relative overflow-x-hidden">
    <div class="fixed inset-0 grid-bg opacity-30 pointer-events-none" />

    <!-- Header -->
    <header
      class="relative border-b border-border backdrop-blur-sm sticky top-0 z-50"
      style="background: hsl(220 20% 4% / 0.9)"
    >
      <div
        class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <router-link
            to="/dashboard"
            class="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-sm"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Dashboard
          </router-link>
          <span class="text-border">·</span>
          <h1 class="text-base font-bold text-foreground">
            Profile & Settings
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>

    <main class="relative max-w-4xl mx-auto px-6 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left: main content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- User Profile -->
          <div class="bg-card border border-border rounded-xl overflow-hidden">
            <div class="px-6 py-4 border-b border-border">
              <h2 class="text-base font-semibold text-foreground">
                User Profile
              </h2>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-foreground/80 mb-2"
                  >Name</label
                >
                <input
                  v-model="profile.name"
                  type="text"
                  class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground/80 mb-2"
                  >Email</label
                >
                <input
                  v-model="profile.email"
                  type="email"
                  disabled
                  class="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>
              <button
                @click="saveProfile"
                class="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity box-glow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>

          <!-- API Keys -->
          <div class="bg-card border border-border rounded-xl overflow-hidden">
            <div
              class="flex items-center justify-between px-6 py-4 border-b border-border"
            >
              <div class="flex items-center gap-3">
                <h2 class="text-base font-semibold text-foreground">
                  API Keys
                </h2>
                <span
                  class="text-xs font-mono px-2 py-0.5 bg-secondary rounded-full text-muted-foreground"
                >
                  {{ apiKeys.length }}
                </span>
              </div>
              <button
                @click="isCreateKeyDialogOpen = true"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/40 text-primary text-xs font-medium rounded-lg hover:bg-primary/10 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M5 1v8M1 5h8"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                  />
                </svg>
                New Key
              </button>
            </div>

            <div
              v-if="apiKeys.length === 0"
              class="flex flex-col items-center justify-center py-12 px-6"
            >
              <p class="text-foreground font-medium mb-1">No API keys</p>
              <p class="text-muted-foreground text-sm">
                Create a key to authenticate agent requests.
              </p>
            </div>

            <div v-else class="divide-y divide-border">
              <div
                v-for="key in apiKeys"
                :key="key.id"
                class="px-6 py-4 hover:bg-secondary/40 transition-colors"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm text-foreground mb-1">
                      {{ key.name }}
                    </p>
                    <div class="flex items-center gap-2">
                      <code
                        class="text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded"
                      >
                        {{ visibleKeys[key.id] ? key.key : maskKey(key.key) }}
                      </code>
                      <button
                        @click="toggleKeyVisibility(key.id)"
                        class="text-muted-foreground hover:text-foreground transition-colors text-xs"
                        :title="visibleKeys[key.id] ? 'Hide' : 'Show'"
                      >
                        {{ visibleKeys[key.id] ? "●" : "○" }}
                      </button>
                      <button
                        @click="copyToClipboard(key.key)"
                        class="text-muted-foreground hover:text-primary transition-colors text-xs"
                        title="Copy"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <button
                    @click="deleteApiKey(key.id)"
                    class="ml-4 shrink-0 text-muted-foreground hover:text-red-400 transition-colors text-xs px-2 py-1 rounded hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
                <div class="flex items-center gap-3">
                  <p class="text-xs text-muted-foreground">
                    Expires {{ formatDate(key.expiresAt) }}
                  </p>
                  <span
                    v-if="isKeyExpired(key.expiresAt)"
                    class="text-xs px-2 py-0.5 bg-destructive/10 text-red-400 border border-destructive/20 rounded-full"
                  >
                    Expired
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: sidebar -->
        <div class="space-y-4">
          <!-- Account Info -->
          <div class="bg-card border border-border rounded-xl p-5">
            <h3 class="text-sm font-semibold text-foreground mb-4">
              Account Info
            </h3>
            <div class="space-y-4">
              <div>
                <p
                  class="text-muted-foreground text-xs uppercase tracking-widest mb-1"
                >
                  Member Since
                </p>
                <p class="text-foreground text-sm">
                  {{ formatDate(new Date()) }}
                </p>
              </div>
              <div>
                <p
                  class="text-muted-foreground text-xs uppercase tracking-widest mb-1"
                >
                  Status
                </p>
                <p
                  class="text-primary text-sm font-semibold flex items-center gap-1.5"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-primary pulse-glow"
                  />
                  Active
                </p>
              </div>
              <div>
                <p
                  class="text-muted-foreground text-xs uppercase tracking-widest mb-1"
                >
                  API Keys
                </p>
                <p class="text-foreground text-sm font-mono">
                  {{ apiKeys.length }}
                </p>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div
            class="bg-card border rounded-xl p-5"
            style="border-color: hsl(0 70% 50% / 0.2)"
          >
            <h3
              class="text-sm font-semibold mb-4"
              style="color: hsl(0 70% 65%)"
            >
              Danger Zone
            </h3>
            <button
              @click="logout"
              class="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-400 border hover:bg-destructive/10"
              style="border-color: hsl(0 70% 50% / 0.3)"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </main>

    <CreateApiKeyDialog
      v-model:open="isCreateKeyDialogOpen"
      @create="handleKeyCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { formatDistanceToNow } from "date-fns";
import CreateApiKeyDialog from "../components/CreateApiKeyDialog.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";

const router = useRouter();
const authStore = useAuthStore();

const profile = ref({
  name: authStore.user?.name || "",
  email: authStore.user?.email || "",
});
const isCreateKeyDialogOpen = ref(false);
const handleKeyCreated = (keyData: any) => {
  console.log("New key created!", keyData);
};

const apiKeys = ref<any[]>([
  {
    id: "1",
    name: "Production Key",
    key: "sk_live_1234567890abcdef",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  },
]);

const visibleKeys = ref<Record<string, boolean>>({});
const formatDate = (date: Date) =>
  formatDistanceToNow(date, { addSuffix: true });
const maskKey = (key: string) =>
  key.substring(0, 12) + "••••••••" + key.substring(key.length - 4);
const toggleKeyVisibility = (keyId: string) => {
  visibleKeys.value[keyId] = !visibleKeys.value[keyId];
};
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
};
const isKeyExpired = (expiresAt: Date) => new Date() > new Date(expiresAt);
const saveProfile = () => {
  console.log("Profile saved:", profile.value);
};
const deleteApiKey = (id: string) => {
  apiKeys.value = apiKeys.value.filter((k) => k.id !== id);
};
const logout = () => {
  authStore.logout();
  router.push("/login");
};

onMounted(() => {
  if (!authStore.isAuthenticated) router.push("/login");
});
</script>
