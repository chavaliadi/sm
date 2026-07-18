import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RuntimeExceptionActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  noteLabel: string;
  notePlaceholder?: string;
  defaultNote?: string;
  noteRequired?: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => Promise<void> | void;
}

export function RuntimeExceptionActionDialog({
  open,
  title,
  description,
  confirmLabel,
  noteLabel,
  notePlaceholder,
  defaultNote = '',
  noteRequired = false,
  pending,
  onOpenChange,
  onConfirm,
}: RuntimeExceptionActionDialogProps) {
  const [note, setNote] = useState(defaultNote);

  useEffect(() => {
    if (open) {
      setNote(defaultNote);
    }
  }, [defaultNote, open]);

  const trimmedNote = note.trim();
  const isDisabled = pending || (noteRequired && !trimmedNote);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="runtime-exception-note">{noteLabel}</Label>
          <Textarea
            id="runtime-exception-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={notePlaceholder}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={() => void onConfirm(trimmedNote)}
            disabled={isDisabled}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
