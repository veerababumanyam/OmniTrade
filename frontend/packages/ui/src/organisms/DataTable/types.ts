/**
 * DataTable Component Types
 * Liquid Glass Design System
 * Macro-Volume Organism
 */

import type { ReactNode, CSSProperties } from 'react';

// ============================================================================
// Column Types
// ============================================================================

export type ColumnAlignment = 'left' | 'center' | 'right';
export type ColumnSortDirection = 'asc' | 'desc' | null;

export interface ColumnFilterConfig {
  /** Enable filtering on this column */
  enabled?: boolean;
  /** Placeholder text for filter input */
  placeholder?: string;
  /** Filter type */
  type?: 'text' | 'select' | 'date' | 'number';
  /** Options for select type */
  options?: Array<{ label: string; value: string | number }>;
}

export interface ColumnConfig<T = Record<string, unknown>> {
  /** Unique column identifier */
  id: string;
  /** Column header label */
  header: ReactNode;
  /** Accessor key or function to get cell value */
  accessor: keyof T | ((row: T) => unknown);
  /** Column width (CSS value or number for pixels) */
  width?: string | number;
  /** Minimum column width */
  minWidth?: string | number;
  /** Maximum column width */
  maxWidth?: string | number;
  /** Text alignment */
  align?: ColumnAlignment;
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Filter configuration */
  filter?: ColumnFilterConfig;
  /** Enable column resizing */
  resizable?: boolean;
  /** Custom cell renderer */
  cell?: (value: unknown, row: T, rowIndex: number) => ReactNode;
  /** Custom header renderer */
  headerCell?: (column: ColumnConfig<T>) => ReactNode;
  /** Column visibility */
  visible?: boolean;
  /** Fixed position (sticky) */
  fixed?: 'left' | 'right';
  /** Custom CSS class for cells in this column */
  className?: string;
  /** Custom styles for cells in this column */
  style?: CSSProperties;
  /** Enable text truncation with ellipsis */
  truncate?: boolean;
  /** Custom sort comparator */
  sortComparator?: (a: T, b: T, direction: 'asc' | 'desc') => number;
}

// ============================================================================
// Row Types
// ============================================================================

export interface RowSelectionConfig {
  /** Selection mode */
  mode: 'single' | 'multi' | 'none';
  /** Selected row IDs */
  selectedIds?: Set<string | number>;
  /** Callback when selection changes */
  onChange?: (selectedIds: Set<string | number>) => void;
  /** Property to use as row ID */
  idKey?: string;
  /** Show checkbox column for multi-select */
  showCheckbox?: boolean;
  /** Allow selecting all rows */
  allowSelectAll?: boolean;
}

export interface RowConfig<T = Record<string, unknown>> {
  /** Custom row class name */
  className?: string | ((row: T, rowIndex: number) => string);
  /** Custom row styles */
  style?: CSSProperties | ((row: T, rowIndex: number) => CSSProperties);
  /** Enable row hover effect */
  hoverable?: boolean;
  /** Stripe alternate rows */
  striped?: boolean;
  /** Row height */
  height?: number | string;
  /** Expandable rows */
  expandable?: boolean;
  /** Render expanded content */
  renderExpanded?: (row: T) => ReactNode;
}

// ============================================================================
// Sorting Types
// ============================================================================

export interface SortConfig {
  /** Currently sorted column ID */
  columnId: string | null;
  /** Sort direction */
  direction: ColumnSortDirection;
  /** Callback when sort changes */
  onChange?: (columnId: string | null, direction: ColumnSortDirection) => void;
}

// ============================================================================
// Filtering Types
// ============================================================================

export interface FilterValue {
  columnId: string;
  value: string | number | Date | undefined;
  operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
}

export interface GlobalFilterConfig {
  /** Enable global search filter */
  enabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Custom filter function */
  filterFn?: <T>(row: T, searchValue: string) => boolean;
}

