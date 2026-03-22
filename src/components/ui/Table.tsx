import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="w-full text-sm text-right border-collapse">
      {children}
    </table>
  </div>
);

interface TableHeaderProps {
  children: React.ReactNode;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children }) => (
  <thead className="border-b border-border">
    <tr className="text-muted-foreground">{children}</tr>
  </thead>
);

interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ children, className = '' }) => (
  <th className={`pb-4 pt-2 font-bold uppercase tracking-widest text-[11px] ${className}`}>
    {children}
  </th>
);

interface TableBodyProps {
  children: React.ReactNode;
}

export const TableBody: React.FC<TableBodyProps> = ({ children }) => (
  <tbody className="divide-y divide-border">{children}</tbody>
);

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '' }) => (
  <tr className={`group hover:bg-muted/50 transition-colors ${className}`}>
    {children}
  </tr>
);

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => (
  <td className={`py-4 ${className}`}>{children}</td>
);
