/**
 * DataTable Component
 * Liquid Glass Design System
 * Macro-Volume Organism - Z-axis: translateZ(4px)
 *
 * Features:
 * - Sortable columns
 * - Filterable with search
 * - Pagination with page size selector
 * - Row selection (single/multi)
 * - Sticky header
 * - Resizable columns
 * - Column visibility toggle
 * - Export to CSV
 * - Empty state with illustration
 * - AI-readable metadata
 * - Signal: emit 'ui:table:row:select' on row select
 */

'use client';

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import { useDebounce } from '../../hooks/useDebounce';
import type {
  DataTableProps,
  ColumnConfig,
  ColumnSortDirection,
  FilterValue,
} from './types';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_MAX_VISIBLE_PAGES,
  DEFAULT_COLUMN_MIN_WIDTH,
} from './types';
import styles from './styles.module.css';

// ============================================================================
// Icons (inline SVG components)
// ============================================================================

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const SortAscIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12l7-7 7 7" />
  </svg>
);

const SortDescIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19V5M5 12l7 7 7-7" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MinusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ColumnsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const EmptyTableIcon = () => (
  <svg viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="20" y="40" width="120" height="80" rx="8" opacity="0.3" />
    <line x1="20" y1="65" x2="140" y2="65" opacity="0.3" />
    <line x1="55" y1="40" x2="55" y2="120" opacity="0.3" />
    <line x1="95" y1="40" x2="95" y2="120" opacity="0.3" />
    <circle cx="80" cy="92" r="20" opacity="0.5" />
    <line x1="94" y1="106" x2="110" y2="122" strokeWidth="3" opacity="0.5" />
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ============================================================================
// Utility Functions
// ============================================================================

function getCellValue<T>(row: T, accessor: keyof T | ((row: T) => unknown)): unknown {
  if (typeof accessor === 'function') {
    return accessor(row);
  }
  return row[accessor];
}

function compareValues<T>(
  a: T,
  b: T,
  accessor: keyof T | ((row: T) => unknown),
  direction: 'asc' | 'desc'
): number {
  const aVal = getCellValue(a, accessor);
  const bVal = getCellValue(b, accessor);

  if (aVal === bVal) return 0;
  if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1;
  if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1;

  const comparison = aVal < bVal ? -1 : 1;
  return direction === 'asc' ? comparison : -comparison;
}

function filterRow<T>(
  row: T,
  columns: ColumnConfig<T>[],
  globalFilter: string,
  columnFilters: FilterValue[]
): boolean {
  // Apply global filter
  if (globalFilter) {
    const searchLower = globalFilter.toLowerCase();
    const matchesGlobal = columns.some((col) => {
      const value = getCellValue(row, col.accessor);
      return String(value).toLowerCase().includes(searchLower);
    });
    if (!matchesGlobal) return false;
  }

  // Apply column-specific filters
  for (const filter of columnFilters) {
    const col = columns.find((c) => c.id === filter.columnId);
    if (!col || filter.value === undefined || filter.value === '') continue;

    const cellValue = String(getCellValue(row, col.accessor)).toLowerCase();
    const filterValue = String(filter.value).toLowerCase();

    const operator = filter.operator || 'contains';
    let matches = false;

    switch (operator) {
      case 'equals':
        matches = cellValue === filterValue;
        break;
      case 'startsWith':
        matches = cellValue.startsWith(filterValue);
        break;
      case 'endsWith':
        matches = cellValue.endsWith(filterValue);
        break;
      case 'contains':
      default:
        matches = cellValue.includes(filterValue);
        break;
    }

    if (!matches) return false;
  }

  return true;
}

