/**
 * TradeLayout Component
 * Liquid Glass Design System - OmniTrade
 *
 * A resizable split panel layout for trading interfaces.
 * Supports horizontal and vertical splits with collapsible panels.
 */

import React, { useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import type { TradeLayoutProps } from './types';
import styles from './styles.module.css';

/**
 * Icons for panel controls
 */
const Icons = {
  expand: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
  collapse: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
  fullscreen: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  ),
  exitFullscreen: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  chevronUp: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  chevronDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

/**
 * TradeLayout provides a resizable split panel for trading interfaces.
 *
 * @example
 * // Basic horizontal split
 * <TradeLayout
 *   leftContent={<Chart />}
 *   rightContent={<OrderForm />}
 *   splitRatio={0.7}
 * />
 *
 * @example
 * // Vertical split with controls
 * <TradeLayout
 *   direction="vertical"
 *   leftContent={<PortfolioChart />}
 *   rightContent={<OrderBook />}
 *   splitRatio={0.6}
 *   showFullscreenToggle
 *   leftLabel="Chart"
 *   rightLabel="Order Book"
 * />
 */
export const TradeLayout: React.FC<TradeLayoutProps> = ({
  leftContent,
  rightContent,
  splitRatio: controlledSplitRatio = 0.6,
  minSplitRatio = 0.2,
  maxSplitRatio = 0.8,
  direction = 'horizontal',
  onSplitChange,
  leftCollapsed: controlledLeftCollapsed = false,
  rightCollapsed: controlledRightCollapsed = false,
  onLeftCollapse,
  onRightCollapse,
  showFullscreenToggle = true,
  leftFullscreen: controlledLeftFullscreen = false,
  rightFullscreen: controlledRightFullscreen = false,
  onLeftFullscreen,
  onRightFullscreen,
  resizerSize = 4,
  leftLabel = 'Chart',
  rightLabel = 'Order',
  className,
  testId,
}) => {
  // Internal state for uncontrolled mode
  const [internalSplitRatio, setInternalSplitRatio] = useState(controlledSplitRatio);
  const [isResizing, setIsResizing] = useState(false);

  // Determine if split ratio is controlled
  const isSplitControlled = controlledSplitRatio !== undefined && onSplitChange !== undefined;
  const splitRatio = isSplitControlled ? controlledSplitRatio : internalSplitRatio;

  // Container ref for calculating resize
  const containerRef = useRef<HTMLDivElement>(null);

  // Clamp split ratio within bounds
  const clampRatio = useCallback((ratio: number) => {
    return Math.min(maxSplitRatio, Math.max(minSplitRatio, ratio));
  }, [minSplitRatio, maxSplitRatio]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      let newRatio: number;
      if (direction === 'horizontal') {
        newRatio = (clientX - rect.left) / rect.width;
      } else {
        newRatio = (clientY - rect.top) / rect.height;
      }

      newRatio = clampRatio(newRatio);

      if (isSplitControlled) {
        onSplitChange?.(newRatio);
      } else {
        setInternalSplitRatio(newRatio);
        onSplitChange?.(newRatio);
      }
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }, [direction, clampRatio, isSplitControlled, onSplitChange]);

  // Handle left panel collapse toggle
  const handleLeftCollapse = useCallback(() => {
    const newCollapsed = !controlledLeftCollapsed;
    onLeftCollapse?.(newCollapsed);
  }, [controlledLeftCollapsed, onLeftCollapse]);

  // Handle right panel collapse toggle
  const handleRightCollapse = useCallback(() => {
    const newCollapsed = !controlledRightCollapsed;
    onRightCollapse?.(newCollapsed);
  }, [controlledRightCollapsed, onRightCollapse]);

  // Handle left panel fullscreen toggle
  const handleLeftFullscreen = useCallback(() => {
    const newFullscreen = !controlledLeftFullscreen;
    onLeftFullscreen?.(newFullscreen);
    // Ensure right is not fullscreen when left is
    if (newFullscreen && controlledRightFullscreen) {
      onRightFullscreen?.(false);
    }
  }, [controlledLeftFullscreen, controlledRightFullscreen, onLeftFullscreen, onRightFullscreen]);

  // Handle right panel fullscreen toggle
  const handleRightFullscreen = useCallback(() => {
    const newFullscreen = !controlledRightFullscreen;
    onRightFullscreen?.(newFullscreen);
    // Ensure left is not fullscreen when right is
    if (newFullscreen && controlledLeftFullscreen) {
      onLeftFullscreen?.(false);
    }
  }, [controlledLeftFullscreen, controlledRightFullscreen, onLeftFullscreen, onRightFullscreen]);

  // Calculate panel sizes
  const leftSize = controlledLeftCollapsed ? 0 : controlledRightCollapsed ? 100 : splitRatio * 100;
  const rightSize = controlledRightCollapsed ? 0 : controlledLeftCollapsed ? 100 : (1 - splitRatio) * 100;

  // Get collapse icon based on direction and state
  const getCollapseIcon = (isLeft: boolean, isCollapsed: boolean) => {
    if (direction === 'horizontal') {
      if (isLeft) {
        return isCollapsed ? Icons.chevronRight : Icons.chevronLeft;
      }
      return isCollapsed ? Icons.chevronLeft : Icons.chevronRight;
    } else {
      if (isLeft) {
        return isCollapsed ? Icons.chevronDown : Icons.chevronUp;
      }
      return isCollapsed ? Icons.chevronUp : Icons.chevronDown;
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        styles.tradeLayout,
        direction === 'horizontal' ? styles.horizontal : styles.vertical,
        className
      )}
      style={{
        '--ot-trade-resizer-size': `${resizerSize}px`,
      } as React.CSSProperties}
      data-testid={testId}
    >
      {/* Left Panel */}
      <div
        className={clsx(
          styles.panel,
          styles.leftPanel,
          controlledLeftCollapsed && styles.panelCollapsed,
          controlledLeftFullscreen && styles.panelFullscreen
        )}
        style={{
          flexBasis: `${leftSize}%`,
        }}
      >
        {/* Panel Header */}
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>{leftLabel}</span>
          <div className={styles.panelControls}>
            {/* Collapse button */}
            <button
              className={styles.panelButton}
              onClick={handleLeftCollapse}
              aria-label={controlledLeftCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {getCollapseIcon(true, controlledLeftCollapsed)}
            </button>

            {/* Fullscreen button */}
            {showFullscreenToggle && (
              <button
                className={clsx(styles.panelButton, controlledLeftFullscreen && styles.panelButtonActive)}
                onClick={handleLeftFullscreen}
                aria-label={controlledLeftFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {controlledLeftFullscreen ? Icons.exitFullscreen : Icons.fullscreen}
              </button>
            )}
          </div>
        </div>

        {/* Panel Content */}
        <div className={styles.panelContent}>
          {leftContent}
        </div>
      </div>

      {/* Resizer */}
      {!controlledLeftCollapsed && !controlledRightCollapsed && (
        <div
          className={clsx(
            styles.resizer,
            direction === 'horizontal' ? styles.resizerHorizontal : styles.resizerVertical,
            isResizing && styles.resizerActive
          )}
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          role="separator"
          aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
          aria-label="Resize panels"
          tabIndex={0}
        >
          <div className={styles.resizerHitArea} />
        </div>
      )}

      {/* Right Panel */}
      <div
        className={clsx(
          styles.panel,
          styles.rightPanel,
          controlledRightCollapsed && styles.panelCollapsed,
          controlledRightFullscreen && styles.panelFullscreen
        )}
        style={{
          flexBasis: `${rightSize}%`,
        }}
      >
        {/* Panel Header */}
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>{rightLabel}</span>
          <div className={styles.panelControls}>
            {/* Fullscreen button */}
            {showFullscreenToggle && (
              <button
                className={clsx(styles.panelButton, controlledRightFullscreen && styles.panelButtonActive)}
                onClick={handleRightFullscreen}
                aria-label={controlledRightFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {controlledRightFullscreen ? Icons.exitFullscreen : Icons.fullscreen}
              </button>
            )}

            {/* Collapse button */}
            <button
              className={styles.panelButton}
              onClick={handleRightCollapse}
              aria-label={controlledRightCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {getCollapseIcon(false, controlledRightCollapsed)}
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className={styles.panelContent}>
          {rightContent}
        </div>
      </div>

      {/* Collapsed toggle buttons */}
      {controlledLeftCollapsed && (
        <button
          className={clsx(styles.collapsedToggle, styles.collapsedToggleLeft)}
          onClick={handleLeftCollapse}
          aria-label="Expand left panel"
        >
          {direction === 'horizontal' ? Icons.chevronRight : Icons.chevronDown}
        </button>
      )}

      {controlledRightCollapsed && (
        <button
          className={clsx(styles.collapsedToggle, styles.collapsedToggleRight)}
          onClick={handleRightCollapse}
          aria-label="Expand right panel"
        >
          {direction === 'horizontal' ? Icons.chevronLeft : Icons.chevronUp}
        </button>
      )}
    </div>
  );
};

TradeLayout.displayName = 'TradeLayout';

export default TradeLayout;
