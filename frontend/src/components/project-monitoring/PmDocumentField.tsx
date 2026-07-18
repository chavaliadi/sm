import { FileText, Loader2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { documentApi } from '@/services/dmsApi';

interface PmDocumentFieldProps {
  /** Linked DMS document id (react-hook-form field value). */
  value?: string | null;
  /** Called with the new document id, or undefined when cleared. */
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}

/**
 * Reusable DMS attach/upload control for project-monitoring tracker forms.
 *
 * Replaces the plain-text "document UUID" inputs: the user uploads a file
 * straight to the DMS (`POST /dms/documents`) and the returned document id is
 * written back into the form field. When a document is already linked, its name
 * is resolved and shown with Replace / Remove actions.
 */
export function PmDocumentField({ value, onChange, disabled }: PmDocumentFieldProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (value) {
      documentApi
        .get(value)
        .then((doc) => {
          if (active) setDocName(doc.name || doc.fileName);
        })
        .catch(() => {
          if (active) setDocName(null);
        });
    } else {
      setDocName(null);
    }
    return () => {
      active = false;
    };
  }, [value]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const doc = await documentApi.upload(file, {
        name: file.name,
        accessLevel: 'organization',
        documentType: 'PROJECT_MONITORING',
      });
      onChange(doc.id);
      setDocName(doc.name || doc.fileName);
      toast({ title: 'Document uploaded', description: doc.name || file.name });
    } catch {
      toast({
        title: 'Upload failed',
        description: 'Could not upload the document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFile}
        disabled={disabled || uploading}
      />
      {value ? (
        <>
          <span className="inline-flex max-w-[16rem] items-center gap-1 truncate rounded-md border bg-muted/40 px-2 py-1 text-sm">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{docName ?? 'Linked document'}</span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Replace'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(undefined);
              setDocName(null);
            }}
            disabled={disabled || uploading}
            aria-label="Remove document"
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploading ? 'Uploading…' : 'Upload document'}
        </Button>
      )}
    </div>
  );
}
