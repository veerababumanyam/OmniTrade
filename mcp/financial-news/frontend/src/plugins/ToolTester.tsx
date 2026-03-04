/**
 * ToolTester Component
 * Interactive interface for testing tools with sample data
 * Features parameter input, execution, and result display
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { ToolDefinition, ToolExecutionResult, JSONSchema } from './types';
import './styles/liquid-glass.css';

interface ToolTesterProps {
  tool: ToolDefinition;
  onExecute?: (toolId: string, params: Record<string, unknown>) => Promise<ToolExecutionResult>;
  executing?: boolean;
  result?: ToolExecutionResult | null;
  onClearResult?: () => void;
}

// Generate default value based on schema type
function getDefaultValue(schema: JSONSchema): unknown {
  const type = schema.type;

  if (schema.default !== undefined) {
    return schema.default;
  }

  switch (type) {
    case 'string':
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0];
      }
      return '';
    case 'number':
    case 'integer':
      return schema.minimum ?? 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      const obj: Record<string, unknown> = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]) => {
          obj[key] = getDefaultValue(prop as JSONSchema);
        });
      }
      return obj;
    default:
      return '';
  }
}

// Format JSON for display
function formatJson(value: unknown, indent = 2): string {
  try {
    return JSON.stringify(value, null, indent);
  } catch {
    return String(value);
  }
}

// Sample data presets for common tool types
const sampleDataPresets: Record<string, Record<string, unknown>> = {
  'market-data': {
    symbol: 'AAPL',
    limit: 10,
  },
  'analysis': {
    symbol: 'GOOGL',
    days: 7,
  },
  'trading': {
    symbol: 'MSFT',
    quantity: 100,
    side: 'buy',
  },
};

export const ToolTester: React.FC<ToolTesterProps> = ({
  tool,
  onExecute,
  executing = false,
  result,
  onClearResult,
}) => {
  const [params, setParams] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    if (tool.inputSchema.properties) {
      Object.entries(tool.inputSchema.properties).forEach(([key, prop]) => {
        defaults[key] = getDefaultValue(prop as JSONSchema);
      });
    }
    return defaults;
  });

  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState(() => formatJson(params));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Required parameters
  const requiredParams = useMemo(() => {
    return tool.inputSchema.required || [];
  }, [tool.inputSchema.required]);

  // Parameter properties
  const paramProperties = useMemo(() => {
    return tool.inputSchema.properties || {};
  }, [tool.inputSchema.properties]);

  // Update parameter value
  const updateParam = useCallback((key: string, value: unknown) => {
    setParams((prev) => {
      const updated = { ...prev, [key]: value };
      setJsonInput(formatJson(updated));
      return updated;
    });
  }, []);

  // Handle JSON input change
  const handleJsonChange = useCallback((value: string) => {
    setJsonInput(value);
    try {
      const parsed = JSON.parse(value);
      setJsonError(null);
      setParams(parsed);
    } catch (e) {
      setJsonError('Invalid JSON format');
    }
  }, []);

  // Load sample data
  const loadSampleData = useCallback(() => {
    const sample = sampleDataPresets[tool.category] || {};
    const merged = { ...params, ...sample };
    setParams(merged);
    setJsonInput(formatJson(merged));
  }, [tool.category, params]);

  // Reset to defaults
  const resetParams = useCallback(() => {
    const defaults: Record<string, unknown> = {};
    Object.entries(paramProperties).forEach(([key, prop]) => {
      defaults[key] = getDefaultValue(prop as JSONSchema);
    });
    setParams(defaults);
    setJsonInput(formatJson(defaults));
    onClearResult?.();
  }, [paramProperties, onClearResult]);

  // Execute tool
  const handleExecute = useCallback(async () => {
    if (onExecute) {
      await onExecute(tool.id, params);
    }
  }, [tool.id, params, onExecute]);

  // Validate parameters
  const validateParams = useCallback((): boolean => {
    for (const required of requiredParams) {
      const value = params[required];
      if (value === undefined || value === null || value === '') {
        return false;
      }
    }
    return true;
  }, [params, requiredParams]);

  const isValid = validateParams();

  // Render input field based on type
  const renderInputField = (key: string, prop: JSONSchema) => {
    const type = prop.type;
    const isRequired = requiredParams.includes(key);
    const value = params[key];

    const inputId = `tool-param-${key}`;

    return (
      <div key={key} className="tool-param-field">
        <label className="tool-param-label" htmlFor={inputId}>
          <span className="tool-param-name">{prop.title || key}</span>
          {isRequired && <span className="tool-param-required">*</span>}
          {prop.description && (
            <span className="tool-param-description glass-text-sm">
              {prop.description}
            </span>
          )}
        </label>

        {type === 'string' && prop.enum ? (
          <select
            id={inputId}
            className="glass-input"
            value={String(value || '')}
            onChange={(e) => updateParam(key, e.target.value)}
          >
            {prop.enum.map((option) => (
              <option key={String(option)} value={String(option)}>
                {String(option)}
              </option>
            ))}
          </select>
        ) : type === 'string' ? (
          <input
            id={inputId}
            type="text"
            className="glass-input"
            value={String(value || '')}
            onChange={(e) => updateParam(key, e.target.value)}
            placeholder={prop.description || `Enter ${key}`}
          />
        ) : type === 'number' || type === 'integer' ? (
          <input
            id={inputId}
            type="number"
            className="glass-input"
            value={Number(value) || 0}
            onChange={(e) => updateParam(key, parseFloat(e.target.value))}
            min={prop.minimum}
            max={prop.maximum}
            step={type === 'integer' ? 1 : 'any'}
          />
        ) : type === 'boolean' ? (
          <label className="glass-toggle">
            <input
              type="checkbox"
              className="glass-toggle-input"
              checked={Boolean(value)}
              onChange={(e) => updateParam(key, e.target.checked)}
            />
            <span className="glass-toggle-slider"></span>
          </label>
        ) : (
          <input
            id={inputId}
            type="text"
            className="glass-input"
            value={String(value || '')}
            onChange={(e) => updateParam(key, e.target.value)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="tool-tester glass-panel">
      {/* Header */}
      <div className="tool-tester-header">
        <div className="tool-tester-title-section">
          <h3 className="tool-tester-name glass-heading-3">{tool.name}</h3>
          <span className="glass-badge glass-badge-primary">{tool.category}</span>
        </div>
        <p className="tool-tester-description glass-text">{tool.description}</p>
      </div>

      {/* Mode Toggle */}
      <div className="tool-tester-mode-toggle">
        <div className="glass-tabs">
          <button
            className={`glass-tab ${!jsonMode ? 'glass-tab-active' : ''}`}
            onClick={() => setJsonMode(false)}
          >
            Form
          </button>
          <button
            className={`glass-tab ${jsonMode ? 'glass-tab-active' : ''}`}
            onClick={() => setJsonMode(true)}
          >
            JSON
          </button>
        </div>
      </div>

      {/* Parameter Input */}
      <div className="tool-tester-params">
        {!jsonMode ? (
          <div className="tool-params-form">
            {Object.entries(paramProperties).map(([key, prop]) =>
              renderInputField(key, prop as JSONSchema)
            )}
          </div>
        ) : (
          <div className="tool-params-json">
            <textarea
              className={`glass-input tool-json-input ${jsonError ? 'glass-input-error' : ''}`}
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              spellCheck={false}
            />
            {jsonError && (
              <span className="tool-json-error glass-text-sm">{jsonError}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="tool-tester-actions">
        <button
          className="glass-button glass-button-primary"
          onClick={handleExecute}
          disabled={!isValid || executing}
        >
          {executing ? (
            <>
              <span className="glass-animate-spin">⟳</span>
              Executing...
            </>
          ) : (
            <>
              <span>▶</span>
              Execute Tool
            </>
          )}
        </button>

        <button className="glass-button" onClick={loadSampleData}>
          Load Sample
        </button>

        <button className="glass-button" onClick={resetParams}>
          Reset
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`tool-tester-result ${result.success ? 'result-success' : 'result-error'}`}>
          <div className="tool-result-header">
            <span className={`glass-badge ${result.success ? 'glass-badge-success' : 'glass-badge-error'}`}>
              {result.success ? 'Success' : 'Error'}
            </span>
            <span className="tool-result-time glass-text-sm">
              {result.executionTime}ms
            </span>
            <span className="tool-result-timestamp glass-text-sm">
              {new Date(result.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="tool-result-content">
            {result.success ? (
              <pre className="tool-result-json glass-text-mono">
                {formatJson(result.data)}
              </pre>
            ) : (
              <div className="tool-result-error">
                <span className="tool-error-icon">⚠️</span>
                <span className="tool-error-message">{result.error}</span>
              </div>
            )}
          </div>

          <button
            className="glass-button glass-button-sm"
            onClick={onClearResult}
          >
            Clear Result
          </button>
        </div>
      )}

      {/* Tool Stats */}
      <div className="tool-tester-stats">
        <div className="tool-stat">
          <span className="tool-stat-label glass-text-sm">Executions</span>
          <span className="tool-stat-value">{tool.executionCount || 0}</span>
        </div>
        {tool.avgExecutionTime && (
          <div className="tool-stat">
            <span className="tool-stat-label glass-text-sm">Avg Time</span>
            <span className="tool-stat-value">{tool.avgExecutionTime}ms</span>
          </div>
        )}
        {tool.lastExecuted && (
          <div className="tool-stat">
            <span className="tool-stat-label glass-text-sm">Last Run</span>
            <span className="tool-stat-value">
              {new Date(tool.lastExecuted).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolTester;
