/**
 * Molecules - Liquid Glass Design System
 * OmniTrade UI Components
 *
 * Molecule components are composed of atoms and provide
 * more complex UI patterns while remaining focused on
 * single responsibilities.
 */

// ============================================
// Card Component
// ============================================
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardSkeleton,
} from './Card';

export type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardSkeletonProps,
  CardClickSignalData,
  CardVariant,
  CardSize,
} from './Card';

export { CARD_PADDING, CARD_HEADER_GAP } from './Card';

// ============================================
// Tag Component
// ============================================
export { Tag } from './Tag';

export type {
  TagProps,
  TagRemoveButtonProps,
  TagInputProps,
  TagRemoveSignalData,
  TagColor,
  TagSize,
} from './Tag';

export { TAG_SIZES, TAG_COLORS } from './Tag';

// ============================================
// ProgressBar Component
// ============================================
export { ProgressBar } from './ProgressBar';

export type {
  ProgressBarProps,
  ProgressBarTrackProps,
  ProgressBarFillProps,
  ProgressBarLabelProps,
  ProgressBarCompleteSignalData,
  ProgressBarVariant,
  ProgressBarSize,
} from './ProgressBar';

export { PROGRESSBAR_SIZES, PROGRESSBAR_COLORS } from './ProgressBar';

// ============================================
// SearchBar Component
// Debounced search input with suggestions dropdown
// ============================================
export { SearchBar } from './SearchBar';

export type {
  SearchBarProps,
  SearchBarSize,
  SearchSuggestion,
  SearchBarState,
  SearchBarKeyboardEvent,
  SearchBarChangeEvent,
  SearchBarStyleVars,
} from './SearchBar';

export {
  SEARCHBAR_SIZES,
  DEFAULT_DEBOUNCE as SEARCHBAR_DEFAULT_DEBOUNCE,
  DEFAULT_MAX_SUGGESTIONS as SEARCHBAR_DEFAULT_MAX_SUGGESTIONS,
} from './SearchBar';

// ============================================
// Dropdown Component
// Multi-select dropdown with search and virtualization
// ============================================
export { Dropdown } from './Dropdown';

export type {
  DropdownProps,
  DropdownItem,
  DropdownGroup,
  DropdownSize,
  DropdownContextValue,
  DropdownState,
  DropdownStyleVars,
} from './Dropdown';

export {
  DROPDOWN_SIZES,
  DEFAULT_MAX_VISIBLE_ITEMS as DROPDOWN_DEFAULT_MAX_VISIBLE_ITEMS,
  DEFAULT_ITEM_HEIGHT as DROPDOWN_DEFAULT_ITEM_HEIGHT,
  DEFAULT_SIDE_OFFSET as DROPDOWN_DEFAULT_SIDE_OFFSET,
} from './Dropdown';

// ============================================
// DatePicker Component
// Date/range picker with presets and time selection
// ============================================
export { DatePicker } from './DatePicker';

export type {
  DatePickerProps,
  DatePickerSize,
  DateRange,
  DatePreset,
  DatePickerState,
  CalendarDay,
  CalendarWeek,
  DatePickerStyleVars,
} from './DatePicker';

export {
  DATEPICKER_SIZES,
  WEEKDAY_NAMES,
  MONTH_NAMES,
  PRESET_LABELS,
  DEFAULT_PRESETS,
} from './DatePicker';

// ============================================
// ChatBubble Component
// Chat message display with role-based styling
// ============================================
export { ChatBubble } from './ChatBubble';

export type {
  ChatRole,
  ChatStatus,
  ChatActionType,
  ChatAction,
  ChatAvatar,
  ChatBubbleProps,
  ChatBubbleSignalEvent,
  ChatBubbleStyleVars,
} from './ChatBubble';

// ============================================
// ChatInput Component
// Message input with auto-grow and suggestions
// ============================================
export { ChatInput } from './ChatInput';

export type {
  ChatInputVariant,
  SuggestionType,
  Suggestion,
  Attachment,
  ChatInputProps,
  ChatInputSignalEvent,
  ChatInputStyleVars,
  ChatInputRef,
} from './ChatInput';

// ============================================
// ChatMessageList Component
// Virtualized message list with grouping
// ============================================
export { ChatMessageList } from './ChatMessageList';

export type {
  ChatMessage,
  DateSeparator,
  MessageListItem,
  UnreadIndicator,
  TypingIndicatorConfig,
  ChatMessageListProps,
  ChatMessageListSignalEvent,
  ChatMessageListRef,
  ChatMessageListStyleVars,
} from './ChatMessageList';

// ============================================
// TabGroup Component
// Animated tabs with Radix UI foundation
// ============================================
export { TabGroup } from './TabGroup';

export type {
  TabGroupProps,
  TabItem,
  TabPanelContent,
  TabVariant,
  TabOrientation,
  TabTriggerProps,
  TabPanelProps,
  TabListProps,
  TabChangeSignalPayload,
  TabIndicatorStyleVars,
} from './TabGroup';

// ============================================
// Breadcrumb Component
// Collapsible navigation trail
// ============================================
export { Breadcrumb, BreadcrumbWithCollapse } from './Breadcrumb';

export type {
  BreadcrumbProps,
  BreadcrumbItem,
  BreadcrumbCollapse,
  BreadcrumbItemProps,
  BreadcrumbSeparatorProps,
  BreadcrumbEllipsisProps,
  BreadcrumbNavigateSignalPayload,
  BreadcrumbStyleVars,
} from './Breadcrumb';

// ============================================
// Alert Component
// Dismissible notification with variants
// ============================================
export { Alert } from './Alert';

export type {
  AlertProps,
  AlertVariant,
  AlertSize,
  AlertAction,
  AlertTitleProps,
  AlertDescriptionProps,
  AlertActionsProps,
  AlertIconProps,
  AlertDismissSignalPayload,
  AlertStyleVars,
  AlertContextValue,
} from './Alert';

// ============================================
// FloatingTooltip Component
// Feature-rich tooltip built on Radix UI
// ============================================
export { FloatingTooltip, FloatingTooltipSimple } from './FloatingTooltip';

export type {
  FloatingTooltipProps,
  FloatingTooltipPosition,
  FloatingTooltipDelay,
  FloatingTooltipContentProps,
  FloatingTooltipArrowProps,
  FloatingTooltipVisibilitySignalPayload,
  FloatingTooltipStyleVars,
} from './FloatingTooltip';

export {
  DEFAULT_FLOATING_TOOLTIP_DELAY,
  DEFAULT_FLOATING_TOOLTIP_OFFSET,
  DEFAULT_FLOATING_TOOLTIP_MAX_WIDTH,
} from './FloatingTooltip';

// ============================================
// Popover Component
// Floating content container with focus trap
// ============================================
export { Popover, PopoverHeader, PopoverBody, PopoverFooter } from './Popover';

export type {
  PopoverProps,
  PopoverPlacement,
  PopoverSide,
  PopoverAlign,
  PopoverContentProps,
  PopoverArrowProps,
  PopoverTriggerProps,
  PopoverVisibilitySignalPayload,
  PopoverCloseSignalPayload,
  PopoverStyleVars,
} from './Popover';

export {
  DEFAULT_POPOVER_OFFSET,
  DEFAULT_POPOVER_MIN_WIDTH,
  DEFAULT_POPOVER_MAX_WIDTH,
  parsePlacement,
  combinePlacement,
} from './Popover';
