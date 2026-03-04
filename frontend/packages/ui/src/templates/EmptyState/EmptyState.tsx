/**
 * EmptyState Component
 * Liquid Glass Design System - OmniTrade
 *
 * Displays an empty state with icon, message, and optional action.
 * Used for empty lists, dashboards, and error states.
 */

import React from 'react';
import { clsx } from 'clsx';
import type { EmptyStateProps, EmptyStateSize } from './types';
import styles from './styles.module.css';

const sizeMap: Record<EmptyStateSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

const backgroundMap = {
  none: styles.backgroundNone,
  glass: styles.backgroundGlass,
  subtle: styles.backgroundSubtle,
} as const;

/**
 * Default icons for common empty states
 */
const DefaultIcon: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="9" y2="15" />
  </svg>
);

/**
 * EmptyState displays a placeholder when there's no content to show.
 *
 * @example
 * // Basic empty state
 * <EmptyState
 *   title="No results found"
 *   description="Try adjusting your search filters"
 * />
 *
 * @example
 * // With action button
 * <EmptyState
 *   icon={<SearchIcon />}
 *   title="No trades yet"
 *   description="Start trading to see your history here"
 *   actionLabel="Start Trading"
 *   onActionClick={() => navigate('/trade')}
 * />
 *
 * @example
 * // Horizontal layout with secondary link
 * <EmptyState
 *   orientation="horizontal"
 *   icon={<InboxIcon />}
 *   title="No notifications"
 *   description="You're all caught up!"
 *   secondaryLink={{ label: 'View settings', href: '/settings' }}
 * />
 *
 * @example
 * // Large size with custom action
 * <EmptyState
 *   size="lg"
 *   icon={<ChartIcon />}
 *   title="No portfolio data"
 *   description="Add some assets to your portfolio to see analytics"
 *   action={<Button variant="primary">Add Assets</Button>}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  actionLabel,
  onActionClick,
  secondaryLink,
  size = 'md',
  orientation = 'vertical',
  background = 'none',
  className,
  testId,
}) => {
  return (
    <div
      className={clsx(
        styles.emptyState,
        sizeMap[size],
        orientation === 'horizontal' && styles.horizontal,
        backgroundMap[background],
        className
      )}
      data-testid={testId}
      role="status"
    >
      {/* Icon */}
      <div className={styles.iconContainer} aria-hidden="true">
        {icon || <DefaultIcon />}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}

        {/* Actions */}
        {(action || actionLabel || secondaryLink) && (
          <div className={styles.actions}>
            {/* Primary action */}
            {action}
            {!action && actionLabel && (
              <button
                className={styles.primaryAction}
                onClick={onActionClick}
                type="button"
              >
                {actionLabel}
              </button>
            )}

            {/* Secondary link */}
            {secondaryLink && (
              <>
                {secondaryLink.href ? (
                  <a href={secondaryLink.href} className={styles.secondaryLink}>
                    {secondaryLink.label}
                    <svg
                      className={styles.secondaryLinkIcon}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </a>
                ) : (
                  <button
                    className={styles.secondaryLink}
                    onClick={secondaryLink.onClick}
                    type="button"
                  >
                    {secondaryLink.label}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

EmptyState.displayName = 'EmptyState';

export default EmptyState;
