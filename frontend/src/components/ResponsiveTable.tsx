/**
 * ResponsiveTable Component
 * Mobile-first responsive table with adaptive layout
 */

import React, { useState } from 'react';
import { cn } from '../utils/cn';

type TableRow = Record<string, unknown>;

interface TableColumn<Row extends TableRow = TableRow> {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, row: Row) => React.ReactNode;
  className?: string;
  mobileHidden?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface ResponsiveTableProps<Row extends TableRow = TableRow> {
  data: Row[];
  columns: Array<TableColumn<Row>>;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: Row) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

const ResponsiveTable = <Row extends TableRow,>({
  data,
  columns,
  className,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  onSort,
  sortColumn,
  sortDirection,
}: ResponsiveTableProps<Row>) => {
  const [expandedRows, setExpandedRows] = useState<Set<number | string>>(new Set());

  const renderContent = (content: unknown): React.ReactNode => {
    if (content === null || content === undefined || typeof content === 'boolean') {
      return null;
    }

    if (React.isValidElement(content) || typeof content === 'string' || typeof content === 'number') {
      return content;
    }

    return String(content);
  };

  const handleSort = (column: TableColumn) => {
    if (!column.sortable || !onSort) return;

    const currentDirection = sortColumn === column.key ? sortDirection : null;
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    
    onSort(column.key, newDirection);
  };

  const toggleExpanded = (index: number | string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getSortIcon = (column: TableColumn) => {
    if (column.key !== sortColumn) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const renderCell = (column: TableColumn<Row>, row: Row) => {
    const value = row[column.key];
    const content = column.render ? column.render(value, row) : value;

    return (
      <td
        key={column.key}
        className={cn(
          'px-4 py-3 mobile:px-4 mobile:py-4 text-sm whitespace-nowrap',
          column.className,
          onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
        )}
        onClick={() => onRowClick && onRowClick(row)}
      >
        {renderContent(content)}
      </td>
    );
  };

  const renderMobileRow = (row: Row, index: number | string) => {
    const isExpanded = expandedRows.has(index);
    const visibleColumns = columns.filter(col => !col.mobileHidden && col.priority !== 'low');

    return (
      <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
        <div
          className="p-4 mobile:p-6"
          onClick={() => toggleExpanded(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {visibleColumns.slice(0, 2).map((column) => {
                const value = row[column.key];
                const content = column.render ? column.render(value, row) : value;
                
                return (
                  <div key={column.key} className="mb-2 last:mb-0">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {column.title}
                    </div>
                    <div className="text-mobile-base text-base text-gray-900 dark:text-white">
                      {renderContent(content)}
                    </div>
                  </div>
                );
              })}
            </div>
            {visibleColumns.length > 2 && (
              <svg
                className={cn(
                  'w-5 h-5 text-gray-400 transition-transform',
                  isExpanded && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="px-4 mobile:px-6 pb-4 mobile:pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-4 space-y-4">
              {columns.slice(2).map((column) => {
                const value = row[column.key];
                const content = column.render ? column.render(value, row) : value;
                
                return (
                  <div key={column.key}>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      {column.title}
                    </div>
                    <div className="text-mobile-base text-base text-gray-900 dark:text-white">
                      {renderContent(content)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 h-10 rounded-lg mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg mb-2"></div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 mobile:py-16">
        <div className="text-gray-500 dark:text-gray-400 text-mobile-base text-base">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop/Tablet Table */}
      <div className="hidden mobile:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 mobile:px-4 mobile:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => renderCell(column, row))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile:hidden">
        {data.map((row, index) => renderMobileRow(row, index))}
      </div>
    </div>
  );
};

export default ResponsiveTable;
