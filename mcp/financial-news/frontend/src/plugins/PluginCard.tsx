/**
 * PluginCard Component
 * Reusable card component for displaying plugin information
 * with Liquid Glass design system styling
 */

import React from 'react';
import type { Plugin, PluginStatus } from './types';
import './styles/liquid-glass.css';

// Icon mapping for categories
const categoryIcons: Record<string, string> = {
  'data-source': '📊',
  'analysis': '📈',
  'execution': '⚡',
  'notification': '🔔',
  'integration': '🔗',
  'utility': '🔧',
};

// Status color mapping
const statusColors: Record<PluginStatus, string> = {
  installed: 'glass-badge-success',
  available: 'glass-badge-info',
  updating: 'glass-badge-warning',
  error: 'glass-badge-error',
  disabled: 'glass-badge',
};

// Status labels
const statusLabels: Record<PluginStatus, string> = {
  installed: 'Installed',
  available: 'Available',
  updating: 'Updating...',
  error: 'Error',
  disabled: 'Disabled',
};

// Health status indicators
const healthIndicators: Record<string, { color: string; label: string }> = {
  healthy: { color: 'var(--glass-success)', label: 'Healthy' },
  degraded: { color: 'var(--glass-warning)', label: 'Degraded' },
  unhealthy: { color: 'var(--glass-error)', label: 'Unhealthy' },
};

interface PluginCardProps {
  plugin: Plugin;
  onToggle?: (pluginId: string) => void;
  onInstall?: (pluginId: string) => void;
  onUninstall?: (pluginId: string) => void;
  onUpdate?: (pluginId: string) => void;
  onConfigure?: (pluginId: string) => void;
  onClick?: (pluginId: string) => void;
  selected?: boolean;
  compact?: boolean;
  loading?: boolean;
}

