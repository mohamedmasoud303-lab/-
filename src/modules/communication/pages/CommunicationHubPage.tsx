
import React, { useState, useMemo } from 'react';
import { useApp } from 'contexts/AppContext';
import { OutgoingNotification } from 'core/types';
import Card from 'components/ui/Card';
import { sanitizePhoneNumber } from 'utils/helpers';
import { Send, MessageSquare, Copy, Check, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StatusPill from 'components/ui/StatusPill';
import { logger } from 'lib/logger';

const CommunicationHub: React.FC = () => {
    const { db, generateNotifications, dataService } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const notifications = useMemo(() => {
        return [...(db.outgoingNotifications || [])].sort((a, b) => b.createdAt - a.createdAt);
    }, [db.outgoingNotifications]);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const count = await generateNotifications();
            toast.success(`تم توليد ${count} إشعار جديد.`);
        } catch (error) {
            logger.error("Failed to generate notifications:", error);
            toast.error(`فشل توليد الإشعارات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('تم نسخ الرسالة.');
    };

    const handleMarkAsSent = (id: string) => {
        dataService.update('outgoingNotifications', id, { status: 'SENT' });
    };

    const handleSendWhatsApp = (notification: OutgoingNotification) => {
        const phone = sanitizePhoneNumber(notification.recipientContact);
        if (!phone) {
            toast.error('رقم هاتف المستلم غير صالح.');
            return;
        }
        const text = encodeURIComponent(notification.message);
        const url = `https://wa.me/${phone}?text=${text}`;
        window.open(url, '_blank');
        handleMarkAsSent(notification.id);
    };

    return (
        <Card>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare />
                    مركز التواصل
                </h2>
                <button 
                    onClick={handleGenerate} 
                    disabled={isLoading}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Send size={16} />
                    {isLoading ? 'جاري التوليد...' : 'توليد الإشعارات'}
                </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
                يقوم النظام بالبحث عن الفواتير المتأخرة والعقود التي قاربت على الانتهاء لإنشاء رسائل تذكيرية جاهزة.
            </p>

            <div className="space-y-4">
                {notifications.map(n => (
                    <div key={n.id} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <StatusPill status={n.status === 'SENT' ? 'PAID' : 'PENDING'}>
                                        {n.status === 'PENDING' ? 'جاهز للإرسال' : 'تم الإرسال'}
                                    </StatusPill>
                                    <span className="font-bold">{n.recipientName}</span>
                                    <span className="text-sm text-muted-foreground font-mono">{n.recipientContact}</span>
                                </div>
                                <p className="mt-2 text-sm bg-background p-3 rounded-md">{n.message}</p>
                            </div>
                            <div className="flex items-center flex-wrap justify-end gap-2 flex-shrink-0">
                                <button onClick={() => handleSendWhatsApp(n)} className="btn btn-sm btn-secondary">
                                    إرسال واتساب
                                </button>
                                {n.status === 'PENDING' && (
                                     <button onClick={() => handleMarkAsSent(n.id)} className="btn btn-sm btn-ghost">
                                        <Check size={14} /> تأشير كمرسل
                                    </button>
                                )}
                                <button onClick={() => handleCopy(n.message)} className="btn btn-sm btn-ghost">
                                    <Copy size={14} /> نسخ
                                </button>
                                <button onClick={() => dataService.remove('outgoingNotifications', n.id)} className="text-danger hover:bg-danger-foreground p-2 rounded-md">
                                     <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                 {notifications.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">لا توجد إشعارات حاليًا.</p>
                        <p className="text-sm text-muted-foreground">اضغط على "توليد الإشعارات" للبدء.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default CommunicationHub;
