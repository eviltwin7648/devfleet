import { defineStore } from "pinia";
import { ref } from "vue";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration: number;
}

export const useToastStore = defineStore("toast", () => {
  const toasts = ref<Toast[]>([]);

  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
    duration = 4000
  ) => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, duration };

    toasts.value.push(toast);

    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((toast: Toast) => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const showSuccess = (message: string) => addToast(message, "success");
  const showError = (message: string) => addToast(message, "error");
  const showInfo = (message: string) => addToast(message, "info");

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  };
});
