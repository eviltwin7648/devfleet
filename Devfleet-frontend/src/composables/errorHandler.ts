// devfleet error shape
export interface NormalizedApiError {
  message: string;
  status?: number;
  code?: string;
}

export function handleApiError(
  err,
  defaultMessage = "Something went wrong"
): NormalizedApiError {
  console.error("API Error:", err);

  if (err?.response) {
    const { status, data } = err.response;

    const message =
      (typeof data === "string" && data) ||
      data?.message ||
      (Array.isArray(data?.errors) && data.errors.join(", ")) ||
      defaultMessage;

    return {
      message,
      status,
      code: data?.code,
    };
  }

  // No response at all (network error)
  if (err?.request) {
    return {
      message: "No response from server. Check your connection.",
      status: undefined,
    };
  }

  return {
    message: err?.message || defaultMessage,
    status: undefined,
  };
}
