
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode; // For action buttons
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, children }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        {icon && <div className="p-3 bg-primary/5 border border-primary/10 rounded-2xl text-primary">{icon}</div>}
        <div>
          <h1 className="text-3xl font-black text-heading tracking-tight">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
};

export default PageHeader;
