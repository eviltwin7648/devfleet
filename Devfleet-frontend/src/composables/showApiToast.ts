import { useAppToast } from "./useAppToast";
const toast = useAppToast();

export const showAPIToast = (input: any) => {
  const status = input?.status;
  const message = input?.message || "Something went wrong";

  if (!status) {
    toast.showErrorToast(message);
    return;
  }

  if (status >= 200 && status < 300) {
    toast.showSuccessToast(message);
  } else if (status >= 400 && status < 500) {
    toast.showWarnToast(message);
  } else if (status >= 500) {
    toast.showErrorToast(message);
  } else {
    toast.showInfoToast(message);
  }
};
