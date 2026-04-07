
import React, { useState } from 'react';
import { Paperclip, Trash2, Download, Plus, FileText, Image as ImageIcon, File } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Attachment } from '../../core/types';

interface AttachmentsManagerProps {
    entityId: string;
    entityType: 'CONTRACT' | 'TENANT' | 'RECEIPT' | 'LAND' | 'LEAD';
}

const AttachmentsManager: React.FC<AttachmentsManagerProps> = ({ entityId, entityType }) => {
    const { db, dataService } = useApp();
    const attachments = (db.attachments || []).filter(a => a.entityId === entityId && a.entityType === entityType);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real app, we would upload to storage and get a URL
        // For this demo, we'll just create a mock record
        const reader = new FileReader();
        reader.onload = async () => {
            const newAttachment: Attachment = {
                id: crypto.randomUUID(),
                entityId,
                entityType,
                name: file.name,
                mime: file.type,
                size: file.size,
                dataUrl: reader.result as string,
                createdAt: Date.now(),
            };
            await dataService.add('attachments', newAttachment);
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المرفق؟')) {
            await dataService.remove('attachments', id);
        }
    };

    const getFileIcon = (mime: string) => {
        if (mime.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
        if (mime === 'application/pdf') return <FileText className="w-4 h-4 text-danger" />;
        return <File className="w-4 h-4 text-muted-foreground" />;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> المرفقات ({attachments.length})
                </h3>
                <label className="btn btn-secondary btn-sm gap-2 cursor-pointer">
                    <Plus className="w-3 h-3" /> إضافة مرفق
                    <input type="file" className="hidden" onChange={handleUpload} />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {attachments.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {getFileIcon(a.mime)}
                            <span className="text-xs truncate font-medium">{a.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <a href={a.dataUrl} download={a.name} className="p-1 hover:bg-background rounded transition-colors">
                                <Download className="w-3 h-3" />
                            </a>
                            <button onClick={() => handleDelete(a.id)} className="p-1 hover:bg-background rounded text-danger transition-colors">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
                {attachments.length === 0 && (
                    <div className="col-span-full py-4 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                        لا توجد مرفقات حالياً
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttachmentsManager;
