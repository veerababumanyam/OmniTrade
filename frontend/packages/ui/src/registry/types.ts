/**
 * Component Registry Types for OmniTrade GenUI
 *
 * Type definitions for the AI-readable component registry.
 * Enables dynamic component discovery and assembly by AI agents.
 */

/**
 * Component categories following atomic design principles.
 */
export type ComponentCategory = 'atom' | 'molecule' | 'organism' | 'template';

/**
 * Metadata describing a registered component.
 * This information is used by AI agents for component discovery and assembly.
 */
export interface ComponentMeta {
  /** Unique component name (e.g., 'Button', 'TradeCard') */
  name: string;

  /** Component category in the atomic design hierarchy */
  category: ComponentCategory;

  /** Available style variants (e.g., ['primary', 'secondary', 'ghost']) */
  variants: string[];

  /** Named slots for content projection (e.g., ['icon', 'label', 'badge']) */
  slots: string[];

  /** Signal topics this component emits or listens to */
  signals: string[];

  /** Whether this component can be assembled by AI agents */
  aiReadable: boolean;

  /** Default variant to use when none is specified */
  defaultVariant: string;

  /** Names of other components this component depends on */
  dependencies: string[];

  /** Human-readable description for documentation and AI context */
  description: string;

  /** Optional tags for search and categorization */
  tags?: string[];

  /** Optional props schema for AI validation */
  propsSchema?: ComponentPropsSchema;

  /** Optional examples of component usage */
  examples?: ComponentExample[];

  /** Version of the component for compatibility tracking */
  version?: string;

  /** Whether this component is deprecated */
  deprecated?: boolean;

  /** Replacement component if deprecated */
  replacement?: string;
}

/**
 * Schema definition for component props (simplified JSON Schema).
 */
export interface ComponentPropsSchema {
  /** Schema properties by prop name */
  properties: Record<string, PropSchema>;
  /** Required prop names */
  required?: string[];
  /** Default values for props */
  defaults?: Record<string, unknown>;
}

/**
 * Schema for a single prop.
 */
export interface PropSchema {
  /** Prop type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'node' | 'element';
  /** Human-readable description */
  description?: string;
  /** Allowed values for enum-like props */
  enum?: string[];
  /** Default value */
  default?: unknown;
  /** Whether this prop is required */
  required?: boolean;
  /** Nested properties for object types */
  properties?: Record<string, PropSchema>;
  /** Item schema for array types */
  items?: PropSchema;
}

/**
 * Example usage of a component.
 */
export interface ComponentExample {
  /** Example name/title */
  name: string;
  /** Example description */
  description?: string;
  /** Props used in the example */
  props: Record<string, unknown>;
  /** Expected output or behavior description */
  expectedBehavior?: string;
}

/**
 * Query parameters for searching components.
 */
export interface ComponentQuery {
  /** Filter by category */
  category?: ComponentCategory | ComponentCategory[];

  /** Filter by signal topics (component must emit/listen to all specified) */
  signals?: string[];

  /** Filter by AI readability */
  aiReadable?: boolean;

  /** Filter by name (exact match or regex) */
  name?: string | RegExp;

  /** Filter by tags */
  tags?: string[];

  /** Filter by dependencies */
  hasDependencies?: string[];

  /** Filter by variant availability */
  hasVariant?: string;

  /** Filter by slot availability */
  hasSlot?: string;

  /** Include deprecated components */
  includeDeprecated?: boolean;

  /** Maximum number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Result of a component query.
 */
export interface ComponentQueryResult {
  /** Matching components */
  components: ComponentMeta[];

  /** Total count before pagination */
  totalCount: number;

  /** Whether there are more results available */
  hasMore: boolean;

  /** Query that was executed */
  query: ComponentQuery;
}

/**
 * Registration options for a component.
 */
export interface ComponentRegistrationOptions {
  /** Override auto-detected metadata */
  meta?: Partial<ComponentMeta>;

  /** Mark as deprecated during registration */
  deprecated?: boolean;

  /** Set replacement component */
  replacement?: string;

  /** Custom version number */
  version?: string;
}

/**
 * Registry statistics.
 */
export interface RegistryStats {
  /** Total registered components */
  totalComponents: number;

  /** Components by category */
  byCategory: Record<ComponentCategory, number>;

  /** AI-readable component count */
  aiReadableCount: number;

  /** Deprecated component count */
  deprecatedCount: number;

  /** All unique signals across components */
  allSignals: string[];

  /** All unique tags across components */
  allTags: string[];
}

/**
 * Component assembly context for AI-driven composition.
 */
export interface ComponentAssemblyContext {
  /** The intent or goal of the assembly */
  intent: string;

  /** Available data for the assembly */
  data: Record<string, unknown>;

  /** Constraints on the assembly */
  constraints?: {
    /** Maximum nesting depth */
    maxDepth?: number;
    /** Required signals to emit/listen */
    requiredSignals?: string[];
    /** Preferred categories */
    preferredCategories?: ComponentCategory[];
    /** Exclude specific components */
    excludeComponents?: string[];
  };

  /** User preferences */
  preferences?: {
    /** Preferred style variant */
    styleVariant?: string;
    /** Preferred theme mode */
    themeMode?: 'light' | 'dark';
    /** Accessibility requirements */
    accessibility?: 'wcag-a' | 'wcag-aa' | 'wcag-aaa';
  };
}

/**
 * Result of a component assembly request.
 */
export interface ComponentAssemblyResult {
  /** Assembled component tree structure */
  tree: ComponentTreeNode;

  /** Confidence score of the assembly (0-1) */
  confidence: number;

  /** Reasoning for the assembly choices */
  reasoning: string;

  /** Alternative assemblies if confidence is low */
  alternatives?: ComponentAssemblyResult[];

  /** Signals that will be emitted by this assembly */
  emittedSignals: string[];

  /** Signals that this assembly listens to */
  listenedSignals: string[];
}

/**
 * Node in a component tree structure.
 */
export interface ComponentTreeNode {
  /** Component name */
  component: string;

  /** Props to pass to the component */
  props: Record<string, unknown>;

  /** Children nodes */
  children?: ComponentTreeNode[];

  /** Slot assignments (slot name -> content) */
  slots?: Record<string, ComponentTreeNode | string>;
}
