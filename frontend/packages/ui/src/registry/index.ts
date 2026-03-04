/**
 * Component Registry for OmniTrade GenUI
 *
 * AI-readable component registry for dynamic component discovery and assembly.
 * Supports atomic design hierarchy, signal integration, and AI-driven composition.
 *
 * @example
 * ```typescript
 * // Register a component
 * Registry.registerComponent('TradeCard', {
 *   category: 'organism',
 *   variants: ['default', 'compact', 'detailed'],
 *   signals: ['trade:proposal:select', 'trade:proposal:approve'],
 *   aiReadable: true,
 *   description: 'Displays trade proposal with approval controls'
 * });
 *
 * // Query for components
 * const results = Registry.queryComponents({
 *   category: 'organism',
 *   signals: ['trade:proposal:approve'],
 *   aiReadable: true
 * });
 *
 * // Get component metadata
 * const meta = Registry.getComponentMeta('TradeCard');
 * ```
 */

import type {
  ComponentMeta,
  ComponentCategory,
  ComponentQuery,
  ComponentQueryResult,
  ComponentRegistrationOptions,
  RegistryStats,
  ComponentAssemblyContext,
  ComponentAssemblyResult,
  ComponentTreeNode,
} from './types';

export type {
  ComponentMeta,
  ComponentCategory,
  ComponentQuery,
  ComponentQueryResult,
  ComponentRegistrationOptions,
  RegistryStats,
  ComponentAssemblyContext,
  ComponentAssemblyResult,
  ComponentTreeNode,
};

/**
 * Internal registry storage.
 */
interface RegistryStore {
  components: Map<string, ComponentMeta>;
  signalIndex: Map<string, Set<string>>; // signal -> component names
  tagIndex: Map<string, Set<string>>; // tag -> component names
  categoryIndex: Map<ComponentCategory, Set<string>>; // category -> component names
}

/**
 * Create an empty registry store.
 */
function createStore(): RegistryStore {
  return {
    components: new Map(),
    signalIndex: new Map(),
    tagIndex: new Map(),
    categoryIndex: new Map(),
  };
}

/**
 * Component Registry implementation.
 */
class ComponentRegistryImpl {
  private readonly store: RegistryStore;
  private readonly assemblyHandlers: Map<string, (context: ComponentAssemblyContext) => ComponentAssemblyResult>;

  constructor() {
    this.store = createStore();
    this.assemblyHandlers = new Map();

    // Initialize category index with empty sets
    const categories: ComponentCategory[] = ['atom', 'molecule', 'organism', 'template'];
    categories.forEach((cat) => this.store.categoryIndex.set(cat, new Set()));
  }

  /**
   * Register a component in the registry.
   *
   * @param name - Unique component name
   * @param meta - Component metadata
   * @param options - Registration options
   * @returns The registered metadata
   *
   * @example
   * ```typescript
   * Registry.registerComponent('Button', {
   *   category: 'atom',
   *   variants: ['primary', 'secondary', 'ghost', 'danger'],
   *   slots: ['icon', 'label'],
   *   signals: ['ui:button:click'],
   *   aiReadable: true,
   *   defaultVariant: 'primary',
   *   dependencies: [],
   *   description: 'Interactive button component for user actions'
   * });
   * ```
   */
  registerComponent(
    name: string,
    meta: Omit<ComponentMeta, 'name'>,
    options: ComponentRegistrationOptions = {}
  ): ComponentMeta {
    // Check for existing registration
    const existing = this.store.components.get(name);
    if (existing && !options.allowOverwrite) {
      console.warn(
        `[Registry] Component "${name}" is already registered. Use { allowOverwrite: true } to replace.`
      );
      return existing;
    }

    // Build complete metadata
    const fullMeta: ComponentMeta = {
      name,
      category: meta.category,
      variants: meta.variants ?? ['default'],
      slots: meta.slots ?? [],
      signals: meta.signals ?? [],
      aiReadable: meta.aiReadable ?? true,
      defaultVariant: meta.defaultVariant ?? meta.variants?.[0] ?? 'default',
      dependencies: meta.dependencies ?? [],
      description: meta.description ?? '',
      tags: meta.tags ?? [],
      propsSchema: meta.propsSchema,
      examples: meta.examples,
      version: options.version ?? meta.version ?? '1.0.0',
      deprecated: options.deprecated ?? meta.deprecated ?? false,
      replacement: options.replacement ?? meta.replacement,
    };

    // Remove old indexes if overwriting
    if (existing) {
      this.removeFromIndexes(existing);
    }

    // Store component
    this.store.components.set(name, fullMeta);

    // Update indexes
    this.addToIndexes(fullMeta);

    return fullMeta;
  }

