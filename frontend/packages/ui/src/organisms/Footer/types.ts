/**
 * Footer Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Macro-Volume for page footer with Photon Physics and Spatial Volumes
 */

import type { ReactNode, ComponentType } from 'react';

// ============================================
// FOOTER LINK TYPES
// ============================================

export interface FooterLink {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Navigation href */
  href?: string;
  /** Icon component */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** Whether link opens in new tab */
  external?: boolean;
  /** Click handler override */
  onClick?: () => void;
  /** Whether link is disabled */
  disabled?: boolean;
}

export interface FooterLinkColumn {
  /** Column identifier */
  id: string;
  /** Column title */
  title?: string;
  /** Links in this column */
  links: FooterLink[];
}

// ============================================
// SOCIAL LINK TYPES
// ============================================

export type SocialPlatform =
  | 'twitter'
  | 'linkedin'
  | 'github'
  | 'discord'
  | 'telegram'
  | 'medium'
  | 'youtube'
  | 'reddit'
  | 'custom';

export interface SocialLink {
  /** Unique identifier */
  id: string;
  /** Platform type */
  platform: SocialPlatform;
  /** Display label for accessibility */
  label: string;
  /** Navigation href */
  href: string;
  /** Icon component (overrides platform default) */
  icon?: ComponentType<{ size?: number; className?: string }>;
  /** Whether link opens in new tab */
  external?: boolean;
}

// ============================================
// LEGAL LINK TYPES
// ============================================

export interface LegalLink extends FooterLink {
  /** Legal document type */
  type?: 'privacy' | 'terms' | 'cookies' | 'disclaimer' | 'license';
}

// ============================================
// FOOTER PROPS
// ============================================

export interface FooterProps {
  /** Link columns */
  links?: FooterLinkColumn[];
  /** Social media links */
  social?: SocialLink[];
  /** Legal links */
  legal?: LegalLink[];
  /** Application version string */
  version?: string;
  /** Copyright text */
  copyright?: string;
  /** Logo element */
  logo?: ReactNode;
  /** Brand name */
  brandName?: string;
  /** Tagline or description */
  tagline?: string;
  /** Newsletter signup configuration */
  newsletter?: NewsletterConfig;
  /** Custom content slot */
  children?: ReactNode;
  /** Compact variant */
  compact?: boolean;
  /** Show divider at top */
  divider?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Enable AI-readable data attributes */
  aiReadable?: boolean;
}

// ============================================
// NEWSLETTER TYPES
// ============================================

export interface NewsletterConfig {
  /** Newsletter title */
  title?: string;
  /** Placeholder text for email input */
  placeholder?: string;
  /** Submit button label */
  submitLabel?: string;
  /** Submit handler */
  onSubmit?: (email: string) => void | Promise<void>;
  /** Success message */
  successMessage?: string;
  /** Show newsletter section */
  enabled?: boolean;
}

// ============================================
// SUB-COMPONENT PROPS
// ============================================

export interface FooterLinksProps {
  /** Link columns */
  columns?: FooterLinkColumn[];
  /** Compact mode */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

export interface FooterSocialProps {
  /** Social links */
  links?: SocialLink[];
  /** Additional CSS class */
  className?: string;
}

export interface FooterLegalProps {
  /** Legal links */
  links?: LegalLink[];
  /** Additional CSS class */
  className?: string;
}

export interface FooterNewsletterProps extends NewsletterConfig {
  /** Additional CSS class */
  className?: string;
}

export interface FooterBottomProps {
  /** Copyright text */
  copyright?: string;
  /** Version string */
  version?: string;
  /** Additional content */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
}

// ============================================
// SIGNAL DATA TYPES
// ============================================

export interface FooterLinkSignalData {
  /** Link that was clicked */
  link: FooterLink;
  /** Column ID if applicable */
  columnId?: string;
  /** Link category */
  category: 'navigation' | 'social' | 'legal';
}

export interface FooterNewsletterSignalData {
  /** Submitted email */
  email: string;
  /** Whether submission was successful */
  success?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

export const FOOTER_Z_INDEX = 0;
export const FOOTER_PADDING_DESKTOP = 64;
export const FOOTER_PADDING_MOBILE = 32;

export const DEFAULT_LEGAL_LINKS: LegalLink[] = [
  { id: 'privacy', label: 'Privacy Policy', type: 'privacy' },
  { id: 'terms', label: 'Terms of Service', type: 'terms' },
  { id: 'cookies', label: 'Cookie Policy', type: 'cookies' },
];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  discord: 'Discord',
  telegram: 'Telegram',
  medium: 'Medium',
  youtube: 'YouTube',
  reddit: 'Reddit',
  custom: 'Social',
};
