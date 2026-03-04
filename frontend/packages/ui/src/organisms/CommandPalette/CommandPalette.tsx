/**
 * CommandPalette Component
 * Liquid Glass Design System
 * Macro-Volume Organism - Z-axis: translateZ(48px)
 *
 * Features:
 * - Command palette (Ctrl+K style)
 * - Search/filter commands
 * - Keyboard navigation
 * - Recent commands
 * - Category grouping
 * - Command shortcuts display
 * - Signal bus integration
 * - AI-readable: true
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  createPortal,
} from 'react-dom';
import { cn } from '../../utils/cn';
import { signalBus } from '../../signal-bus';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import type {
  CommandPaletteProps,
  CommandPaletteContainerProps,
  Command,
  CommandCategory,
  CommandPaletteOpenSignal,
  CommandPaletteSelectSignal,
  CommandPaletteExecuteSignal,
  CommandPaletteCloseSignal,
} from './types';
import {
  DEFAULT_MAX_VISIBLE,
  DEFAULT_RECENT_COMMAND_LIMIT,
  DEFAULT_SHORTCUT,
  COMMAND_PALETTE_ANIMATION,
} from './types';
import styles from './styles.module.css';

// ============================================================================
// Icons
// ============================================================================

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="11" y1="8" x2="11" y2="14" />
  </svg>
);

const CommandIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="14" height="14" rx="2" ry="2" />
    <line x1="7" y1="7" x2="7" y2="13" />
  </svg>
);

const RecentIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2" fill="currentColor" />
  </svg>
);

const CategoryIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="2" width="12" height="2" rx="2" />
    <rect x="2" y="6" width="12" height="2" />
    <rect x="2" y="10" width="12" height="2" />
  </svg>
);

// ============================================================================
// CommandPalette Component
// ============================================================================

export function CommandPalette({
  commands,
  categories = [],
  recentCommands = [],
  maxRecent = DEFAULT_RECENT_COMMAND_LIMIT,
  placeholder = 'Search commands...',
  emptyMessage = 'No commands found',
  className,
  testId,
  'data-ai-readable': aiReadable = true,
  onOpen,
  onClose,
  onCommandSelect,
  onCommandExecute,
}: CommandPaletteProps): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommandsList, setRecentCommandsList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('commandPalette_recentCommands');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return commands;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return commands.filter((cmd) => {
      const nameMatch = cmd.name.toLowerCase().includes(lowerQuery);
      const descMatch = cmd.description?.toLowerCase().includes(lowerQuery);
      const categoryMatch = cmd.category?.toLowerCase().includes(lowerQuery);
      return nameMatch || descMatch || categoryMatch;
    });
  }, [commands, searchQuery]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    const categoryOrder = ['navigation', 'trading', 'settings', 'tools', 'help'];

    // Add categories in order
    categories.forEach((category) => {
      groups[category] = [];
    });

    // Group filtered commands
    filteredCommands.forEach((cmd) => {
      const category = cmd.category || 'tools';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
    });

    // Sort by category order
    return categoryOrder
      .filter((cat) => groups[cat] && groups[cat].length > 0)
      .map((category) => ({
        category,
        commands: groups[category],
      }));
  }, [filteredCommands, categories]);

  // Get all visible commands for navigation
  const allVisibleCommands = useMemo(() => {
    return groupedCommands.flatMap((group) => group.commands);
  }, [groupedCommands]);

  // Open/close handlers
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setSearchQuery('');
    setSelectedIndex(0);

    // Emit open signal
    const openSignal: CommandPaletteOpenSignal = {
      timestamp: Date.now(),
    };
    signalBus.publish('ui:command-palette:open', openSignal, { source: 'CommandPalette' });

    // Focus search input after animation
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');

    // Emit close signal
    const closeSignal: CommandPaletteCloseSignal = {
      timestamp: Date.now(),
    };
    signalBus.publish('ui:command-palette:close', closeSignal, { source: 'CommandPalette' });

    // Call onClose callback
    onClose?.();
  }, [onClose]);

  // Command selection
  const handleCommandSelect = useCallback((command: Command) => {
    // Add to recent commands
    setRecentCommandsList((prev) => {
      const newRecents = [command.id, ...prev.filter((id) => id !== command.id)].slice(0, maxRecent)];
      localStorage.setItem('commandPalette_recentCommands', JSON.stringify(newRecents));
      return newRecents;
    });

    // Emit select signal
    const selectSignal: CommandPaletteSelectSignal = {
      commandId: command.id,
      commandName: command.name,
      category: command.category,
      timestamp: Date.now(),
    };
    signalBus.publish('ui:command-palette:select', selectSignal, { source: 'CommandPalette' });

    // Call onCommandSelect callback
    onCommandSelect?.(command);

    // Execute command
    if (command.action) {
      command.action();

      // Emit execute signal
      const executeSignal: CommandPaletteExecuteSignal = {
        commandId: command.id,
        commandName: command.name,
        timestamp: Date.now(),
      };
      signalBus.publish('ui:command-palette:execute', executeSignal, { source: 'CommandPalette' });
    }

    // Close palette
    handleClose();
  }, [maxRecent, onCommandSelect, handleClose]);

  // Search input handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(0);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allVisibleCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : allVisibleCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedCommand = allVisibleCommands[selectedIndex];
        if (selectedCommand) {
          handleCommandSelect(selectedCommand);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    },
    [allVisibleCommands, selectedIndex, handleCommandSelect, handleClose]
  );

  // Global keyboard shortcut (Ctrl+K)
  useKeyboardShortcut(
    ['k'],
    () => {
      if (isOpen) {
        handleClose();
      } else {
        handleOpen();
      }
    },
    { ctrl: true, enabled: true }
  );

  // Focus selected item
  useEffect(() => {
    if (isOpen && commandListRef.current) {
      const selectedElement = commandListRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isOpen, selectedIndex]);

  // Handle open callback
  useEffect(() => {
    if (onOpen) {
      onOpen();
    }
  }, [onOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className={cn(styles.overlay, isOpen && styles.overlayVisible)}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        className={cn(styles.palette, isOpen && styles.paletteVisible, className)}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        data-testid={testId}
        data-ai-readable={aiReadable}
        onKeyDown={handleKeyDown}
      >
        {/* Search */}
        <div className={styles.search}>
          <SearchIcon />
          <input
            ref={searchInput}
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search commands"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {/* Commands List */}
        <div className={styles.commandList} ref={commandListRef}>
          {filteredCommands.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>{emptyMessage}</p>
            </div>
          ) : (
            <>
              {/* Recent Commands */}
              {!searchQuery && recentCommandsList.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <RecentIcon />
                    <span className={styles.sectionTitle}>Recent</span>
                  </div>
                  {commands
                    .filter((cmd) => recentCommandsList.includes(cmd.id))
                    .slice(0, maxRecent)
                    .map((command, idx) => (
                      <CommandItem
                        key={command.id}
                        command={command}
                        index={idx}
                        isSelected={false}
                        onSelect={handleCommandSelect}
                      />
                    ))}
                </div>
              )}

              {/* Grouped Commands */}
              {groupedCommands.map((group) => (
                <div key={group.category} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <CategoryIcon />
                    <span className={styles.sectionTitle}>
                      {group.category.charAt(0).toUpperCase() + group.category.slice(1)}
                    </span>
                  </div>
                  {group.commands.map((command, idx) => {
                    const globalIndex = allVisibleCommands.findIndex(
                      (c) => c.id === command.id
                    );
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <CommandItem
                        key={command.id}
                        command={command}
                        index={globalIndex}
                        isSelected={isSelected}
                        onSelect={handleCommandSelect}
                      />
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.footerHint}>
            <span className={styles.footerKey}>Enter</span> to select
          </span>
          <span className={styles.footerHint}>
            <span className={styles.footerKey}>Esc</span> to close
          </span>
          <span className={styles.footerHint}>
            <span className={styles.footerKey}>Up/Down</span> to navigate
          </span>
        </div>
      </div>
    </>,
    document.body
  );
}

// ============================================================================
// CommandItem Component
// ============================================================================

interface CommandItemProps {
  command: Command;
  index: number;
  isSelected: boolean;
  onSelect: (command: Command) => void;
}

function CommandItem({ command, index, isSelected, onSelect }: CommandItemProps) {
  return (
    <div
      className={cn(styles.commandItem, isSelected && styles.commandItemSelected)}
      data-index={index}
      onClick={() => onSelect(command)}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
    >
      <div className={styles.commandIcon}>{command.icon || <CommandIcon />}</div>
      <div className={styles.commandContent}>
        <div className={styles.commandName}>{command.name}</div>
        {command.description && (
          <div className={styles.commandDescription}>{command.description}</div>
        )}
      </div>
      {command.shortcut && (
        <div className={styles.commandShortcut}>
          {formatShortcut(command.shortcut)}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatShortcut(shortcut: string): string {
  const parts = shortcut.split('+');
  return parts
    .map((part) => {
      if (part === 'Ctrl' || part === 'Cmd') {
        return '\u2318';
      }
      if (part === 'Shift') {
        return '\u21E7';
      }
      if (part === 'Alt') {
        return '\u2325';
      }
      return part;
    })
    .join(' + ');
}

// ============================================================================
// CommandPaletteContainer Component (for external control)
// ============================================================================

export function CommandPaletteContainer({
  isOpen,
  onOpen,
  onClose,
  children,
}: CommandPaletteContainerProps): React.ReactElement {
 null {
  // This is a wrapper component for scenarios where you want to control
  // the command palette from a parent component
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

CommandPalette.displayName = 'CommandPalette';
CommandPaletteContainer.displayName = 'CommandPaletteContainer';

export default CommandPalette;
export { CommandPaletteContainer };
