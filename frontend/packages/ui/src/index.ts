/**
 * OmniTrade UI Component Library
 * Liquid Glass Design System
 *
 * Main entry point for the @omnitrade/ui package
 */

// ============================================================================
// Design Tokens
// ============================================================================

export * from './tokens';

// ============================================================================
// Layout Primitives
// ============================================================================

export * from './primitives';

// ============================================================================
// Atoms
// ============================================================================

export * from './atoms';

// ============================================================================
// Molecules
// ============================================================================

export * from './molecules';

// ============================================================================
// Organisms
// ============================================================================

export * from './organisms';

// ============================================================================
// Templates
// ============================================================================

export * from './templates';

// ============================================================================
// Signal Bus
// ============================================================================

export {
  signalBus,
  SignalBus,
  createSignalBus,
  useSignal,
  type SignalTopic,
  type SignalPayload,
  type SignalHandler,
  type SignalEvent,
  type SignalBusConfig,
  type SignalBusStats,
  type SignalMetadata,
  type PublishOptions,
  type SignalSubscription,
} from './signal-bus';

// ============================================================================
// Component Registry
// ============================================================================

export {
  Registry,
  createRegistry,
  type ComponentMeta,
  type ComponentCategory,
  type ComponentQuery,
  type ComponentQueryResult,
  type ComponentRegistrationOptions,
  type RegistryStats,
  type ComponentAssemblyContext,
  type ComponentAssemblyResult,
  type ComponentTreeNode,
} from './registry';

// ============================================================================
// Hooks
// ============================================================================

export * from './hooks';

// ============================================================================
// Utilities
// ============================================================================

export * from './utils';

// ============================================================================
// Animation System
// ============================================================================

export * from './animations';
