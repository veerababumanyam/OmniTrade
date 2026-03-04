/**
 * Atoms - Atomic UI Components
 * Liquid Glass Design System - OmniTrade
 *
 * This module exports all atomic (primitive) components following
 * the Atomic Design methodology. These are the smallest functional
 * UI units that cannot be broken down further.
 *
 * @see https://atomicdesign.bradfrost.com/chapter-2/#atoms
 */

// Button Component
export { Button, default as ButtonDefault } from './Button';
export type { ButtonProps } from './Button';

// Input Component
export { Input, default as InputDefault } from './Input';
export type { InputProps } from './Input';

// Select Component
export { Select, default as SelectDefault } from './Select';
export type { SelectProps, SelectOption } from './Select';

// Checkbox Component
export { Checkbox, default as CheckboxDefault } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

// Toggle Component
export { Toggle, default as ToggleDefault } from './Toggle';
export type { ToggleProps } from './Toggle';

// Badge Component
export { Badge, default as BadgeDefault } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

// Avatar Component
export { Avatar, default as AvatarDefault } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';

// Icon Component
export { Icon, default as IconDefault } from './Icon';
export type { IconProps, IconSize } from './Icon';

// Tooltip Component
export { Tooltip, default as TooltipDefault } from './Tooltip';
export type { TooltipProps, TooltipPosition } from './Tooltip';

// Spinner Component (New)
export { Spinner, default as SpinnerDefault } from './Spinner';
export type { SpinnerProps, SpinnerSize, SpinnerVariant } from './Spinner';

// Divider Component (New)
export { Divider, default as DividerDefault } from './Divider';
export type { DividerProps, DividerOrientation, DividerSpacing } from './Divider';

// Skeleton Component (New)
export { Skeleton, default as SkeletonDefault } from './Skeleton';
export type { SkeletonProps, SkeletonVariant, SkeletonAnimation } from './Skeleton';

// Chip Component (New)
export { Chip, default as ChipDefault } from './Chip';
export type { ChipProps, ChipSize, ChipVariant } from './Chip';

// SkipToContent Component (Accessibility)
export { SkipToContent, default as SkipToContentDefault } from './SkipToContent';
export type { SkipToContentProps, SkipTarget } from './SkipToContent';
