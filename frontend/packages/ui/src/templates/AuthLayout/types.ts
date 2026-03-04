/**
 * AuthLayout Component Types
 * Liquid Glass Design System - OmniTrade
 *
 * Centered card layout for authentication pages
 */

export interface AuthLayoutProps {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Logo component or image */
  logo?: React.ReactNode;
  /** Logo href */
  logoHref?: string;
  /** Card content children */
  children: React.ReactNode;
  /** Footer content (links like "Sign up", "Forgot password") */
  footer?: React.ReactNode;
  /** Card width */
  width?: 'sm' | 'md' | 'lg' | 'full';
  /** Show background pattern */
  showPattern?: boolean;
  /** Background pattern variant */
  patternVariant?: 'dots' | 'grid' | 'gradient' | 'none';
  /** Additional CSS class names */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

export type AuthLayoutStyleVars = {
  '--ot-auth-card-width'?: string;
};
