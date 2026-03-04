/**
 * HookMonitor Component
 * Real-time hook execution monitoring interface
 * Features execution stream, performance metrics, and error logs
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { HookTimeline } from './HookTimeline';
import { useHookMonitor, useDebounce } from './hooks/usePluginManager';
import type { HookExecution, HookDefinition, HookType, HookMetrics } from './types';
import './styles/liquid-glass.css';

// Hook type options
const hookTypeOptions: { value: HookType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Hooks', icon: '🪝' },
  { value: 'pre-trade', label: 'Pre-Trade', icon: '📊' },
  { value: 'post-trade', label: 'Post-Trade', icon: '✅' },
  { value: 'pre-analysis', label: 'Pre-Analysis', icon: '🔍' },
  { value: 'post-analysis', label: 'Post-Analysis', icon: '📈' },
  { value: 'on-error', label: 'On Error', icon: '⚠️' },
  { value: 'on-signal', label: 'On Signal', icon: '📡' },
  { value: 'schedule', label: 'Scheduled', icon: '⏰' },
];

// Status colors
const statusColors: Record<string, string> = {
  pending: 'var(--glass-info)',
  running: 'var(--glass-warning)',
  completed: 'var(--glass-success)',
  failed: 'var(--glass-error)',
  timeout: 'var(--glass-error)',
};

interface HookMonitorProps {
  onHookSelect?: (hook: HookDefinition) => void;
  onToggleHook?: (hookId: string, enabled: boolean) => void;
}

export const HookMonitor: React.FC<HookMonitorProps> = ({ onHookSelect, onToggleHook }) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<HookType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedExecution, setSelectedExecution] = useState<HookExecution | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);

  // Refs
  const streamRef = useRef<HTMLDivElement>(null);

  // Hooks
  const {
    executions,
    metrics,
    selectedHook,
    setSelectedHook,
    isStreaming,
    toggleStreaming,
    getHookMetrics,
    clearExecutions,
  } = useHookMonitor();

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && streamRef.current && isStreaming) {
      streamRef.current.scrollTop = 0;
    }
  }, [executions, autoScroll, isStreaming]);

  // Filtered executions
  const filteredExecutions = useMemo(() => {
    return executions.filter((exec) => {
      // Search filter
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase();
        const matchesName = exec.hookName.toLowerCase().includes(search);
        const matchesPlugin = exec.pluginId.toLowerCase().includes(search);
        if (!matchesName && !matchesPlugin) return false;
      }

      // Type filter (would need hook type info from execution)
      // For now, we'll skip this as executions don't have type directly

      // Status filter
      if (filterStatus !== 'all' && exec.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [executions, debouncedSearch, filterStatus]);

  // Execution statistics
  const execStats = useMemo(() => {
    const total = executions.length;
    const completed = executions.filter((e) => e.status === 'completed').length;
    const failed = executions.filter((e) => e.status === 'failed').length;
    const avgDuration =
      executions.reduce((sum, e) => sum + (e.duration || 0), 0) / total || 0;

    return {
      total,
      completed,
      failed,
      pending: executions.filter((e) => e.status === 'pending').length,
      running: executions.filter((e) => e.status === 'running').length,
      successRate: total > 0 ? (completed / total) * 100 : 0,
      avgDuration: Math.round(avgDuration),
    };
  }, [executions]);

  // Handle execution selection
  const handleExecutionSelect = useCallback((execution: HookExecution) => {
    setSelectedExecution(execution);
  }, []);

  // Handle clear executions
  const handleClearExecutions = useCallback(() => {
    clearExecutions();
    setSelectedExecution(null);
  }, [clearExecutions]);

  // Render stats bar
  const renderStatsBar = () => (
    <div className="hook-monitor-stats">
      <div className="hook-stat-card">
        <div
          className="hook-stat-indicator"
          style={{
            backgroundColor: isStreaming ? 'var(--glass-success)' : 'var(--glass-text-tertiary)',
          }}
        />
        <span className="hook-stat-value">{execStats.total}</span>
        <span className="hook-stat-label">Executions</span>
      </div>

      <div className="hook-stat-card">
        <span className="hook-stat-value" style={{ color: 'var(--glass-success)' }}>
          {execStats.completed}
        </span>
        <span className="hook-stat-label">Completed</span>
      </div>

      <div className="hook-stat-card">
        <span className="hook-stat-value" style={{ color: 'var(--glass-error)' }}>
          {execStats.failed}
        </span>
        <span className="hook-stat-label">Failed</span>
      </div>

      <div className="hook-stat-card">
        <span className="hook-stat-value">{execStats.successRate.toFixed(1)}%</span>
        <span className="hook-stat-label">Success Rate</span>
      </div>

      <div className="hook-stat-card">
        <span className="hook-stat-value">{execStats.avgDuration}ms</span>
        <span className="hook-stat-label">Avg Duration</span>
      </div>
    </div>
  );

  // Render controls
  const renderControls = () => (
    <div className="hook-monitor-controls">
      {/* Search */}
      <div className="glass-input-group hook-search-group">
        <span className="glass-input-icon">🔍</span>
        <input
          type="text"
          className="glass-input glass-input-with-icon"
          placeholder="Search executions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Status Filter */}
      <select
        className="glass-input hook-filter-select"
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="running">Running</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="timeout">Timeout</option>
      </select>

      {/* Streaming Toggle */}
      <button
        className={`glass-button ${isStreaming ? 'glass-button-primary' : ''}`}
        onClick={toggleStreaming}
      >
        {isStreaming ? (
          <>
            <span>⏸</span>
            Pause Stream
          </>
        ) : (
          <>
            <span>▶</span>
            Start Stream
          </>
        )}
      </button>

      {/* Auto-scroll Toggle */}
      <label className="hook-control-toggle">
        <input
          type="checkbox"
          checked={autoScroll}
          onChange={(e) => setAutoScroll(e.target.checked)}
        />
        <span className="hook-control-label">Auto-scroll</span>
      </label>

      {/* Clear Button */}
      <button
        className="glass-button glass-button-danger"
        onClick={handleClearExecutions}
        disabled={executions.length === 0}
      >
        <span>🗑</span>
        Clear
      </button>
    </div>
  );

  // Render execution detail panel
  const renderExecutionDetail = () => {
    if (!selectedExecution) return null;

    return (
      <div className="hook-execution-detail glass-panel-elevated">
        <div className="hook-detail-header">
          <h3 className="hook-detail-title glass-heading-3">Execution Details</h3>
          <button
            className="glass-button glass-button-icon glass-button-sm"
            onClick={() => setSelectedExecution(null)}
          >
            ✕
          </button>
        </div>

        <div className="hook-detail-content">
          {/* Status Badge */}
          <div className="hook-detail-row">
            <span className="hook-detail-label">Status</span>
            <span
              className="glass-badge"
              style={{
                borderColor: statusColors[selectedExecution.status],
                color: statusColors[selectedExecution.status],
              }}
            >
              {selectedExecution.status}
            </span>
          </div>

          {/* Hook Info */}
          <div className="hook-detail-row">
            <span className="hook-detail-label">Hook Name</span>
            <span className="hook-detail-value">{selectedExecution.hookName}</span>
          </div>

          <div className="hook-detail-row">
            <span className="hook-detail-label">Plugin</span>
            <span className="hook-detail-value">{selectedExecution.pluginId}</span>
          </div>

          <div className="hook-detail-row">
            <span className="hook-detail-label">Execution ID</span>
            <span className="hook-detail-value glass-text-mono">{selectedExecution.id}</span>
          </div>

          {/* Timing */}
          <div className="hook-detail-row">
            <span className="hook-detail-label">Started</span>
            <span className="hook-detail-value">
              {new Date(selectedExecution.startTime).toLocaleString()}
            </span>
          </div>

          {selectedExecution.endTime && (
            <div className="hook-detail-row">
              <span className="hook-detail-label">Ended</span>
              <span className="hook-detail-value">
                {new Date(selectedExecution.endTime).toLocaleString()}
              </span>
            </div>
          )}

          {selectedExecution.duration && (
            <div className="hook-detail-row">
              <span className="hook-detail-label">Duration</span>
              <span className="hook-detail-value">{selectedExecution.duration}ms</span>
            </div>
          )}

          {/* Input */}
          {selectedExecution.input && (
            <div className="hook-detail-section">
              <span className="hook-detail-label">Input Parameters</span>
              <pre className="hook-detail-json glass-text-mono">
                {JSON.stringify(selectedExecution.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output */}
          {selectedExecution.output && (
            <div className="hook-detail-section">
              <span className="hook-detail-label">Output</span>
              <pre className="hook-detail-json glass-text-mono">
                {JSON.stringify(selectedExecution.output, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {selectedExecution.error && (
            <div className="hook-detail-section hook-detail-error">
              <span className="hook-detail-label">Error</span>
              <div className="hook-error-box">
                <span className="hook-error-message">{selectedExecution.error.message}</span>
                {selectedExecution.error.code && (
                  <span className="hook-error-code">Code: {selectedExecution.error.code}</span>
                )}
                {selectedExecution.error.stack && (
                  <pre className="hook-error-stack glass-text-mono">
                    {selectedExecution.error.stack}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render live stream
  const renderLiveStream = () => (
    <div className="hook-live-stream glass-panel" ref={streamRef}>
      <div className="hook-stream-header">
        <h3 className="glass-heading-3">
          {isStreaming && <span className="hook-live-indicator glass-animate-pulse" />}
          Live Execution Stream
        </h3>
        <span className="hook-stream-count glass-badge">{filteredExecutions.length}</span>
      </div>

      <div className="hook-stream-list glass-scrollbar">
        {filteredExecutions.length === 0 ? (
          <div className="hook-stream-empty">
            <span className="hook-empty-icon">🪝</span>
            <p className="hook-empty-text glass-text">
              No executions recorded. {isStreaming ? 'Waiting for hooks...' : 'Start streaming to monitor.'}
            </p>
          </div>
        ) : (
          filteredExecutions.map((exec) => (
            <div
              key={exec.id}
              className={`hook-stream-item ${
                selectedExecution?.id === exec.id ? 'hook-item-selected' : ''
              } hook-item-${exec.status}`}
              onClick={() => handleExecutionSelect(exec)}
            >
              <div
                className="hook-stream-dot"
                style={{ backgroundColor: statusColors[exec.status] }}
              />

              <div className="hook-stream-info">
                <span className="hook-stream-name">{exec.hookName}</span>
                <span className="hook-stream-plugin glass-text-sm">{exec.pluginId}</span>
              </div>

              <div className="hook-stream-meta">
                <span className="hook-stream-time glass-text-sm">
                  {new Date(exec.startTime).toLocaleTimeString()}
                </span>
                {exec.duration && (
                  <span className="hook-stream-duration glass-text-sm">{exec.duration}ms</span>
                )}
              </div>

              <span
                className="hook-stream-status glass-badge"
                style={{
                  borderColor: statusColors[exec.status],
                  color: statusColors[exec.status],
                }}
              >
                {exec.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render error log
  const renderErrorLog = () => {
    const errorExecutions = executions.filter((e) => e.status === 'failed' || e.status === 'timeout');

    return (
      <div className="hook-error-log glass-panel">
        <div className="hook-error-log-header">
          <h3 className="glass-heading-3">
            <span className="hook-error-icon">⚠️</span>
            Error Log
          </h3>
          <span className="hook-error-count glass-badge glass-badge-error">
            {errorExecutions.length}
          </span>
        </div>

        <div className="hook-error-list glass-scrollbar">
          {errorExecutions.length === 0 ? (
            <div className="hook-error-empty glass-text">No errors recorded</div>
          ) : (
            errorExecutions.map((exec) => (
              <div
                key={exec.id}
                className="hook-error-item"
                onClick={() => handleExecutionSelect(exec)}
              >
                <div className="hook-error-item-header">
                  <span className="hook-error-item-name">{exec.hookName}</span>
                  <span className="hook-error-item-time glass-text-sm">
                    {new Date(exec.startTime).toLocaleString()}
                  </span>
                </div>
                {exec.error && (
                  <div className="hook-error-item-message">
                    {exec.error.message}
                    {exec.error.code && (
                      <span className="hook-error-item-code glass-text-sm">
                        ({exec.error.code})
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Render metrics panel
  const renderMetricsPanel = () => {
    const hookMetrics = selectedHook ? getHookMetrics(selectedHook) : null;

    return (
      <div className="hook-metrics-panel glass-panel">
        <div className="hook-metrics-header">
          <h3 className="glass-heading-3">Performance Metrics</h3>
          <button
            className="glass-button glass-button-sm"
            onClick={() => setShowMetrics(!showMetrics)}
          >
            {showMetrics ? 'Hide' : 'Show'}
          </button>
        </div>

        {showMetrics && (
          <div className="hook-metrics-content">
            {/* Latency Percentiles Chart */}
            <div className="hook-metrics-chart">
              <h4 className="hook-metrics-chart-title glass-text">Latency Distribution</h4>
              <div className="hook-percentile-bars">
                {['p50', 'p95', 'p99'].map((p) => {
                  const metrics = hookMetrics || Object.values(metrics)[0];
                  const value = metrics ? metrics[`${p}Duration` as keyof HookMetrics] : 0;
                  const maxP99 = metrics?.p99Duration || 1000;
                  const width = Math.min(((value as number) / maxP99) * 100, 100);

                  return (
                    <div key={p} className="hook-percentile-row">
                      <span className="hook-percentile-label">{p.toUpperCase()}</span>
                      <div className="hook-percentile-bar">
                        <div
                          className="hook-percentile-fill"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="hook-percentile-value">{value}ms</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="hook-metrics-summary">
              <div className="hook-metric-item">
                <span className="hook-metric-label">Total Executions</span>
                <span className="hook-metric-value">
                  {hookMetrics?.totalExecutions || Object.values(metrics)[0]?.totalExecutions || 0}
                </span>
              </div>
              <div className="hook-metric-item">
                <span className="hook-metric-label">Success Rate</span>
                <span className="hook-metric-value">
                  {(hookMetrics?.successRate || Object.values(metrics)[0]?.successRate || 0).toFixed(1)}%
                </span>
              </div>
              <div className="hook-metric-item">
                <span className="hook-metric-label">Error Count</span>
                <span className="hook-metric-value hook-metric-error">
                  {hookMetrics?.errorCount || Object.values(metrics)[0]?.errorCount || 0}
                </span>
              </div>
              <div className="hook-metric-item">
                <span className="hook-metric-label">Timeout Count</span>
                <span className="hook-metric-value hook-metric-warning">
                  {hookMetrics?.timeoutCount || Object.values(metrics)[0]?.timeoutCount || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="hook-monitor">
      {/* Header */}
      <div className="hook-monitor-header">
        <div className="hook-monitor-title-section">
          <h1 className="hook-monitor-title glass-heading-1">Hook Monitor</h1>
          <p className="hook-monitor-subtitle glass-text">
            Real-time hook execution monitoring and analytics
          </p>
        </div>
        {renderStatsBar()}
      </div>

      {/* Controls */}
      {renderControls()}

      {/* Main Content */}
      <div className="hook-monitor-content">
        {/* Left Panel - Live Stream */}
        <div className="hook-monitor-left">
          {renderLiveStream()}
        </div>

        {/* Right Panel - Details & Metrics */}
        <div className="hook-monitor-right">
          {selectedExecution ? renderExecutionDetail() : renderMetricsPanel()}
          {renderErrorLog()}
        </div>
      </div>

      {/* Timeline View (Optional) */}
      {showMetrics && (
        <div className="hook-monitor-timeline">
          <HookTimeline
            executions={filteredExecutions.slice(0, 20)}
            metrics={Object.values(metrics)[0]}
            selectedExecutionId={selectedExecution?.id}
            onSelectExecution={handleExecutionSelect}
            maxHeight="400px"
          />
        </div>
      )}
    </div>
  );
};

export default HookMonitor;