  /**
   * Remove a component from indexes (internal).
   */
  private removeFromIndexes(meta: ComponentMeta): void {
    // Remove from category index
    this.store.categoryIndex.get(meta.category)?.delete(meta.name);

    // Remove from signal index
    for (const signal of meta.signals) {
      this.store.signalIndex.get(signal)?.delete(meta.name);
    }

    // Remove from tag index
    for (const tag of meta.tags ?? []) {
      this.store.tagIndex.get(tag)?.delete(meta.name);
    }
  }

  /**
   * Add a component to indexes (internal).
   */
  private addToIndexes(meta: ComponentMeta): void {
    // Add to category index
    const categorySet = this.store.categoryIndex.get(meta.category);
    if (categorySet) {
      categorySet.add(meta.name);
    }

    // Add to signal index
    for (const signal of meta.signals) {
      if (!this.store.signalIndex.has(signal)) {
        this.store.signalIndex.set(signal, new Set());
      }
      this.store.signalIndex.get(signal)!.add(meta.name);
    }

    // Add to tag index
    for (const tag of meta.tags ?? []) {
      if (!this.store.tagIndex.has(tag)) {
        this.store.tagIndex.set(tag, new Set());
      }
      this.store.tagIndex.get(tag)!.add(meta.name);
    }
  }

  /**
   * Unregister a component from the registry.
   *
   * @param name - Component name to unregister
   * @returns true if component was removed, false if not found
   */
  unregisterComponent(name: string): boolean {
    const meta = this.store.components.get(name);
    if (!meta) return false;

    this.removeFromIndexes(meta);
    this.store.components.delete(name);
    return true;
  }

  /**
   * Get metadata for a specific component.
   *
   * @param name - Component name
   * @returns Component metadata or undefined if not found
   */
  getComponentMeta(name: string): ComponentMeta | undefined {
    return this.store.components.get(name);
  }

  /**
   * Check if a component is registered.
   *
   * @param name - Component name
   * @returns true if component exists
   */
  hasComponent(name: string): boolean {
    return this.store.components.has(name);
  }

  /**
   * Query components based on filter criteria.
   *
   * @param query - Query parameters
   * @returns Query result with matching components
   *
   * @example
   * ```typescript
   * // Find all AI-readable organisms that emit trade signals
   * const result = Registry.queryComponents({
   *   category: 'organism',
   *   aiReadable: true,
   *   signals: ['trade:*'],
   *   limit: 10
   * });
   *
   * console.log(`Found ${result.totalCount} components`);
   * result.components.forEach(comp => console.log(comp.name));
   * ```
   */
  queryComponents(query: ComponentQuery): ComponentQueryResult {
    let candidates = new Set<string>(this.store.components.keys());

    // Filter by category
    if (query.category) {
      const categories = Array.isArray(query.category) ? query.category : [query.category];
      const categoryMatches = new Set<string>();
      for (const cat of categories) {
        const catComponents = this.store.categoryIndex.get(cat);
        if (catComponents) {
          catComponents.forEach((name) => categoryMatches.add(name));
        }
      }
      candidates = this.intersectSets(candidates, categoryMatches);
    }

    // Filter by signals
    if (query.signals && query.signals.length > 0) {
      for (const signal of query.signals) {
        const signalComponents = this.findComponentsBySignalPattern(signal);
        candidates = this.intersectSets(candidates, signalComponents);
      }
    }

    // Filter by AI readability
    if (query.aiReadable !== undefined) {
      candidates = new Set(
        Array.from(candidates).filter((name) => {
          const meta = this.store.components.get(name);
          return meta?.aiReadable === query.aiReadable;
        })
      );
    }

    // Filter by name
    if (query.name) {
      candidates = new Set(
        Array.from(candidates).filter((name) => {
          if (query.name instanceof RegExp) {
            return query.name.test(name);
          }
          return name === query.name;
        })
      );
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        const tagComponents = this.store.tagIndex.get(tag);
        if (tagComponents) {
          candidates = this.intersectSets(candidates, tagComponents);
        }
      }
    }