export const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  onToggle,
  onInstall,
  onUninstall,
  onUpdate,
  onConfigure,
  onClick,
  selected = false,
  compact = false,
  loading = false,
}) => {
  const handleCardClick = () => {
    onClick?.(plugin.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.(plugin.id);
  };

  const handleInstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInstall?.(plugin.id);
  };

  const handleUninstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUninstall?.(plugin.id);
  };

  const handleUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate?.(plugin.id);
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfigure?.(plugin.id);
  };

  const formatUptime = (uptime: number): string => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatMemory = (mb: number): string => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const cardClasses = [
    'glass-card',
    'plugin-card',
    selected ? 'glass-card-active' : '',
    compact ? 'plugin-card-compact' : '',
    loading ? 'plugin-card-loading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} onClick={handleCardClick} role="button" tabIndex={0}>
      {/* Header */}
      <div className="plugin-card-header">
        <div className="plugin-card-icon">
          <span className="plugin-icon-emoji">
            {categoryIcons[plugin.category] || '📦'}
          </span>
        </div>

        <div className="plugin-card-title-section">
          <h3 className="plugin-card-name">{plugin.name}</h3>
          <div className="plugin-card-meta">
            <span className="glass-text-sm">v{plugin.version}</span>
            <span className="plugin-card-dot">•</span>
            <span className="glass-text-sm">{plugin.author}</span>
          </div>
        </div>

        {plugin.status === 'installed' && onToggle && (
          <div className="plugin-card-toggle">
            <label className="glass-toggle">
              <input
                type="checkbox"
                className="glass-toggle-input"
                checked={plugin.enabled}
                onChange={() => {}}
                onClick={handleToggle}
                disabled={loading}
              />
              <span className="glass-toggle-slider"></span>
            </label>
          </div>
        )}
      </div>

      {/* Description */}
      {!compact && (
        <p className="plugin-card-description glass-text">{plugin.description}</p>
      )}

      {/* Status Badges */}
      <div className="plugin-card-badges">
        <span className={`glass-badge ${statusColors[plugin.status]}`}>
          {statusLabels[plugin.status]}
        </span>

        {plugin.category && (
          <span className="glass-badge">
            {plugin.category.replace('-', ' ')}
          </span>
        )}

        {plugin.status === 'installed' && plugin.health && (
          <span
            className="glass-badge"
            style={{
              borderColor: healthIndicators[plugin.health.status]?.color || 'inherit',
              color: healthIndicators[plugin.health.status]?.color || 'inherit',
            }}
          >
            <span
              className="plugin-health-dot"
              style={{
                backgroundColor: healthIndicators[plugin.health.status]?.color || 'inherit',
              }}
            />
            {healthIndicators[plugin.health.status]?.label || plugin.health.status}
          </span>
        )}
      </div>

      {/* Health Metrics (for installed plugins) */}
      {!compact && plugin.status === 'installed' && plugin.health && (
        <div className="plugin-card-metrics">
          <div className="plugin-metric">
            <span className="plugin-metric-label glass-text-sm">Uptime</span>
            <span className="plugin-metric-value">
              {formatUptime(plugin.health.uptime)}
            </span>
          </div>
          <div className="plugin-metric">
            <span className="plugin-metric-label glass-text-sm">Memory</span>
            <span className="plugin-metric-value">
              {formatMemory(plugin.health.metrics.memoryUsage)}
            </span>
          </div>
          <div className="plugin-metric">
            <span className="plugin-metric-label glass-text-sm">Requests</span>
            <span className="plugin-metric-value">
              {plugin.health.metrics.requestCount.toLocaleString()}
            </span>
          </div>
          <div className="plugin-metric">
            <span className="plugin-metric-label glass-text-sm">Avg Time</span>
            <span className="plugin-metric-value">
              {plugin.health.metrics.avgResponseTime}ms
            </span>
          </div>
        </div>
      )}

      {/* Tool & Hook Counts */}
      {!compact && (plugin.tools?.length || plugin.hooks?.length) && (
        <div className="plugin-card-counts">
          {plugin.tools && plugin.tools.length > 0 && (
            <span className="plugin-count-item">
              <span className="plugin-count-icon">🔧</span>
              <span className="plugin-count-value">{plugin.tools.length} tools</span>
            </span>
          )}
          {plugin.hooks && plugin.hooks.length > 0 && (
            <span className="plugin-count-item">
              <span className="plugin-count-icon">🪝</span>
              <span className="plugin-count-value">{plugin.hooks.length} hooks</span>
            </span>
          )}
        </div>
      )}

      {/* Dates */}
      {!compact && plugin.status === 'installed' && (
        <div className="plugin-card-dates glass-text-sm">
          {plugin.installedAt && (
            <span>Installed: {formatDate(plugin.installedAt)}</span>
          )}
          {plugin.lastUpdated && (
            <span>Updated: {formatDate(plugin.lastUpdated)}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="plugin-card-actions">
        {plugin.status === 'available' && onInstall && (
          <button
            className="glass-button glass-button-primary glass-button-sm"
            onClick={handleInstall}
            disabled={loading}
          >
            {loading ? 'Installing...' : 'Install'}
          </button>
        )}

        {plugin.status === 'installed' && (
          <>
            {onConfigure && (
              <button
                className="glass-button glass-button-sm"
                onClick={handleConfigure}
                disabled={loading}
              >
                Configure
              </button>
            )}

            {onUpdate && (
              <button
                className="glass-button glass-button-sm"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            )}

            {onUninstall && (
              <button
                className="glass-button glass-button-danger glass-button-sm"
                onClick={handleUninstall}
                disabled={loading}
              >
                Uninstall
              </button>
            )}
          </>
        )}

        {plugin.status === 'updating' && (
          <span className="plugin-updating glass-text">
            <span className="glass-animate-spin plugin-spin-icon">⟳</span>
            Updating...
          </span>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="plugin-card-loading-overlay">
          <div className="glass-animate-spin plugin-loading-spinner">⟳</div>
        </div>
      )}
    </div>
  );
};

export default PluginCard;
