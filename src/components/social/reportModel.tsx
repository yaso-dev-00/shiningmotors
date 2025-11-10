import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StoryDialog, StoryDialogContent } from "../ui/storyDialog";

export const ReportModal = ({
  open,
  onClose,
  onSubmit,
  reason,
  setReason,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  reason: string;
  setReason: (val: string) => void;
}) => {
  return (
    <StoryDialog open={open} onOpenChange={onClose}>
      <StoryDialogContent className="p-6 md:w-[500px]"  style={{
          maxWidth: "95%",

borderRadius:"5px"
        }} >
        <DialogHeader>
          <DialogTitle className="mb-2">Report Post</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Why are you reporting this post?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[150px] p-4"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Send</Button>
        </div>
      </StoryDialogContent>
    </StoryDialog>
  );
};
