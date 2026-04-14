import { useToast } from "@/components/ui/toast/use-toast";

export function useAppToast() {
  const { toast } = useToast();
  const base = "text-white shadow-lg border font-medium";

  const successClass = `${base} bg-green-600 border-green-800`;
  const errorClass = `${base} bg-red-600 border-red-800`;
  const warnClass = `${base} bg-yellow-500 border-yellow-700 text-black`;
  const infoClass = `${base} bg-blue-600 border-blue-800`;

  const showSuccessToast = (detail, summary?) => {
    toast({
      title: summary || "Success",
      description: detail,
      class: successClass,
    });
  };

  const showErrorToast = (detail, summary?) => {
    toast({
      variant: "destructive", // This gives it the red "error" style
      title: summary || "Error",
      description: detail,
      class: errorClass,
    });
  };

  const showInfoToast = (detail, summary?) => {
    toast({
      title: summary || "Information",
      description: detail,
      class: infoClass,
    });
  };

  const showWarnToast = (detail, summary?) => {
    toast({
      // variant: "warning", // You might need to add a 'warning' variant
      title: summary || "Warning",
      description: detail,
      class: warnClass,
    });
  };

  return {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarnToast,
  };
}
