import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
const authStore = useAuthStore();
// app.mount("#app");
// Initialize auth status and then mount the app
authStore
  .checkAuthStatus()
  .then(() => {
    // If user is authenticated and on auth page, redirect to dashboard
    if (authStore.isAuthenticated && window.location.pathname === "/auth") {
      router.push("/dashboard");
    }
    // If user is not authenticated and not on auth page, redirect to auth
    else if (
      !authStore.isAuthenticated &&
      window.location.pathname !== "/auth"
    ) {
      router.push("/auth");
    }
  })
  .finally(() => {
    // 4. Mount the app AFTER your auth logic is finished.
    app.mount("#app");
  });
