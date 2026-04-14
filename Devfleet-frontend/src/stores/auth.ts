import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { debugCookies } from "../api/http";
import { authAPI } from "../api/apis";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref<any>(null);
  const isAuthenticated = computed(() => !!user.value);
  const currentStep = ref<"email" | "otp" | "register" | "login">("email");
  const email = ref("");
  const isLoading = ref(false);

  // Actions
  const sendOTP = async (emailAddress: string) => {
    isLoading.value = true;
    try {
      const response = await authAPI.sendOTP(emailAddress);
      email.value = emailAddress;
      currentStep.value = "otp";
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send OTP",
      };
    } finally {
      isLoading.value = false;
    }
  };

  const verifyOTP = async (otp: string) => {
    isLoading.value = true;
    try {
      const response = await authAPI.verifyOTP(email.value, otp);
      currentStep.value = "register";
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid OTP",
      };
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (
    name: string,
    password: string,
    confirmPassword: string
  ) => {
    isLoading.value = true;
    try {
      const response = await authAPI.register(
        email.value,
        name,
        password,
        confirmPassword
      );
      user.value = response.data.user;
      console.log("🎉 Registration successful, checking cookies...");
      debugCookies();
      return { success: true, message: response.data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (emailAddress: string, password: string) => {
    isLoading.value = true;
    try {
      const response = await authAPI.login(emailAddress, password);
      user.value = response.data.user;
      console.log("🎉 Login successful, checking cookies...");
      debugCookies();
      return { success: true, message: response.data.message };
    } catch (error: any) {
      console.log("❌ Login failed:", error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      // Call logout API to clear HTTP-only cookie
      await authAPI.logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always clear local state regardless of API call result
      user.value = null;
      currentStep.value = "email";
      email.value = "";
    }
  };

  const switchToLogin = () => {
    currentStep.value = "login";
  };

  const switchToSignup = () => {
    currentStep.value = "email";
  };

  const loginWithGitHub = () => {
    // GitHub OAuth redirects to backend, which handles everything
    authAPI.githubAuth();
  };

  const checkAuthStatus = async () => {
    try {
      // Debug current cookies before making the request
      console.log("🔍 Checking auth status...");
      debugCookies();

      // Validate authentication with the backend
      const response = await authAPI.validateAuth();

      if (response.data && response.data.user) {
        // Set user data from backend response
        user.value = response.data.user;
        console.log("✅ Authentication successful:", user.value);
        return true;
      }
    } catch (error: any) {
      // If validation fails (401, 403, etc.), user is not authenticated
      console.log(
        "❌ Auth validation failed:",
        error.response?.status,
        error.response?.data
      );
      debugCookies();
    }

    // Clear user state if validation failed
    user.value = null;
    return false;
  };

  return {
    // State
    user,
    isAuthenticated,
    currentStep,
    email,
    isLoading,
    // Actions
    sendOTP,
    verifyOTP,
    register,
    login,
    logout,
    switchToLogin,
    switchToSignup,
    loginWithGitHub,
    checkAuthStatus,
  };
});
