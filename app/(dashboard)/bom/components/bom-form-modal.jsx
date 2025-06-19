"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Button } from "@/components/button";

export function BOMFormModal({ isOpen, onClose, onSuccess }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create BOM (Not Implemented)</DialogTitle>
        </DialogHeader>
        <div>This modal is not implemented, use the create page instead</div>
        <Button onClick={onClose}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
