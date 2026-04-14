import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import AuthFlow from "../components/AuthFlow.vue";

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/auth",
    name: "Auth",
    component: AuthFlow,
    meta: { requiresGuest: true },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../pages/Dashboard.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/jobs",
    name: "Jobs",
    component: () => import("../pages/Jobs.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/jobs/:id",
    name: "JobDetails",
    component: () => import("../pages/JobDetails.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/agents",
    name: "Agents",
    component: () => import("../pages/Agents.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/agents/:id",
    name: "AgentDetails",
    component: () => import("../pages/AgentDetails.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: () => import("../pages/Profile.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  try {
    // Always check auth status fresh from backend
    console.log("Checking authentication status...");
    const isAuthenticated = await authStore.checkAuthStatus();
    console.log("Authentication status:", isAuthenticated);
    console.log("User object:", authStore.user);

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      console.log("Access denied: User not authenticated, redirecting to auth");
      next("/auth");
    } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
      console.log("Redirecting authenticated user to dashboard");
      next("/dashboard");
    } else {
      console.log(`Navigation allowed to ${to.path}`);
      next();
    }
  } catch (error: any) {
    console.error("Navigation error:", error);
    next("/auth");
  }
});

export default router;