export interface FilterConfig {
  /** Column-specific filters */
  columnFilters?: FilterValue[];
  /** Global filter configuration */
  global?: GlobalFilterConfig;
  /** Callback when filters change */
  onChange?: (filters: FilterValue[]) => void;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationConfig {
  /** Current page (1-indexed) */
  page?: number;
  /** Items per page */
  pageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Total number of items (for server-side pagination) */
  totalItems?: number;
  /** Callback when page changes */
  onPageChange?: (page: number, pageSize: number) => void;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show total items count */
  showTotalCount?: boolean;
  /** Show quick jump to page */
  showQuickJump?: boolean;
  /** Show page numbers */
  showPageNumbers?: boolean;
  /** Maximum visible page buttons */
  maxVisiblePages?: number;
}

// ============================================================================
// Column Visibility Types
// ============================================================================

export interface ColumnVisibilityConfig {
  /** Column visibility state (columnId -> visible) */
  visibility?: Record<string, boolean>;
  /** Callback when visibility changes */
  onChange?: (visibility: Record<string, boolean>) => void;
  /** Show visibility toggle dropdown */
  showToggle?: boolean;
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportConfig {
  /** Enable CSV export */
  csv?: boolean;
  /** Export button label */
  label?: string;
  /** Filename for export */
  filename?: string;
  /** Custom export function */
  customExport?: (data: unknown[]) => void;
  /** Include hidden columns */
  includeHiddenColumns?: boolean;
}

// ============================================================================
// Empty State Types
// ============================================================================

export interface EmptyStateConfig {
  /** Empty state title */
  title?: string;
  /** Empty state description */
  description?: string;
  /** Custom illustration component */
  illustration?: ReactNode;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Main DataTable Props
// ============================================================================

export interface DataTableProps<T = Record<string, unknown>> {
  /** Column definitions */
  columns: ColumnConfig<T>[];
  /** Data rows */
  data: T[];
  /** Unique identifier for the table */
  id?: string;
  /** Table caption for accessibility */
  caption?: string;
  /** Sorting configuration */
  sorting?: SortConfig;
  /** Filtering configuration */
  filtering?: FilterConfig;
  /** Pagination configuration */
  pagination?: PaginationConfig;
  /** Row selection configuration */
  selection?: RowSelectionConfig;
  /** Row configuration */
  rowConfig?: RowConfig<T>;
  /** Column visibility configuration */
  columnVisibility?: ColumnVisibilityConfig;
  /** Export configuration */
  export?: ExportConfig;
  /** Empty state configuration */
  emptyState?: EmptyStateConfig;
  /** Callback when row is clicked */
  onRowClick?: (row: T, rowIndex: number) => void;
  /** Callback when row is double-clicked */
  onRowDoubleClick?: (row: T, rowIndex: number) => void;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | Error;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Table height (for scrolling) */
  height?: string | number;
  /** Table max height */
  maxHeight?: string | number;
  /** Additional CSS class */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** AI-readable metadata */
  'data-ai-readable'?: boolean;
  /** Test ID for testing */
  'data-testid'?: string;
}

// ============================================================================
// Internal State Types
// ============================================================================

export interface DataTableState {
  sortColumn: string | null;
  sortDirection: ColumnSortDirection;
  currentPage: number;
  pageSize: number;
  selectedRows: Set<string | number>;
  columnVisibility: Record<string, boolean>;
  columnWidths: Record<string, number>;
  filters: FilterValue[];
  globalFilter: string;
}

// ============================================================================
// Signal Types
// ============================================================================

export interface DataTableRowSelectSignal {
  tableId: string;
  rowId: string | number;
  rowData: unknown;
  selected: boolean;
  selectedCount: number;
}

export interface DataTableSortSignal {
  tableId: string;
  columnId: string;
  direction: ColumnSortDirection;
}

export interface DataTableFilterSignal {
  tableId: string;
  filters: FilterValue[];
  globalFilter: string;
  filteredCount: number;
}

export interface DataTablePaginationSignal {
  tableId: string;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// ============================================================================
// Utility Constants
// ============================================================================

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_MAX_VISIBLE_PAGES = 5;
export const DEFAULT_ROW_HEIGHT = 48;
export const DEFAULT_COLUMN_MIN_WIDTH = 80;
export const DEFAULT_COLUMN_MAX_WIDTH = 500;

export const SORT_ICONS: Record<'asc' | 'desc', string> = {
  asc: 'arrow-up',
  desc: 'arrow-down',
} as const;
