
import { toast } from "sonner";
import { Check, X } from "lucide-react";

type ConfirmToastOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  duration?: number;
};

export const confirmToast = ({
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  duration = 10000, // Increased duration to ensure users have time to react
}: ConfirmToastOptions) => {
  toast(
    <div className="w-full">
      <h3 className="font-medium text-sm">{title}</h3>
      {description && <p className="text-sm mt-1 text-gray-400">{description}</p>}
      <div className="flex gap-2 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent toast dismissal when clicking
            if (onCancel) onCancel();
            toast.dismiss();
          }}
          className="flex-1 px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs flex items-center justify-center gap-1"
        >
          <X className="h-3 w-3" />
          {cancelText}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent toast dismissal when clicking
            onConfirm();
            toast.dismiss();
          }}
          className="flex-1 px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center gap-1"
        >
          <Check className="h-3 w-3" />
          {confirmText}
        </button>
      </div>
    </div>,
    {
      duration: duration,
      onDismiss: () => {
        // If dismissed without clicking buttons, treat as cancel
        if (onCancel) onCancel();
      },
      closeButton: true,
    }
  );
};
