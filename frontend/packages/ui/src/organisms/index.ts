/**
 * Organisms - Macro-Volume Components
 * Liquid Glass Design System
 *
 * Organisms are complex components composed of molecules and atoms.
 * They represent complete sections of functionality.
 */

// DataTable - Data Grid with sorting, filtering, pagination
export {
  DataTable,
  default as DataTableDefault,
} from './DataTable';
export type {
  DataTableProps,
  ColumnConfig,
  ColumnAlignment,
  ColumnSortDirection,
  ColumnFilterConfig,
  RowSelectionConfig,
  RowConfig,
  SortConfig,
  FilterConfig,
  FilterValue,
  GlobalFilterConfig,
  PaginationConfig,
  ColumnVisibilityConfig,
  ExportConfig,
  EmptyStateConfig,
  DataTableState,
  DataTableRowSelectSignal,
  DataTableSortSignal,
  DataTableFilterSignal,
  DataTablePaginationSignal,
} from './DataTable';
export {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_MAX_VISIBLE_PAGES,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_COLUMN_MIN_WIDTH,
  DEFAULT_COLUMN_MAX_WIDTH,
} from './DataTable';

// Modal - Dialog overlay with focus trap and animations
export {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ActionButton,
  default as ModalDefault,
} from './Modal';
export type {
  ModalProps,
  ModalSize,
  ModalSizeConfig,
  ModalAnimationConfig,
  ModalAction,
  ModalActionVariant,
  ModalHeaderProps,
  ModalFooterProps,
  ModalContentProps,
  ModalOpenSignal,
  ModalCloseSignal,
  ConfirmationModalProps,
} from './Modal';
export {
  MODAL_SIZES,
  MODAL_ANIMATION,
  OVERLAY_ANIMATION,
} from './Modal';

// Toast - Notification queue with auto-dismiss
export {
  ToastProvider,
  ToastContainer,
  Toast,
  useToast,
  createToastHelpers,
  default as ToastDefault,
} from './Toast';
export type {
  ToastData,
  ToastProps,
  ToastContainerProps,
  ToastProviderProps,
  ToastContextValue,
  ToastType,
  ToastPosition,
  ToastAction,
  ToastDismissSignal,
  ToastShowSignal,
  ToastAnimationConfig,
} from './Toast';
export {
  DEFAULT_DURATION as DEFAULT_TOAST_DURATION,
  DEFAULT_MAX_VISIBLE as DEFAULT_TOAST_MAX_VISIBLE,
  DEFAULT_POSITION as DEFAULT_TOAST_POSITION,
  DEFAULT_GAP as DEFAULT_TOAST_GAP,
  TOAST_ANIMATION,
  TOAST_ICONS,
  TOAST_COLORS,
} from './Toast';

// Header - App navigation with user menu, search, and notifications
export {
  Header,
  default as HeaderDefault,
} from './Header';
export type {
  HeaderProps,
  NavItem,
  NavAction,
  User,
  UserMenuItem,
  Notification,
  SearchProps,
  SearchResult,
  HeaderLogoProps,
  HeaderNavProps,
  HeaderSearchProps,
  HeaderUserMenuProps,
  HeaderNotificationsProps,
  HeaderMobileMenuProps,
  HeaderNavSignalData,
  HeaderSearchSignalData,
  HeaderNotificationSignalData,
} from './Header';
export {
  HEADER_Z_INDEX,
  HEADER_HEIGHT,
  HEADER_HEIGHT_MOBILE,
  DEFAULT_USER_MENU_ITEMS,
} from './Header';

// Sidebar - Side navigation with collapsible sections and pinned items
export {
  Sidebar,
  default as SidebarDefault,
} from './Sidebar';
export type {
  SidebarProps,
  SidebarItem,
  SidebarItemGroup,
  PinnedItem,
  SidebarHeaderProps,
  SidebarContentProps,
  SidebarItemProps,
  SidebarPinnedSectionProps,
  SidebarFooterProps,
  SidebarToggleButtonProps,
  SidebarToggleSignalData,
  SidebarItemSignalData,
  SidebarSearchSignalData,
} from './Sidebar';
export {
  SIDEBAR_Z_INDEX,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_ITEM_HEIGHT,
  SIDEBAR_ITEM_NESTED_INDENT,
  KEYBOARD_SHORTCUTS,
} from './Sidebar';

// Footer - Page footer with links, social, and legal sections
export {
  Footer,
  default as FooterDefault,
} from './Footer';
export type {
  FooterProps,
  FooterLink,
  FooterLinkColumn,
  SocialLink,
  SocialPlatform,
  LegalLink,
  NewsletterConfig,
  FooterLinksProps,
  FooterSocialProps,
  FooterLegalProps,
  FooterNewsletterProps,
  FooterBottomProps,
  FooterLinkSignalData,
  FooterNewsletterSignalData,
} from './Footer';
export {
  FOOTER_Z_INDEX,
  FOOTER_PADDING_DESKTOP,
  FOOTER_PADDING_MOBILE,
  DEFAULT_LEGAL_LINKS,
  SOCIAL_PLATFORM_LABELS,
} from './Footer';
