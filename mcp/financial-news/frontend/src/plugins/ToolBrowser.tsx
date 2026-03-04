/**
 * ToolBrowser Component
 * Tool discovery, search, and testing interface
 * Features tool search, detail view, and analytics
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ToolTester } from './ToolTester';
import { useToolManager, useDebounce } from './hooks/usePluginManager';
import type { ToolDefinition, ToolCategory, ToolFilter } from './types';
import './styles/liquid-glass.css';

// Category options for filter
const categoryOptions: { value: ToolCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Categories', icon: '📦' },
  { value: 'market-data', label: 'Market Data', icon: '📊' },
  { value: 'analysis', label: 'Analysis', icon: '📈' },
  { value: 'trading', label: 'Trading', icon: '💹' },
  { value: 'risk', label: 'Risk', icon: '⚠️' },
  { value: 'reporting', label: 'Reporting', icon: '📋' },
  { value: 'utility', label: 'Utility', icon: '🔧' },
];

// Category colors
const categoryColors: Record<ToolCategory, string> = {
  'market-data': 'var(--glass-info)',
  'analysis': 'var(--glass-primary)',
  'trading': 'var(--glass-success)',
  'risk': 'var(--glass-warning)',
  'reporting': 'var(--glass-accent-cyan)',
  'utility': 'var(--glass-text-secondary)',
};

interface ToolBrowserProps {
  onToolSelect?: (tool: ToolDefinition) => void;
  onToolExecute?: (toolId: string, params: Record<string, unknown>) => Promise<void>;
  pluginFilter?: string;
}

export const ToolBrowser: React.FC<ToolBrowserProps> = ({
  onToolSelect,
  onToolExecute,
  pluginFilter,
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'executions' | 'time'>('name');

  // Hooks
  const {
    tools,
    filteredTools,
    filter,
    setFilter,
    executing,
    executionResult,
    clearResult,
    executeTool,
  } = useToolManager();

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update filter when search changes
  React.useEffect(() => {
    setFilter((prev: ToolFilter) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch, setFilter]);

  // Apply plugin filter if provided
  React.useEffect(() => {
    if (pluginFilter) {
      setFilter((prev: ToolFilter) => ({ ...prev, pluginId: pluginFilter }));
    }
  }, [pluginFilter, setFilter]);

  // Sorted tools
  const sortedTools = useMemo(() => {
    const sorted = [...filteredTools];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'executions':
        return sorted.sort((a, b) => (b.executionCount || 0) - (a.executionCount || 0));
      case 'time':
        return sorted.sort((a, b) => (b.avgExecutionTime || 0) - (a.avgExecutionTime || 0));
      default:
        return sorted;
    }
  }, [filteredTools, sortBy]);

  // Tool statistics
  const toolStats = useMemo(() => {
    const totalExecutions = tools.reduce((sum, t) => sum + (t.executionCount || 0), 0);
    const avgTime =
      tools.reduce((sum, t) => sum + (t.avgExecutionTime || 0), 0) / tools.length || 0;
    const enabledTools = tools.filter((t) => t.enabled).length;

    return {
      totalTools: tools.length,
      enabledTools,
      totalExecutions,
      avgExecutionTime: Math.round(avgTime),
    };
  }, [tools]);

  // Group tools by category
  const toolsByCategory = useMemo(() => {
    const grouped: Record<string, ToolDefinition[]> = {};
    sortedTools.forEach((tool) => {
      if (!grouped[tool.category]) {
        grouped[tool.category] = [];
      }
      grouped[tool.category].push(tool);
    });
    return grouped;
  }, [sortedTools]);

  // Handle tool selection
  const handleToolSelect = useCallback(
    (tool: ToolDefinition) => {
      setSelectedTool(tool);
      setViewMode('detail');
      onToolSelect?.(tool);
    },
    [onToolSelect]
  );

  // Handle category filter change
  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as ToolCategory | 'all';
      setFilter((prev: ToolFilter) => ({ ...prev, category: value }));
    },
    [setFilter]
  );

  // Handle tool execute
  const handleExecute = useCallback(
    async (toolId: string, params: Record<string, unknown>) => {
      const result = await executeTool(toolId, params);
      onToolExecute?.(toolId, params);
      return result;
    },
    [executeTool, onToolExecute]
  );

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedTool(null);
    clearResult();
  }, [clearResult]);

  // Render stats bar
  const renderStatsBar = () => (
    <div className="tool-browser-stats">
      <div className="tool-stat-card">
        <span className="tool-stat-icon">🔧</span>
        <span className="tool-stat-value">{toolStats.totalTools}</span>
        <span className="tool-stat-label">Tools</span>
      </div>
      <div className="tool-stat-card">
        <span className="tool-stat-icon">⚡</span>
        <span className="tool-stat-value">{toolStats.enabledTools}</span>
        <span className="tool-stat-label">Active</span>
      </div>
      <div className="tool-stat-card">
        <span className="tool-stat-icon">▶</span>
        <span className="tool-stat-value">{toolStats.totalExecutions.toLocaleString()}</span>
        <span className="tool-stat-label">Executions</span>
      </div>
      <div className="tool-stat-card">
        <span className="tool-stat-icon">⏱</span>
        <span className="tool-stat-value">{toolStats.avgExecutionTime}ms</span>
        <span className="tool-stat-label">Avg Time</span>
      </div>
    </div>
  );

  // Render filters
  const renderFilters = () => (
    <div className="tool-browser-filters">
      {/* Search */}
      <div className="glass-input-group tool-search-group">
        <span className="glass-input-icon">🔍</span>
        <input
          type="text"
          className="glass-input glass-input-with-icon"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <select
        className="glass-input tool-filter-select"
        value={filter.category || 'all'}
        onChange={handleCategoryChange}
      >
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.icon} {option.label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        className="glass-input tool-filter-select"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
      >
        <option value="name">Sort by Name</option>
        <option value="executions">Sort by Usage</option>
        <option value="time">Sort by Time</option>
      </select>
    </div>
  );

  // Render tool card
  const renderToolCard = (tool: ToolDefinition) => (
    <div
      key={tool.id}
      className={`tool-card glass-card ${selectedTool?.id === tool.id ? 'glass-card-active' : ''}`}
      onClick={() => handleToolSelect(tool)}
      role="button"
      tabIndex={0}
    >
      <div className="tool-card-header">
        <h4 className="tool-card-name">{tool.name}</h4>
        <span
          className="tool-card-category"
          style={{ color: categoryColors[tool.category] }}
        >
          {tool.category.replace('-', ' ')}
        </span>
      </div>

      <p className="tool-card-description glass-text">{tool.description}</p>

      <div className="tool-card-meta">
        <span className="tool-card-plugin glass-text-sm">
          <span className="tool-meta-icon">📦</span>
          {tool.pluginId}
        </span>

        {tool.executionCount !== undefined && (
          <span className="tool-card-stat glass-text-sm">
            <span className="tool-meta-icon">▶</span>
            {tool.executionCount.toLocaleString()} runs
          </span>
        )}

        {tool.avgExecutionTime !== undefined && (
          <span className="tool-card-stat glass-text-sm">
            <span className="tool-meta-icon">⏱</span>
            {tool.avgExecutionTime}ms avg
          </span>
        )}
      </div>

      <div className="tool-card-footer">
        <span className={`glass-badge ${tool.enabled ? 'glass-badge-success' : ''}`}>
          {tool.enabled ? 'Active' : 'Disabled'}
        </span>
      </div>
    </div>
  );

  // Render category section
  const renderCategorySection = (category: string, categoryTools: ToolDefinition[]) => (
    <div key={category} className="tool-category-section">
      <div className="tool-category-header">
        <h3 className="tool-category-title glass-heading-3">
          <span
            className="tool-category-icon"
            style={{ color: categoryColors[category as ToolCategory] }}
          >
            {categoryOptions.find((c) => c.value === category)?.icon || '📦'}
          </span>
          {categoryOptions.find((c) => c.value === category)?.label || category}
        </h3>
        <span className="tool-category-count glass-badge">{categoryTools.length}</span>
      </div>
      <div className="tool-category-grid">{categoryTools.map(renderToolCard)}</div>
    </div>
  );

  // Render list view
  const renderListView = () => (
    <div className="tool-browser-list">
      {/* Analytics Dashboard */}
      <div className="tool-analytics-panel glass-panel">
        <h3 className="glass-heading-3">Tool Analytics</h3>

        <div className="tool-analytics-grid">
          {/* Most Used Tools */}
          <div className="tool-analytics-section">
            <h4 className="tool-analytics-title glass-text">Most Used</h4>
            <div className="tool-leaderboard">
              {tools
                .sort((a, b) => (b.executionCount || 0) - (a.executionCount || 0))
                .slice(0, 5)
                .map((tool, index) => (
                  <div key={tool.id} className="tool-leaderboard-item">
                    <span className="tool-rank">#{index + 1}</span>
                    <span className="tool-leaderboard-name">{tool.name}</span>
                    <span className="tool-leaderboard-count">
                      {(tool.executionCount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Slowest Tools */}
          <div className="tool-analytics-section">
            <h4 className="tool-analytics-title glass-text">Slowest Avg Time</h4>
            <div className="tool-leaderboard">
              {tools
                .filter((t) => t.avgExecutionTime)
                .sort((a, b) => (b.avgExecutionTime || 0) - (a.avgExecutionTime || 0))
                .slice(0, 5)
                .map((tool, index) => (
                  <div key={tool.id} className="tool-leaderboard-item">
                    <span className="tool-rank">#{index + 1}</span>
                    <span className="tool-leaderboard-name">{tool.name}</span>
                    <span className="tool-leaderboard-time">{tool.avgExecutionTime}ms</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="tool-analytics-section tool-category-distribution">
            <h4 className="tool-analytics-title glass-text">By Category</h4>
            <div className="tool-distribution-chart">
              {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                <div key={category} className="tool-distribution-bar">
                  <span className="tool-distribution-label">
                    {categoryOptions.find((c) => c.value === category)?.label || category}
                  </span>
                  <div className="tool-distribution-track">
                    <div
                      className="tool-distribution-fill"
                      style={{
                        width: `${(categoryTools.length / tools.length) * 100}%`,
                        backgroundColor: categoryColors[category as ToolCategory],
                      }}
                    />
                  </div>
                  <span className="tool-distribution-count">{categoryTools.length}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tool List by Category */}
      <div className="tool-browser-categories">
        {Object.entries(toolsByCategory).map(([category, categoryTools]) =>
          renderCategorySection(category, categoryTools)
        )}

        {sortedTools.length === 0 && (
          <div className="tool-browser-empty">
            <span className="tool-empty-icon">🔍</span>
            <h3 className="tool-empty-title">No tools found</h3>
            <p className="tool-empty-text glass-text">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Render detail view
  const renderDetailView = () => {
    if (!selectedTool) return null;

    return (
      <div className="tool-browser-detail">
        {/* Back Button */}
        <button className="glass-button tool-back-button" onClick={handleBackToList}>
          <span>←</span>
          Back to Tools
        </button>

        {/* Tool Detail Header */}
        <div className="tool-detail-header glass-panel">
          <div className="tool-detail-info">
            <h2 className="tool-detail-name glass-heading-2">{selectedTool.name}</h2>
            <div className="tool-detail-badges">
              <span
                className="glass-badge"
                style={{ color: categoryColors[selectedTool.category] }}
              >
                {selectedTool.category.replace('-', ' ')}
              </span>
              <span className={`glass-badge ${selectedTool.enabled ? 'glass-badge-success' : ''}`}>
                {selectedTool.enabled ? 'Active' : 'Disabled'}
              </span>
              <span className="glass-badge">v{selectedTool.pluginId}</span>
            </div>
          </div>
          <p className="tool-detail-description glass-text">{selectedTool.description}</p>
        </div>

        {/* Tool Tester */}
        <ToolTester
          tool={selectedTool}
          onExecute={handleExecute}
          executing={executing === selectedTool.id}
          result={executionResult}
          onClearResult={clearResult}
        />

        {/* Input Schema Documentation */}
        <div className="tool-schema-panel glass-panel">
          <h3 className="glass-heading-3">Input Schema</h3>
          <pre className="tool-schema-code glass-text-mono">
            {JSON.stringify(selectedTool.inputSchema, null, 2)}
          </pre>
        </div>

        {/* Execution History */}
        {selectedTool.executionCount !== undefined && selectedTool.executionCount > 0 && (
          <div className="tool-history-panel glass-panel">
            <h3 className="glass-heading-3">Recent Activity</h3>
            <div className="tool-history-stats">
              <div className="tool-history-stat">
                <span className="tool-history-label">Total Executions</span>
                <span className="tool-history-value">
                  {selectedTool.executionCount.toLocaleString()}
                </span>
              </div>
              <div className="tool-history-stat">
                <span className="tool-history-label">Average Time</span>
                <span className="tool-history-value">
                  {selectedTool.avgExecutionTime || 0}ms
                </span>
              </div>
              <div className="tool-history-stat">
                <span className="tool-history-label">Last Executed</span>
                <span className="tool-history-value">
                  {selectedTool.lastExecuted
                    ? new Date(selectedTool.lastExecuted).toLocaleString()
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tool-browser">
      {/* Header */}
      <div className="tool-browser-header">
        <div className="tool-browser-title-section">
          <h1 className="tool-browser-title glass-heading-1">Tool Browser</h1>
          <p className="tool-browser-subtitle glass-text">
            Discover, test, and analyze available tools
          </p>
        </div>
        {renderStatsBar()}
      </div>

      {/* Main Content */}
      <div className="tool-browser-content">
        {viewMode === 'list' && (
          <>
            {renderFilters()}
            {renderListView()}
          </>
        )}

        {viewMode === 'detail' && renderDetailView()}
      </div>
    </div>
  );
};

export default ToolBrowser;
