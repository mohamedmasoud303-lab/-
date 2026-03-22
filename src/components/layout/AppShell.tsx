
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import SmartAssistant from '../shared/SmartAssistant';
import { useApp } from '../../contexts/AppContext';
import { AlertTriangle } from 'lucide-react';
import HardGateBanner from '../shared/HardGateBanner';

const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isReadOnly } = useApp();
  const location = useLocation();

  // إغلاق القائمة الجانبية آلياً عند تغيير الصفحة في الجوال
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay للموبايل عند فتح القائمة */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[45] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 overflow-hidden">
        <Topbar setSidebarOpen={setSidebarOpen} />
        
        {isReadOnly && (
          <div className="bg-warning/10 text-warning text-center py-2 px-4 flex items-center justify-center gap-2 z-30 border-b border-warning/20">
            <AlertTriangle size={16} />
            <span className="text-xs font-bold">وضع القراءة فقط</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto custom-scroll">
          <div className="max-w-screen-2xl mx-auto w-full p-6 sm:p-8 lg:p-12 pb-24">
            {isReadOnly && <HardGateBanner />}
            <Outlet />
          </div>
        </main>

        <Footer />
        <SmartAssistant />
      </div>
    </div>
  );
};

export default AppShell;
