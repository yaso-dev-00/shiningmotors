import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { StoryDialog, StoryDialogContent } from "../ui/storyDialog";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  message?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  message = "Are you sure you want to delete this post? This action cannot be undone.",
}) => {
  return (
    <StoryDialog open={open} onOpenChange={onClose}>
      <StoryDialogContent className="max-w-sm rounded-xl shadow-2xl border-0 p-0 bg-white">
       <DialogHeader>
                 <div className="flex items-center justify-between p-4">
                   <DialogTitle className="text-red-500">Delete Post</DialogTitle>
                   {/* <Button
                     variant="ghost"
                     size="icon"
                     onClick={onClose}
                   >
                     <X size={20} />
                   </Button> */}
                 </div>
               </DialogHeader>
        <div className="py-4 px-6 text-center text-gray-700 text-base">
          {message}
        </div>
        <DialogFooter className="flex justify-center gap-3 px-6 pb-6">
          <button
            className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition disabled:opacity-60"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="loader border-t-2 border-white w-4 h-4 rounded-full animate-spin"></span>{" "}
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </button>
        </DialogFooter>
      </StoryDialogContent>
    </StoryDialog>
  );
};

export default DeleteConfirmModal;
