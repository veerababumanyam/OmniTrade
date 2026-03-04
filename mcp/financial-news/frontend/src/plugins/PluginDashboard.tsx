/**
 * PluginDashboard Component
 * Main plugin management interface for OmniTrade
 * Features plugin catalog, installed plugins, and configuration
 */

import React, { useState, useCallback, useMemo } from 'react';
import { PluginCard } from './PluginCard';
import { usePluginManager, useDebounce, useKeyboardShortcut } from './hooks/usePluginManager';
import type { Plugin, PluginFilter, PluginCategory, PluginStatus } from './types';
import './styles/liquid-glass.css';

// Category options for filter
const categoryOptions: { value: PluginCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'data-source', label: 'Data Sources' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'execution', label: 'Execution' },
  { value: 'notification', label: 'Notifications' },
  { value: 'integration', label: 'Integrations' },
  { value: 'utility', label: 'Utilities' },
];

// Status options for filter
const statusOptions: { value: PluginStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'installed', label: 'Installed' },
  { value: 'available', label: 'Available' },
  { value: 'updating', label: 'Updating' },
  { value: 'error', label: 'Error' },
  { value: 'disabled', label: 'Disabled' },
];

// View modes
type ViewMode = 'grid' | 'list';

// Tab configuration
const tabs = [
  { id: 'catalog', label: 'Catalog', icon: '🏪' },
  { id: 'installed', label: 'Installed', icon: '✓' },
  { id: 'health', label: 'Health', icon: '💚' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

interface PluginDashboardProps {
  onPluginSelect?: (plugin: Plugin) => void;
  onPluginConfigure?: (plugin: Plugin) => void;
}

export const PluginDashboard: React.FC<PluginDashboardProps> = ({
  onPluginSelect,
  onPluginConfigure,
}) => {
  // State
  const [activeTab, setActiveTab] = useState('catalog');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Hooks
  const {
    plugins,
    filteredPlugins,
    installedPlugins,
    pluginCounts,
    filter,
    setFilter,
    loading,
    notification,
    clearNotification,
    togglePlugin,
    installPlugin,
    uninstallPlugin,
    updatePlugin,
  } = usePluginManager();

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update filter when search changes
  React.useEffect(() => {
    setFilter((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch, setFilter]);

  // Keyboard shortcuts
  useKeyboardShortcut('k', () => {
    const searchInput = document.getElementById('plugin-search');
    searchInput?.focus();
  }, { ctrl: true });

  // Handle plugin selection
  const handlePluginClick = useCallback(
    (plugin: Plugin) => {
      setSelectedPlugin(plugin);
      onPluginSelect?.(plugin);
    },
    [onPluginSelect]
  );

  // Handle plugin configure
  const handlePluginConfigure = useCallback(
    (pluginId: string) => {
      const plugin = plugins.find((p) => p.id === pluginId);
      if (plugin) {
        setShowConfigPanel(true);
        onPluginConfigure?.(plugin);
      }
    },
    [plugins, onPluginConfigure]
  );

  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setSelectedPlugin(null);
  }, []);

  // Handle category filter change
  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as PluginCategory | 'all';
      setFilter((prev) => ({ ...prev, category: value }));
    },
    [setFilter]
  );

  // Handle status filter change
  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as PluginStatus | 'all';
      setFilter((prev) => ({ ...prev, status: value }));
    },
    [setFilter]
  );

  // Display plugins based on active tab
  const displayPlugins = useMemo(() => {
    switch (activeTab) {
      case 'installed':
        return installedPlugins;
      case 'health':
        return plugins.filter((p) => p.health && p.health.status !== 'healthy');
      default:
        return filteredPlugins;
    }
  }, [activeTab, installedPlugins, filteredPlugins, plugins]);

  // Render stats bar
  const renderStatsBar = () => (
    <div className="plugin-dashboard-stats">
      <div className="plugin-stat-item">
        <span className="plugin-stat-icon">📦</span>
        <span className="plugin-stat-value">{pluginCounts.total}</span>
        <span className="plugin-stat-label glass-text-sm">Total</span>
      </div>
      <div className="plugin-stat-item">
        <span className="plugin-stat-icon">✓</span>
        <span className="plugin-stat-value">{pluginCounts.installed}</span>
        <span className="plugin-stat-label glass-text-sm">Installed</span>
      </div>
      <div className="plugin-stat-item">
        <span className="plugin-stat-icon">⚡</span>
        <span className="plugin-stat-value">{pluginCounts.enabled}</span>
        <span className="plugin-stat-label glass-text-sm">Active</span>
      </div>
      <div className="plugin-stat-item">
        <span className="plugin-stat-icon">💚</span>
        <span className="plugin-stat-value">{pluginCounts.healthy}</span>
        <span className="plugin-stat-label glass-text-sm">Healthy</span>
      </div>
    </div>
  );

  // Render filters
  const renderFilters = () => (
    <div className="plugin-dashboard-filters">
      {/* Search */}
      <div className="glass-input-group plugin-search-group">
        <span className="glass-input-icon">🔍</span>
        <input
          id="plugin-search"
          type="text"
          className="glass-input glass-input-with-icon"
          placeholder="Search plugins... (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <select
        className="glass-input plugin-filter-select"
        value={filter.category || 'all'}
        onChange={handleCategoryChange}
      >
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Status Filter (only for catalog) */}
      {activeTab === 'catalog' && (
        <select
          className="glass-input plugin-filter-select"
          value={filter.status || 'all'}
          onChange={handleStatusChange}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {/* View Mode Toggle */}
      <div className="plugin-view-toggle glass-tabs">
        <button
          className={`glass-tab ${viewMode === 'grid' ? 'glass-tab-active' : ''}`}
          onClick={() => setViewMode('grid')}
          title="Grid View"
        >
          ▦
        </button>
        <button
          className={`glass-tab ${viewMode === 'list' ? 'glass-tab-active' : ''}`}
          onClick={() => setViewMode('list')}
          title="List View"
        >
          ≡
        </button>
      </div>
    </div>
  );

  // Render tabs
  const renderTabs = () => (
    <div className="plugin-dashboard-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`plugin-tab ${activeTab === tab.id ? 'plugin-tab-active' : ''}`}
          onClick={() => handleTabChange(tab.id)}
        >
          <span className="plugin-tab-icon">{tab.icon}</span>
          <span className="plugin-tab-label">{tab.label}</span>
          {tab.id === 'installed' && pluginCounts.installed > 0 && (
            <span className="plugin-tab-badge glass-badge">{pluginCounts.installed}</span>
          )}
          {tab.id === 'health' && pluginCounts.healthy < pluginCounts.installed && (
            <span className="plugin-tab-badge glass-badge glass-badge-warning">
              {pluginCounts.installed - pluginCounts.healthy}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // Render plugin grid
  const renderPluginGrid = () => (
    <div
      className={`plugin-grid ${
        viewMode === 'list' ? 'plugin-grid-list' : 'plugin-grid-cols'
      }`}
    >
      {displayPlugins.map((plugin) => (
        <PluginCard
          key={plugin.id}
          plugin={plugin}
          selected={selectedPlugin?.id === plugin.id}
          onClick={handlePluginClick}
          onToggle={togglePlugin}
          onInstall={installPlugin}
          onUninstall={uninstallPlugin}
          onUpdate={updatePlugin}
          onConfigure={handlePluginConfigure}
          loading={loading}
          compact={viewMode === 'list'}
        />
      ))}

      {displayPlugins.length === 0 && (
        <div className="plugin-grid-empty">
          <span className="plugin-empty-icon">🔍</span>
          <h3 className="plugin-empty-title">No plugins found</h3>
          <p className="plugin-empty-text glass-text">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );

  // Render health dashboard
  const renderHealthDashboard = () => (
    <div className="plugin-health-dashboard">
      <div className="plugin-health-overview">
        <h3 className="glass-heading-3">System Health Overview</h3>

        <div className="plugin-health-summary">
          <div className="plugin-health-chart">
            {/* Circular health indicator */}
            <svg viewBox="0 0 100 100" className="plugin-health-ring">
              <circle
                className="plugin-health-ring-bg"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="10"
              />
              <circle
                className="plugin-health-ring-fill"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="10"
                strokeDasharray={`${
                  (pluginCounts.healthy / pluginCounts.installed) * 283
                } 283`}
              />
            </svg>
            <div className="plugin-health-ring-text">
              <span className="plugin-health-percent">
                {((pluginCounts.healthy / pluginCounts.installed) * 100).toFixed(0)}%
              </span>
              <span className="plugin-health-label glass-text-sm">Healthy</span>
            </div>
          </div>

          <div className="plugin-health-breakdown">
            <div className="plugin-breakdown-item">
              <span className="plugin-breakdown-dot plugin-dot-healthy" />
              <span className="plugin-breakdown-label">Healthy</span>
              <span className="plugin-breakdown-value">{pluginCounts.healthy}</span>
            </div>
            <div className="plugin-breakdown-item">
              <span className="plugin-breakdown-dot plugin-dot-degraded" />
              <span className="plugin-breakdown-label">Degraded</span>
              <span className="plugin-breakdown-value">
                {plugins.filter((p) => p.health?.status === 'degraded').length}
              </span>
            </div>
            <div className="plugin-breakdown-item">
              <span className="plugin-breakdown-dot plugin-dot-unhealthy" />
              <span className="plugin-breakdown-label">Unhealthy</span>
              <span className="plugin-breakdown-value">
                {plugins.filter((p) => p.health?.status === 'unhealthy').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Health Details per Plugin */}
      <div className="plugin-health-details">
        <h4 className="glass-heading-3">Plugin Health Details</h4>
        {installedPlugins.map((plugin) => (
          <div key={plugin.id} className="plugin-health-item">
            <div className="plugin-health-item-header">
              <span className="plugin-health-item-name">{plugin.name}</span>
              <span
                className={`glass-badge ${
                  plugin.health?.status === 'healthy'
                    ? 'glass-badge-success'
                    : plugin.health?.status === 'degraded'
                    ? 'glass-badge-warning'
                    : 'glass-badge-error'
                }`}
              >
                {plugin.health?.status || 'Unknown'}
              </span>
            </div>

            {plugin.health && (
              <div className="plugin-health-item-metrics">
                <div className="plugin-metric-mini">
                  <span className="plugin-metric-label">Uptime</span>
                  <span className="plugin-metric-value">{plugin.health.uptime.toFixed(1)}%</span>
                </div>
                <div className="plugin-metric-mini">
                  <span className="plugin-metric-label">CPU</span>
                  <span className="plugin-metric-value">{plugin.health.metrics.cpuUsage}%</span>
                </div>
                <div className="plugin-metric-mini">
                  <span className="plugin-metric-label">Memory</span>
                  <span className="plugin-metric-value">{plugin.health.metrics.memoryUsage}MB</span>
                </div>
                <div className="plugin-metric-mini">
                  <span className="plugin-metric-label">Errors</span>
                  <span className="plugin-metric-value">{plugin.health.errorCount}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render settings panel
  const renderSettingsPanel = () => (
    <div className="plugin-settings-panel">
      <h3 className="glass-heading-3">Plugin System Settings</h3>

      <div className="plugin-settings-section">
        <h4 className="plugin-settings-section-title">General</h4>

        <div className="plugin-setting-item">
          <div className="plugin-setting-info">
            <span className="plugin-setting-name">Auto-update plugins</span>
            <span className="plugin-setting-desc glass-text-sm">
              Automatically update plugins when new versions are available
            </span>
          </div>
          <label className="glass-toggle">
            <input type="checkbox" className="glass-toggle-input" defaultChecked />
            <span className="glass-toggle-slider"></span>
          </label>
        </div>

        <div className="plugin-setting-item">
          <div className="plugin-setting-info">
            <span className="plugin-setting-name">Enable health monitoring</span>
            <span className="plugin-setting-desc glass-text-sm">
              Monitor plugin health and performance metrics
            </span>
          </div>
          <label className="glass-toggle">
            <input type="checkbox" className="glass-toggle-input" defaultChecked />
            <span className="glass-toggle-slider"></span>
          </label>
        </div>

        <div className="plugin-setting-item">
          <div className="plugin-setting-info">
            <span className="plugin-setting-name">Debug mode</span>
            <span className="plugin-setting-desc glass-text-sm">
              Enable detailed logging for plugin operations
            </span>
          </div>
          <label className="glass-toggle">
            <input type="checkbox" className="glass-toggle-input" />
            <span className="glass-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="plugin-settings-section">
        <h4 className="plugin-settings-section-title">Security</h4>

        <div className="plugin-setting-item">
          <div className="plugin-setting-info">
            <span className="plugin-setting-name">Sandbox mode</span>
            <span className="plugin-setting-desc glass-text-sm">
              Run plugins in isolated sandboxes for security
            </span>
          </div>
          <label className="glass-toggle">
            <input type="checkbox" className="glass-toggle-input" defaultChecked />
            <span className="glass-toggle-slider"></span>
          </label>
        </div>

        <div className="plugin-setting-item">
          <div className="plugin-setting-info">
            <span className="plugin-setting-name">Require signed plugins</span>
            <span className="plugin-setting-desc glass-text-sm">
              Only allow installation of cryptographically signed plugins
            </span>
          </div>
          <label className="glass-toggle">
            <input type="checkbox" className="glass-toggle-input" />
            <span className="glass-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="plugin-settings-section">
        <h4 className="plugin-settings-section-title">Performance</h4>

        <div className="plugin-setting-item">
          <div className="plugin-setting-info">
            <span className="plugin-setting-name">Max concurrent executions</span>
            <span className="plugin-setting-desc glass-text-sm">
              Maximum number of concurrent tool/hook executions
            </span>
          </div>
          <input
            type="number"
            className="glass-input plugin-setting-input"
            defaultValue={10}
            min={1}
            max={100}
          />
        </div>

        <div className="plugin-setting-item">
          <div className="plugin-setting-info">
            <span className="plugin-setting-name">Default timeout (ms)</span>
            <span className="plugin-setting-desc glass-text-sm">
              Default timeout for tool and hook executions
            </span>
          </div>
          <input
            type="number"
            className="glass-input plugin-setting-input"
            defaultValue={30000}
            min={1000}
            max={300000}
          />
        </div>
      </div>
    </div>
  );

  // Render notification
  const renderNotification = () => {
    if (!notification) return null;

    const notificationClasses = [
      'plugin-notification',
      `plugin-notification-${notification.type}`,
      'glass-animate-slide-up',
    ].join(' ');

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    return (
      <div className={notificationClasses}>
        <span className="plugin-notification-icon">{icons[notification.type]}</span>
        <span className="plugin-notification-message">{notification.message}</span>
        <button
          className="glass-button glass-button-icon glass-button-sm"
          onClick={clearNotification}
        >
          ✕
        </button>
      </div>
    );
  };

  return (
    <div className="plugin-dashboard">
      {/* Header */}
      <div className="plugin-dashboard-header">
        <div className="plugin-dashboard-title-section">
          <h1 className="plugin-dashboard-title glass-heading-1">Plugin Manager</h1>
          <p className="plugin-dashboard-subtitle glass-text">
            Manage, configure, and monitor OmniTrade plugins
          </p>
        </div>
        {renderStatsBar()}
      </div>

      {/* Tabs */}
      {renderTabs()}

      {/* Main Content */}
      <div className="plugin-dashboard-content">
        {/* Filters (not for settings tab) */}
        {activeTab !== 'settings' && renderFilters()}

        {/* Tab Content */}
        <div className="plugin-dashboard-main">
          {activeTab === 'health' && renderHealthDashboard()}
          {activeTab === 'settings' && renderSettingsPanel()}
          {(activeTab === 'catalog' || activeTab === 'installed') && renderPluginGrid()}
        </div>
      </div>

      {/* Notification */}
      {renderNotification()}
    </div>
  );
};

export default PluginDashboard;
