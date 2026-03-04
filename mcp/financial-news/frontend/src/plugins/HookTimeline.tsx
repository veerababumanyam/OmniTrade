/**
 * HookTimeline Component
 * Visual timeline for hook execution monitoring
 * Displays execution history with performance metrics
 */

import React, { useMemo, useCallback } from 'react';
import type { HookExecution, HookMetrics } from './types';
import './styles/liquid-glass.css';

interface HookTimelineProps {
  executions: HookExecution[];
  metrics?: HookMetrics;
  selectedExecutionId?: string | null;
  onSelectExecution?: (execution: HookExecution) => void;
  maxHeight?: string;
}

// Status colors
const statusColors: Record<string, string> = {
  pending: 'var(--glass-info)',
  running: 'var(--glass-warning)',
  completed: 'var(--glass-success)',
  failed: 'var(--glass-error)',
  timeout: 'var(--glass-error)',
};

// Status icons
const statusIcons: Record<string, string> = {
  pending: '⏳',
  running: '▶',
  completed: '✓',
  failed: '✕',
  timeout: '⏱',
};

// Format duration
function formatDuration(ms?: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Format time ago
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

// Get duration bar width percentage
function getDurationBarWidth(duration?: number, p99?: number): number {
  if (!duration) return 0;
  const maxDuration = p99 || 1000;
  return Math.min((duration / maxDuration) * 100, 100);
}

export const HookTimeline: React.FC<HookTimelineProps> = ({
  executions,
  metrics,
  selectedExecutionId,
  onSelectExecution,
  maxHeight = '600px',
}) => {
  // Group executions by time buckets
  const timeBuckets = useMemo(() => {
    const buckets: { label: string; executions: HookExecution[] }[] = [];
    const now = new Date();

    // Create time buckets (last 5 minutes, 15 minutes, 1 hour, etc.)
    const bucketRanges = [
      { label: 'Just now', maxAge: 60 * 1000 },
      { label: 'Last 5 min', maxAge: 5 * 60 * 1000 },
      { label: 'Last 15 min', maxAge: 15 * 60 * 1000 },
      { label: 'Last hour', maxAge: 60 * 60 * 1000 },
      { label: 'Older', maxAge: Infinity },
    ];

    bucketRanges.forEach((range) => {
      const bucketExecutions = executions.filter((exec) => {
        const execTime = new Date(exec.startTime).getTime();
        const age = now.getTime() - execTime;
        return age <= range.maxAge;
      });

      if (bucketExecutions.length > 0) {
        buckets.push({ label: range.label, executions: bucketExecutions });
      }
    });

    return buckets;
  }, [executions]);

  // Handle execution click
  const handleExecutionClick = useCallback(
    (execution: HookExecution) => {
      onSelectExecution?.(execution);
    },
    [onSelectExecution]
  );

  // Calculate success rate percentage
  const successRatePercent = useMemo(() => {
    if (!metrics) return 0;
    return metrics.successRate;
  }, [metrics]);

  return (
    <div className="hook-timeline glass-panel" style={{ maxHeight }}>
      {/* Metrics Summary */}
      {metrics && (
        <div className="hook-timeline-metrics">
          <div className="hook-metrics-grid">
            <div className="hook-metric-card">
              <span className="hook-metric-label glass-text-sm">Total Runs</span>
              <span className="hook-metric-value">{metrics.totalExecutions.toLocaleString()}</span>
            </div>

            <div className="hook-metric-card">
              <span className="hook-metric-label glass-text-sm">Success Rate</span>
              <span className="hook-metric-value">{successRatePercent.toFixed(1)}%</span>
              <div className="glass-progress hook-metric-progress">
                <div
                  className="glass-progress-bar"
                  style={{ width: `${successRatePercent}%` }}
                />
              </div>
            </div>

            <div className="hook-metric-card">
              <span className="hook-metric-label glass-text-sm">Avg Duration</span>
              <span className="hook-metric-value">{formatDuration(metrics.avgDuration)}</span>
            </div>

            <div className="hook-metric-card">
              <span className="hook-metric-label glass-text-sm">P95</span>
              <span className="hook-metric-value">{formatDuration(metrics.p95Duration)}</span>
            </div>

            <div className="hook-metric-card">
              <span className="hook-metric-label glass-text-sm">P99</span>
              <span className="hook-metric-value">{formatDuration(metrics.p99Duration)}</span>
            </div>

            <div className="hook-metric-card hook-metric-card-errors">
              <span className="hook-metric-label glass-text-sm">Errors</span>
              <span className="hook-metric-value">{metrics.errorCount}</span>
            </div>
          </div>

          {/* Latency Distribution */}
          <div className="hook-latency-distribution">
            <span className="hook-latency-label glass-text-sm">Latency Distribution</span>
            <div className="hook-latency-bars">
              <div className="hook-latency-bar-container">
                <span className="hook-latency-marker">0ms</span>
                <div className="hook-latency-bar">
                  <div
                    className="hook-latency-fill hook-latency-p50"
                    style={{ width: `${(metrics.p50Duration / metrics.p99Duration) * 100}%` }}
                    title={`P50: ${formatDuration(metrics.p50Duration)}`}
                  />
                  <div
                    className="hook-latency-fill hook-latency-p95"
                    style={{ width: `${(metrics.p95Duration / metrics.p99Duration) * 100}%` }}
                    title={`P95: ${formatDuration(metrics.p95Duration)}`}
                  />
                </div>
                <span className="hook-latency-marker">{formatDuration(metrics.p99Duration)}</span>
              </div>
              <div className="hook-latency-legend">
                <span className="hook-legend-item">
                  <span className="hook-legend-color hook-latency-p50" />
                  P50: {formatDuration(metrics.p50Duration)}
                </span>
                <span className="hook-legend-item">
                  <span className="hook-legend-color hook-latency-p95" />
                  P95: {formatDuration(metrics.p95Duration)}
                </span>
                <span className="hook-legend-item">
                  <span className="hook-legend-color hook-latency-p99" />
                  P99: {formatDuration(metrics.p99Duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Header */}
      <div className="hook-timeline-header">
        <h4 className="hook-timeline-title glass-heading-3">Execution Timeline</h4>
        <span className="hook-timeline-count glass-badge">
          {executions.length} events
        </span>
      </div>

      {/* Timeline Content */}
      <div className="hook-timeline-content glass-scrollbar">
        {executions.length === 0 ? (
          <div className="hook-timeline-empty">
            <span className="hook-empty-icon">📋</span>
            <p className="hook-empty-text glass-text">No hook executions recorded</p>
          </div>
        ) : (
          <div className="hook-timeline-list">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className={`hook-timeline-item ${
                  selectedExecutionId === execution.id ? 'hook-item-selected' : ''
                } hook-item-${execution.status}`}
                onClick={() => handleExecutionClick(execution)}
                role="button"
                tabIndex={0}
              >
                {/* Timeline Dot */}
                <div
                  className="hook-timeline-dot"
                  style={{ backgroundColor: statusColors[execution.status] }}
                >
                  <span className="hook-dot-icon">{statusIcons[execution.status]}</span>
                </div>

                {/* Timeline Connector */}
                <div className="hook-timeline-connector" />

                {/* Execution Card */}
                <div className="hook-execution-card">
                  <div className="hook-execution-header">
                    <span className="hook-execution-name">{execution.hookName}</span>
                    <span
                      className="glass-badge"
                      style={{
                        borderColor: statusColors[execution.status],
                        color: statusColors[execution.status],
                      }}
                    >
                      {execution.status}
                    </span>
                  </div>

                  <div className="hook-execution-details">
                    <div className="hook-detail">
                      <span className="hook-detail-label glass-text-sm">Plugin</span>
                      <span className="hook-detail-value">{execution.pluginId}</span>
                    </div>

                    <div className="hook-detail">
                      <span className="hook-detail-label glass-text-sm">Duration</span>
                      <span className="hook-detail-value">{formatDuration(execution.duration)}</span>
                    </div>

                    <div className="hook-detail">
                      <span className="hook-detail-label glass-text-sm">Time</span>
                      <span className="hook-detail-value">
                        {formatTimeAgo(execution.startTime)}
                      </span>
                    </div>
                  </div>

                  {/* Duration Bar */}
                  {execution.duration && (
                    <div className="hook-duration-bar">
                      <div
                        className="hook-duration-fill"
                        style={{
                          width: `${getDurationBarWidth(execution.duration, metrics?.p99Duration)}%`,
                          backgroundColor: statusColors[execution.status],
                        }}
                      />
                    </div>
                  )}

                  {/* Input Preview */}
                  {execution.input && (
                    <div className="hook-execution-input">
                      <span className="hook-input-label glass-text-sm">Input</span>
                      <pre className="hook-input-preview glass-text-mono">
                        {JSON.stringify(execution.input, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error Details */}
                  {execution.error && (
                    <div className="hook-execution-error">
                      <span className="hook-error-icon">⚠️</span>
                      <div className="hook-error-content">
                        <span className="hook-error-message">{execution.error.message}</span>
                        {execution.error.code && (
                          <span className="hook-error-code glass-text-sm">
                            Code: {execution.error.code}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HookTimeline;
