
import React, { useState } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { Mail, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@rentrix.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { auth, db } = useApp();
  const settings = db.settings;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await auth.login(email, password);
      if (!res.ok) {
        setError(res.msg);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('حدث خطأ غير متوقع أثناء تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="w-full max-w-md mx-auto bg-card rounded-3xl shadow-brand-lg border border-border/50 overflow-hidden">
        
        <div className="p-8 md:p-12">
            <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-primary-light/50 rounded-full flex items-center justify-center mb-6 mx-auto border border-primary/10">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-black text-heading mb-2 tracking-tight">Rentrix ERP</h1>
                <p className="text-muted-foreground font-medium text-sm">نظام إدارة العقارات التنفيذي</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="email-field" className="text-xs font-bold text-muted-foreground mr-1 uppercase tracking-wider">البريد الإلكتروني</label>
                    <div className="relative group">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            id="email-field"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 bg-muted/50 border-transparent rounded-xl focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="admin@rentrix.local"
                            autoComplete="email"
                            required
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label htmlFor="password-field" className="text-xs font-bold text-muted-foreground mr-1 uppercase tracking-wider">كلمة المرور</label>
                    <div className="relative group">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            id="password-field"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 bg-muted/50 border-transparent rounded-xl focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>
                </div>
                
                {error && (
                    <div className="bg-danger/10 text-danger text-sm font-bold p-3 rounded-xl flex items-center justify-center gap-3">
                        {error}
                    </div>
                )}
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn btn-primary py-4 text-base font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            جاري التحقق...
                        </>
                    ) : (
                        <>
                            دخول النظام
                            <ArrowLeft className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>
        </div>
        <div className="text-center text-xs text-muted-foreground p-6 bg-muted/30 border-t border-border/50">
             <p dir="ltr">© 2026 Rentrix ERP | Premium Executive Suite</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