function exportToCSV<T>(
  data: T[],
  columns: ColumnConfig<T>[],
  filename: string = 'table-export.csv'
): void {
  const visibleColumns = columns.filter((col) => col.visible !== false);

  // Build header row
  const headers = visibleColumns.map((col) => {
    const headerText = typeof col.header === 'string' ? col.header : col.id;
    return `"${headerText.replace(/"/g, '""')}"`;
  });

  // Build data rows
  const rows = data.map((row) =>
    visibleColumns
      .map((col) => {
        const value = getCellValue(row, col.accessor);
        return `"${String(value ?? '').replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');

  // Create and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ============================================================================
// DataTable Component
// ============================================================================

export function DataTable<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  id = 'data-table',
  caption,
  sorting,
  filtering,
  pagination,
  selection,
  rowConfig,
  columnVisibility,
  export: exportConfig,
  emptyState,
  onRowClick,
  onRowDoubleClick,
  loading = false,
  error,
  height,
  maxHeight,
  className,
  style,
  'data-ai-readable': aiReadable = true,
  'data-testid': testId,
}: DataTableProps<T>) {
  // ========================================================================
  // State
  // ========================================================================

  const [sortColumn, setSortColumn] = useState<string | null>(
    sorting?.columnId ?? null
  );
  const [sortDirection, setSortDirection] = useState<ColumnSortDirection>(
    sorting?.direction ?? null
  );
  const [currentPage, setCurrentPage] = useState(pagination?.page ?? 1);
  const [pageSize, setPageSize] = useState(
    pagination?.pageSize ?? DEFAULT_PAGE_SIZE
  );
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(
    new Set(selection?.selectedIds ?? [])
  );
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters] = useState<FilterValue[]>(
    filtering?.columnFilters ?? []
  );
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => {
      initial[col.id] = col.visible !== false;
    });
    return columnVisibility?.visibility ?? initial;
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Debounce global filter
  const debouncedGlobalFilter = useDebounce(globalFilter, filtering?.global?.debounceMs ?? 300);

  // ========================================================================
  // Memoized Data Processing
  // ========================================================================

  const processedColumns = useMemo(() => {
    return columns.map((col) => ({
      ...col,
      visible: visibleColumns[col.id] ?? col.visible ?? true,
    }));
  }, [columns, visibleColumns]);

  const filteredData = useMemo(() => {
    return data.filter((row) =>
      filterRow(row, processedColumns, debouncedGlobalFilter, columnFilters)
    );
  }, [data, processedColumns, debouncedGlobalFilter, columnFilters]);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    const sortCol = processedColumns.find((col) => col.id === sortColumn);
    if (!sortCol) return filteredData;

    return [...filteredData].sort((a, b) => {
      if (sortCol.sortComparator) {
        return sortCol.sortComparator(a, b, sortDirection);
      }
      return compareValues(a, b, sortCol.accessor, sortDirection);
    });
  }, [filteredData, sortColumn, sortDirection, processedColumns]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const totalItems = pagination?.totalItems ?? filteredData.length;

  // ========================================================================
  // Callbacks
  // ========================================================================

  const handleSort = useCallback(
    (columnId: string) => {
      const col = processedColumns.find((c) => c.id === columnId);
      if (!col?.sortable) return;

      let newDirection: ColumnSortDirection = 'asc';
      if (sortColumn === columnId) {
        if (sortDirection === 'asc') newDirection = 'desc';
        else if (sortDirection === 'desc') newDirection = null;
      }

      setSortColumn(newDirection ? columnId : null);
      setSortDirection(newDirection);
      sorting?.onChange?.(newDirection ? columnId : null, newDirection);

      // Emit signal
      if (newDirection) {
        signalBus.publish('ui:table:sort:change', {
          tableId: id,
          columnId,
          direction: newDirection,
        }, { source: 'DataTable' });
      }
    },
    [id, sortColumn, sortDirection, sorting, processedColumns]
  );

  const handleRowSelect = useCallback(
    (rowId: string | number, rowData: T) => {
      if (!selection || selection.mode === 'none') return;

      const newSelected = new Set(selectedRows);

      if (selection.mode === 'single') {
        newSelected.clear();
        newSelected.add(rowId);
      } else {
        if (newSelected.has(rowId)) {
          newSelected.delete(rowId);
        } else {
          newSelected.add(rowId);
        }
      }

      setSelectedRows(newSelected);
      selection.onChange?.(newSelected);

      // Emit signal
      signalBus.publish('ui:table:row:select', {
        tableId: id,
        rowId,
        rowData,
        selected: newSelected.has(rowId),
        selectedCount: newSelected.size,
      }, { source: 'DataTable' });
    },
    [id, selection, selectedRows]
  );

  const handleSelectAll = useCallback(() => {
    if (!selection || selection.mode !== 'multi') return;

    const allSelected = paginatedData.every((row) => {
      const rowId = selection.idKey
        ? (row as Record<string, unknown>)[selection.idKey]
        : processedColumns[0]?.id
        ? getCellValue(row, processedColumns[0].accessor as keyof T)
        : null;
      return rowId !== null && selectedRows.has(rowId as string | number);
    });

    const newSelected = new Set(selectedRows);

    if (allSelected) {
      // Deselect all visible rows
      paginatedData.forEach((row) => {
        const rowId = selection.idKey
          ? (row as Record<string, unknown>)[selection.idKey]
          : processedColumns[0]?.id
          ? getCellValue(row, processedColumns[0].accessor as keyof T)
          : null;
        if (rowId !== null) newSelected.delete(rowId as string | number);
      });
    } else {
      // Select all visible rows
      paginatedData.forEach((row) => {
        const rowId = selection.idKey
          ? (row as Record<string, unknown>)[selection.idKey]
          : processedColumns[0]?.id
          ? getCellValue(row, processedColumns[0].accessor as keyof T)
          : null;
        if (rowId !== null) newSelected.add(rowId as string | number);
      });
    }

    setSelectedRows(newSelected);
    selection.onChange?.(newSelected);
  }, [selection, paginatedData, selectedRows, processedColumns]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      pagination?.onPageChange?.(newPage, pageSize);

      signalBus.publish('ui:table:page:change', {
        tableId: id,
        page: newPage,
        pageSize,
        totalItems,
        totalPages,
      }, { source: 'DataTable' });
    },
    [id, pagination, pageSize, totalItems, totalPages]
  );

  const handlePageSizeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newSize = Number(e.target.value);
      setPageSize(newSize);
      setCurrentPage(1);
      pagination?.onPageChange?.(1, newSize);
    },
    [pagination]
  );

  const handleExport = useCallback(() => {
    const dataToExport = exportConfig?.includeHiddenColumns ? data : filteredData;
    exportToCSV(dataToExport, processedColumns, exportConfig?.filename ?? 'export.csv');
    exportConfig?.customExport?.(dataToExport);
  }, [data, filteredData, processedColumns, exportConfig]);

  const handleColumnVisibilityChange = useCallback(
    (columnId: string, visible: boolean) => {
      const newVisibility = { ...visibleColumns, [columnId]: visible };
      setVisibleColumns(newVisibility);
      columnVisibility?.onChange?.(newVisibility);
    },
    [visibleColumns, columnVisibility]
  );

  // Column resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, columnId: string) => {
      e.preventDefault();
      setResizingColumn(columnId);
      resizeStartX.current = e.clientX;
      resizeStartWidth.current = columnWidths[columnId] ?? 150;
    },
    [columnWidths]
  );

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX.current;
      const newWidth = Math.max(
        DEFAULT_COLUMN_MIN_WIDTH,
        resizeStartWidth.current + delta
      );
      setColumnWidths((prev) => ({ ...prev, [resizingColumn]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent, rowId: string | number, rowData: T, rowIndex: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleRowSelect(rowId, rowData);
      } else if (e.key === 'ArrowDown' && rowIndex < paginatedData.length - 1) {
        const nextRow = tableRef.current?.querySelectorAll('[data-row-index]')[
          rowIndex + 1
        ] as HTMLElement;
        nextRow?.focus();
      } else if (e.key === 'ArrowUp' && rowIndex > 0) {
        const prevRow = tableRef.current?.querySelectorAll('[data-row-index]')[
          rowIndex - 1
        ] as HTMLElement;
        prevRow?.focus();
      }
    },
    [handleRowSelect, paginatedData.length]
  );

  // ========================================================================
  // Render Helpers
  // ========================================================================

  const renderPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = pagination?.maxVisiblePages ?? DEFAULT_MAX_VISIBLE_PAGES;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }

    return pages.map((page, idx) => {
      if (page === 'ellipsis') {
        return (
          <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>
            ...
          </span>
        );
      }
      return (
        <button
          key={page}
          className={cn(styles.pageButton, currentPage === page && styles.pageButtonActive)}
          onClick={() => handlePageChange(page)}
          aria-current={currentPage === page ? 'page' : undefined}
        >
          {page}
        </button>
      );
    });
  };

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <div className={styles.emptyIllustration}>
        {emptyState?.illustration ?? <EmptyTableIcon />}
      </div>
      <h3 className={styles.emptyTitle}>
        {emptyState?.title ?? 'No data available'}
      </h3>
      <p className={styles.emptyDescription}>
        {emptyState?.description ?? 'There are no records to display at this time.'}
      </p>
      {emptyState?.action && (
        <button className={styles.emptyAction} onClick={emptyState.action.onClick}>
          {emptyState.action.label}
        </button>
      )}
    </div>
  );

  const renderError = () => (
    <div className={styles.errorState}>
      <div className={styles.errorIcon}>
        <ErrorIcon />
      </div>
      <h3 className={styles.errorTitle}>Error loading data</h3>
      <p className={styles.errorMessage}>
        {error instanceof Error ? error.message : String(error)}
      </p>
    </div>
  );

  const renderLoading = () => (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingSpinner} role="status" aria-label="Loading" />
    </div>
  );

  // ========================================================================
  // Render
  // ========================================================================

  const visibleColumnsList = processedColumns.filter((col) => col.visible);
  const hasSelection = selection && selection.mode !== 'none' && selection.showCheckbox;
  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => {
      const rowId = selection?.idKey
        ? (row as Record<string, unknown>)[selection.idKey]
        : getCellValue(row, processedColumns[0]?.accessor as keyof T);
      return rowId !== null && selectedRows.has(rowId as string | number);
    });
  const someSelected =
    paginatedData.some((row) => {
      const rowId = selection?.idKey
        ? (row as Record<string, unknown>)[selection.idKey]
        : getCellValue(row, processedColumns[0]?.accessor as keyof T);
      return rowId !== null && selectedRows.has(rowId as string | number);
    }) && !allSelected;

  return (
    <div
      ref={tableRef}
      className={cn(styles.dataTable, className)}
      style={{
        height,
        maxHeight,
        ...style,
      }}
      data-ai-readable={aiReadable}
      data-testid={testId}
      role="region"
      aria-label={caption ?? 'Data table'}
    >
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {filtering?.global?.enabled !== false && (
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>
                <SearchIcon />
              </span>
              <input
                type="search"
                className={styles.searchInput}
                placeholder={filtering?.global?.placeholder ?? 'Search...'}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                aria-label="Search table"
              />
            </div>
          )}
        </div>

        <div className={styles.toolbarRight}>
          {/* Column Visibility Toggle */}
          {columnVisibility?.showToggle !== false && (
            <div className={styles.columnVisibilityDropdown}>
              <button
                className={styles.toolbarButton}
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                aria-expanded={showColumnMenu}
                aria-haspopup="menu"
              >
                <ColumnsIcon />
                <span>Columns</span>
              </button>
              {showColumnMenu && (
                <div className={styles.columnVisibilityMenu} role="menu">
                  {columns.map((col) => (
                    <label
                      key={col.id}
                      className={styles.columnVisibilityItem}
                      role="menuitem"
                    >
                      <span
                        className={cn(
                          styles.checkbox,
                          visibleColumns[col.id] !== false && styles.checkboxChecked
                        )}
                      >
                        {visibleColumns[col.id] !== false && <CheckIcon />}
                      </span>
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.id] !== false}
                        onChange={(e) =>
                          handleColumnVisibilityChange(col.id, e.target.checked)
                        }
                        style={{ display: 'none' }}
                      />
                      <span>{typeof col.header === 'string' ? col.header : col.id}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Export Button */}
          {exportConfig?.csv !== false && (
            <button className={styles.toolbarButton} onClick={handleExport}>
              <DownloadIcon />
              <span>{exportConfig?.label ?? 'Export'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className={styles.tableContainer}>
        {error ? (
          renderError()
        ) : paginatedData.length === 0 && !loading ? (
          renderEmptyState()
        ) : (
          <table className={styles.table} role="grid">
            {caption && <caption className={styles.srOnly}>{caption}</caption>}

            {/* Header */}
            <thead className={styles.thead}>
              <tr className={styles.headerRow}>
                {/* Selection Checkbox Column */}
                {hasSelection && (
                  <th
                    className={cn(styles.headerCell, styles.headerCellSelection)}
                    scope="col"
                  >
                    {selection.mode === 'multi' && selection.allowSelectAll !== false && (
                      <button
                        className={cn(
                          styles.checkbox,
                          allSelected && styles.checkboxChecked,
                          someSelected && styles.checkboxIndeterminate
                        )}
                        onClick={handleSelectAll}
                        aria-label={allSelected ? 'Deselect all' : 'Select all'}
                      >
                        <span className={styles.checkboxIcon}>
                          {someSelected ? <MinusIcon /> : <CheckIcon />}
                        </span>
                      </button>
                    )}
                  </th>
                )}

                {/* Data Columns */}
                {visibleColumnsList.map((col) => {
                  const isSorted = sortColumn === col.id;
                  const width = columnWidths[col.id] ?? col.width;

                  return (
                    <th
                      key={col.id}
                      className={cn(
                        styles.headerCell,
                        col.sortable && styles.headerCellSortable,
                        isSorted && styles.headerCellSorted,
                        col.align === 'center' && styles.headerCellAlignCenter,
                        col.align === 'right' && styles.headerCellAlignRight,
                        col.fixed === 'left' && styles.headerCellFixedLeft,
                        col.fixed === 'right' && styles.headerCellFixedRight
                      )}
                      style={{
                        width: typeof width === 'number' ? `${width}px` : width,
                        minWidth: col.minWidth,
                        maxWidth: col.maxWidth,
                        textAlign: col.align,
                      }}
                      onClick={() => handleSort(col.id)}
                      aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <span className={styles.headerContent}>
                        {col.headerCell ? col.headerCell(col) : col.header}
                        {col.sortable && (
                          <span className={styles.sortIcon}>
                            {isSorted && sortDirection === 'asc' ? (
                              <SortAscIcon />
                            ) : isSorted && sortDirection === 'desc' ? (
                              <SortDescIcon />
                            ) : (
                              <SortAscIcon />
                            )}
                          </span>
                        )}
                      </span>

                      {/* Resize Handle */}
                      {col.resizable !== false && (
                        <div
                          className={cn(
                            styles.resizeHandle,
                            resizingColumn === col.id && styles.resizeHandleActive
                          )}
                          onMouseDown={(e) => handleResizeStart(e, col.id)}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody className={styles.tbody}>
              {paginatedData.map((row, rowIndex) => {
                const rowId: string | number | null = selection?.idKey
                  ? (row as Record<string, unknown>)[selection.idKey] as string | number | null
                  : getCellValue(row, processedColumns[0]?.accessor as keyof T) as string | number | null;
                const isSelected = rowId !== null && selectedRows.has(rowId as string | number);

                return (
                  <tr
                    key={rowId ?? rowIndex}
                    className={cn(
                      styles.bodyRow,
                      rowConfig?.hoverable !== false && styles.bodyRowHoverable,
                      rowConfig?.striped && styles.bodyRowStriped,
                      isSelected && styles.bodyRowSelected,
                      (onRowClick || selection) && styles.bodyRowClickable
                    )}
                    data-row-index={rowIndex}
                    onClick={() => {
                      onRowClick?.(row, rowIndex);
                      if (rowId !== null) handleRowSelect(rowId as string | number, row);
                    }}
                    onDoubleClick={() => onRowDoubleClick?.(row, rowIndex)}
                    onKeyDown={(e) => {
                      if (rowId !== null) {
                        handleKeyDown(e, rowId as string | number, row, rowIndex);
                      }
                    }}
                    tabIndex={0}
                    role="row"
                    aria-selected={isSelected}
                  >
                    {/* Selection Checkbox */}
                    {hasSelection && (
                      <td className={cn(styles.bodyCell, styles.bodyCellSelection)}>
                        <span
                          className={cn(
                            styles.checkbox,
                            isSelected && styles.checkboxChecked
                          )}
                        >
                          <span className={styles.checkboxIcon}>
                            {isSelected && <CheckIcon />}
                          </span>
                        </span>
                      </td>
                    )}

                    {/* Data Cells */}
                    {visibleColumnsList.map((col) => {
                      const value = getCellValue(row, col.accessor);

                      return (
                        <td
                          key={col.id}
                          className={cn(
                            styles.bodyCell,
                            col.align === 'center' && styles.bodyCellAlignCenter,
                            col.align === 'right' && styles.bodyCellAlignRight,
                            col.truncate && styles.bodyCellTruncate,
                            col.fixed === 'left' && styles.bodyCellFixedLeft,
                            col.fixed === 'right' && styles.bodyCellFixedRight,
                            col.className
                          )}
                          style={col.style}
                        >
                          {col.cell ? col.cell(value, row, rowIndex) : String(value ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            {pagination.showPageSizeSelector !== false && (
              <div className={styles.paginationPageSize}>
                <span>Rows per page:</span>
                <select
                  className={styles.pageSizeSelect}
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  aria-label="Rows per page"
                >
                  {(pagination.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS).map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {pagination.showTotalCount !== false && (
              <span>
                {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
              </span>
            )}
          </div>

          <nav className={styles.paginationNav} aria-label="Table pagination">
            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ChevronLeftIcon />
              <ChevronLeftIcon />
            </button>
            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </button>

            {pagination.showPageNumbers !== false && renderPageNumbers()}

            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </button>
            <button
              className={styles.pageButton}
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <ChevronRightIcon />
              <ChevronRightIcon />
            </button>
          </nav>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && renderLoading()}
    </div>
  );
}

export default DataTable;