    // Filter by dependencies
    if (query.hasDependencies && query.hasDependencies.length > 0) {
      candidates = new Set(
        Array.from(candidates).filter((name) => {
          const meta = this.store.components.get(name);
          return query.hasDependencies!.every((dep) => meta?.dependencies.includes(dep));
        })
      );
    }

    // Filter by variant
    if (query.hasVariant) {
      candidates = new Set(
        Array.from(candidates).filter((name) => {
          const meta = this.store.components.get(name);
          return meta?.variants.includes(query.hasVariant!);
        })
      );
    }

    // Filter by slot
    if (query.hasSlot) {
      candidates = new Set(
        Array.from(candidates).filter((name) => {
          const meta = this.store.components.get(name);
          return meta?.slots.includes(query.hasSlot!);
        })
      );
    }

    // Filter deprecated
    if (!query.includeDeprecated) {
      candidates = new Set(
        Array.from(candidates).filter((name) => {
          const meta = this.store.components.get(name);
          return !meta?.deprecated;
        })
      );
    }

    // Get total count before pagination
    const totalCount = candidates.size;

    // Apply pagination
    const offset = query.offset ?? 0;
    const limit = query.limit ?? totalCount;
    const names = Array.from(candidates).slice(offset, offset + limit);

    // Build result
    const components = names
      .map((name) => this.store.components.get(name)!)
      .filter(Boolean);

    return {
      components,
      totalCount,
      hasMore: offset + limit < totalCount,
      query,
    };
  }

  /**
   * Find components by signal pattern (supports wildcards).
   */
  private findComponentsBySignalPattern(pattern: string): Set<string> {
    const result = new Set<string>();

    // Exact match
    if (this.store.signalIndex.has(pattern)) {
      this.store.signalIndex.get(pattern)!.forEach((name) => result.add(name));
    }

    // Wildcard pattern
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
      );

      for (const [signal, components] of this.store.signalIndex) {
        if (regex.test(signal)) {
          components.forEach((name) => result.add(name));
        }
      }
    }

    return result;
  }

  /**
   * Intersect two sets.
   */
  private intersectSets<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set(Array.from(a).filter((item) => b.has(item)));
  }

  /**
   * Get all registered component names.
   */
  getAllComponentNames(): string[] {
    return Array.from(this.store.components.keys());
  }

  /**
   * Get all registered components.
   */
  getAllComponents(): ComponentMeta[] {
    return Array.from(this.store.components.values());
  }

  /**
   * Get registry statistics.
   */
  getStats(): RegistryStats {
    const byCategory: Record<ComponentCategory, number> = {
      atom: 0,
      molecule: 0,
      organism: 0,
      template: 0,
    };

    let aiReadableCount = 0;
    let deprecatedCount = 0;
    const allSignals = new Set<string>();
    const allTags = new Set<string>();

    for (const meta of this.store.components.values()) {
      byCategory[meta.category]++;
      if (meta.aiReadable) aiReadableCount++;
      if (meta.deprecated) deprecatedCount++;
      meta.signals.forEach((s) => allSignals.add(s));
      (meta.tags ?? []).forEach((t) => allTags.add(t));
    }

    return {
      totalComponents: this.store.components.size,
      byCategory,
      aiReadableCount,
      deprecatedCount,
      allSignals: Array.from(allSignals),
      allTags: Array.from(allTags),
    };
  }

  /**
   * Register an assembly handler for a specific intent.
   *
   * @param intent - The intent name to handle
   * @param handler - Function that returns component assembly for the intent
   */
  registerAssemblyHandler(
    intent: string,
    handler: (context: ComponentAssemblyContext) => ComponentAssemblyResult
  ): void {
    this.assemblyHandlers.set(intent, handler);
  }

  /**
   * Assemble components based on intent and context.
   *
   * @param context - Assembly context with intent and data
   * @returns Assembly result with component tree
   */
  assembleComponents(context: ComponentAssemblyContext): ComponentAssemblyResult {
    // Check for registered handler
    const handler = this.assemblyHandlers.get(context.intent);
    if (handler) {
      return handler(context);
    }

    // Default assembly logic - find relevant components
    const relevantComponents = this.queryComponents({
      aiReadable: true,
      includeDeprecated: false,
      limit: 10,
    });

    // Build a simple tree from the most relevant component
    if (relevantComponents.components.length > 0) {
      const primary = relevantComponents.components[0];
      return {
        tree: {
          component: primary.name,
          props: context.data,
        },
        confidence: 0.5,
        reasoning: `No specific handler for intent "${context.intent}". Using ${primary.name} as the primary component.`,
        emittedSignals: primary.signals,
        listenedSignals: [],
      };
    }

    return {
      tree: {
        component: 'div',
        props: context.data,
      },
      confidence: 0.1,
      reasoning: `No components found for intent "${context.intent}". Returning fallback div element.`,
      emittedSignals: [],
      listenedSignals: [],
    };
  }

  /**
   * Clear the entire registry (useful for testing).
   */
  clear(): void {
    this.store.components.clear();
    this.store.signalIndex.clear();
    this.store.tagIndex.clear();

    // Reinitialize category index
    const categories: ComponentCategory[] = ['atom', 'molecule', 'organism', 'template'];
    this.store.categoryIndex.clear();
    categories.forEach((cat) => this.store.categoryIndex.set(cat, new Set()));

    this.assemblyHandlers.clear();
  }
}

