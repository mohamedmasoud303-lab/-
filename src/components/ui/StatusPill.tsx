
import React from 'react';

type Status = 'ACTIVE' | 'POSTED' | 'COMPLETED' | 'PAID' | 'AVAILABLE' |
              'INACTIVE' | 'PENDING' | 'IN_PROGRESS' | 'PARTIALLY_PAID' | 'RESERVED' |
              'ENDED' | 'SUSPENDED' | 'VOID' | 'BLACKLIST' | 'CLOSED' | 'OVERDUE' | 'CANCELLED' |
              'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'PLANNED' |
              'UNPAID' | 'DRAFT';

interface StatusPillProps {
  status: Status | string;
  children: React.ReactNode;
}

const StatusPill: React.FC<StatusPillProps> = ({ status, children }) => {
  const getStatusStyles = (status: Status | string): string => {
    switch (status) {
        case 'ACTIVE': case 'POSTED': case 'COMPLETED': case 'PAID': case 'AVAILABLE':
            return 'bg-success/10 text-success border-success/20';
        case 'INACTIVE': case 'PENDING': case 'IN_PROGRESS': case 'PARTIALLY_PAID': case 'RESERVED':
            return 'bg-warning/10 text-warning border-warning/20';
        case 'ENDED': case 'SUSPENDED': case 'VOID': case 'BLACKLIST': case 'CLOSED': case 'OVERDUE': case 'CANCELLED':
            return 'bg-danger/10 text-danger border-danger/20';
        case 'NEW': case 'CONTACTED': case 'INTERESTED': case 'PLANNED':
             return 'bg-primary/10 text-primary border-primary/20';
        case 'UNPAID': case 'DRAFT':
            return 'bg-neutral/10 text-neutral-foreground border-neutral/20';
        default:
            return 'bg-neutral/10 text-neutral-foreground border-neutral/20';
    }
  };

  return (
    <span className={`status-pill border ${getStatusStyles(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      <span>{children}</span>
    </span>
  );
};

export default StatusPill;
