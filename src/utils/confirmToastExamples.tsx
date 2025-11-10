
import React from 'react';
import { Button } from "@/components/ui/button";
import { confirmToast } from './confirmToast';

export const ConfirmToastExamples = () => {
  const handleDeleteItem = () => {
    confirmToast({
      title: "Delete this item?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Keep",
      onConfirm: () => {
        console.log("Item deleted");
        // Actual deletion logic would go here
      }
    });
  };

  const handleAbandonChanges = () => {
    confirmToast({
      title: "Discard unsaved changes?",
      onConfirm: () => {
        console.log("Changes discarded");
        // Logic to reset form or navigate away
      }
    });
  };

  const handleLeaveSession = () => {
    confirmToast({
      title: "Leave race session?",
      description: "You may be penalized for leaving early.",
      confirmText: "Leave anyway",
      cancelText: "Stay in race",
      duration: 10000, // Longer duration for important decisions
      onConfirm: () => {
        console.log("Left race session");
        // Logic to leave the session
      },
      onCancel: () => {
        console.log("Stayed in race session");
        // Optional callback when user cancels
      }
    });
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold mb-4">Confirm Toast Examples</h2>
      
      <div className="flex flex-col gap-2">
        <Button onClick={handleDeleteItem} variant="destructive">
          Delete Item
        </Button>
        
        <Button onClick={handleAbandonChanges} variant="outline">
          Abandon Changes
        </Button>
        
        <Button onClick={handleLeaveSession}>
          Leave Race Session
        </Button>
      </div>
    </div>
  );
};