// Singleton instance
const registryInstance = new ComponentRegistryImpl();

/**
 * Registry - Singleton instance for component registration and discovery.
 *
 * Exported as a namespace with all methods bound to the singleton.
 */
export const Registry = {
  /**
   * Register a component in the registry.
   */
  registerComponent: registryInstance.registerComponent.bind(registryInstance),

  /**
   * Unregister a component from the registry.
   */
  unregisterComponent: registryInstance.unregisterComponent.bind(registryInstance),

  /**
   * Get metadata for a specific component.
   */
  getComponentMeta: registryInstance.getComponentMeta.bind(registryInstance),

  /**
   * Check if a component is registered.
   */
  hasComponent: registryInstance.hasComponent.bind(registryInstance),

  /**
   * Query components based on filter criteria.
   */
  queryComponents: registryInstance.queryComponents.bind(registryInstance),

  /**
   * Get all registered component names.
   */
  getAllComponentNames: registryInstance.getAllComponentNames.bind(registryInstance),

  /**
   * Get all registered components.
   */
  getAllComponents: registryInstance.getAllComponents.bind(registryInstance),

  /**
   * Get registry statistics.
   */
  getStats: registryInstance.getStats.bind(registryInstance),

  /**
   * Register an assembly handler for a specific intent.
   */
  registerAssemblyHandler: registryInstance.registerAssemblyHandler.bind(registryInstance),

  /**
   * Assemble components based on intent and context.
   */
  assembleComponents: registryInstance.assembleComponents.bind(registryInstance),

  /**
   * Clear the entire registry.
   */
  clear: registryInstance.clear.bind(registryInstance),
} as const;

/**
 * Create a new Registry instance.
 * Useful for testing or isolated contexts.
 */
export function createRegistry(): typeof Registry {
  const instance = new ComponentRegistryImpl();
  return {
    registerComponent: instance.registerComponent.bind(instance),
    unregisterComponent: instance.unregisterComponent.bind(instance),
    getComponentMeta: instance.getComponentMeta.bind(instance),
    hasComponent: instance.hasComponent.bind(instance),
    queryComponents: instance.queryComponents.bind(instance),
    getAllComponentNames: instance.getAllComponentNames.bind(instance),
    getAllComponents: instance.getAllComponents.bind(instance),
    getStats: instance.getStats.bind(instance),
    registerAssemblyHandler: instance.registerAssemblyHandler.bind(instance),
    assembleComponents: instance.assembleComponents.bind(instance),
    clear: instance.clear.bind(instance),
  };
}

export default Registry;

// Extend registration options to include allowOverwrite
declare module './types' {
  interface ComponentRegistrationOptions {
    /** Allow overwriting an existing component registration */
    allowOverwrite?: boolean;
  }
}
