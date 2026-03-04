/**
 * AuthLayout Component
 * Liquid Glass Design System - OmniTrade
 *
 * Centered card layout for authentication pages (login, signup, forgot password).
 * Features a glass card with optional background patterns.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { AuthLayoutProps } from './types';
import styles from './styles.module.css';

const widthMap = {
  sm: styles.cardSm,
  md: styles.cardMd,
  lg: styles.cardLg,
  full: styles.cardFull,
} as const;

const patternMap = {
  dots: styles.backgroundDots,
  grid: styles.backgroundGrid,
  gradient: styles.backgroundGradient,
  none: null,
} as const;

/**
 * AuthLayout provides a centered card layout for authentication pages.
 *
 * @example
 * // Basic login form
 * <AuthLayout
 *   title="Welcome back"
 *   description="Sign in to your account"
 *   logo={<Logo />}
 * >
 *   <LoginForm />
 * </AuthLayout>
 *
 * @example
 * // Signup form with footer
 * <AuthLayout
 *   title="Create an account"
 *   description="Get started with OmniTrade"
 *   logo={<Logo />}
 *   footer={
 *     <p className={styles.footerText}>
 *       Already have an account?{' '}
 *       <a href="/login" className={styles.footerLink}>Sign in</a>
 *     </p>
 *   }
 * >
 *   <SignupForm />
 * </AuthLayout>
 *
 * @example
 * // With gradient background
 * <AuthLayout
 *   title="Reset password"
 *   showPattern
 *   patternVariant="gradient"
 *   logo={<Logo />}
 * >
 *   <ResetPasswordForm />
 * </AuthLayout>
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  description,
  logo,
  logoHref = '/',
  children,
  footer,
  width = 'md',
  showPattern = true,
  patternVariant = 'dots',
  className,
  testId,
}) => {
  // Render logo
  const renderLogo = () => {
    if (!logo) return null;

    const logoContent = typeof logo === 'string'
      ? <img src={logo} alt="Logo" className={styles.logoImage} />
      : logo;

    if (logoHref) {
      return (
        <a href={logoHref} className={styles.logo}>
          {logoContent}
        </a>
      );
    }

    return <div className={styles.logo}>{logoContent}</div>;
  };

  return (
    <div className={clsx(styles.authLayout, className)} data-testid={testId}>
      {/* Background pattern */}
      {showPattern && (
        <div
          className={clsx(styles.background, patternMap[patternVariant])}
          aria-hidden="true"
        />
      )}

      {/* Auth card */}
      <div className={clsx(styles.card, widthMap[width])}>
        {/* Card header */}
        <div className={styles.cardHeader}>
          {renderLogo()}
          <h1 className={styles.cardTitle}>{title}</h1>
          {description && <p className={styles.cardDescription}>{description}</p>}
        </div>

        {/* Card content */}
        <div className={styles.cardContent}>{children}</div>

        {/* Card footer */}
        {footer && <div className={styles.cardFooter}>{footer}</div>}
      </div>
    </div>
  );
};

AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;
