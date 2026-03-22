
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './index';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد الحذف',
  cancelLabel = 'إلغاء',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const confirmVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-brand-lg border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              variant === 'danger' ? 'bg-danger/5 text-danger border-danger/10' : 'bg-primary/5 text-primary border-primary/10'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="text-xl font-black text-heading tracking-tight">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-muted/30 p-4 px-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="font-bold rounded-xl">
            {cancelLabel}
          </Button>
          <Button 
            variant={confirmVariant} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="font-bold rounded-xl shadow-brand"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
