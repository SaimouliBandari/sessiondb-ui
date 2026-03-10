// Copyright (c) 2026 Sai Mouli Bandari Licensed under Business Source License 1.1.
/**
 * AI provider configuration page (Phase 3 BYOK).
 * GET/PUT /ai/config; never displays API key.
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './Admin.module.css';
import { getAIConfig, updateAIConfig } from '../../api/ai';
import { getApiErrorMessage } from '../../api/errors';
import { Bot, Check, Loader2 } from 'lucide-react';

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)' },
];

const SettingsAIConfig: React.FC = () => {
  const queryClient = useQueryClient();
  const [providerType, setProviderType] = useState<string>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelName, setModelName] = useState('gpt-4o-mini');
  const [saveMessage, setSaveMessage] = useState<'success' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['aiConfig'],
    queryFn: getAIConfig,
  });

  useEffect(() => {
    if (config) {
      setProviderType(config.providerType ?? 'openai');
      setBaseUrl(config.baseUrl ?? '');
      setModelName(config.modelName ?? 'gpt-4o-mini');
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: updateAIConfig,
    onSuccess: () => {
      setSaveMessage('success');
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['aiConfig'] });
      setApiKey('');
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!apiKey.trim()) {
      setFormError('API key is required to save.');
      return;
    }
    if (!modelName.trim()) {
      setFormError('Model name is required.');
      return;
    }
    updateMutation.mutate({
      providerType,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
      modelName: modelName.trim(),
    });
  };

  if (configLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>AI Configuration</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>AI Configuration</h1>
          <p className={styles.pageSubtitle}>
            Configure your AI provider for &quot;Generate SQL&quot; and &quot;Explain query&quot; (BYOK). Your API key is never stored in plain text on the server.
          </p>
        </div>
      </div>

      {config?.configured && (
        <div className={styles.formSection} style={{ marginBottom: '24px' }}>
          <div className={styles.detailsHeader}>
            <Check size={18} style={{ color: 'var(--success)' }} />
            <span>AI is configured</span>
          </div>
          <p className={styles.pageSubtitle} style={{ marginTop: '8px' }}>
            Provider: <strong>{config.providerType ?? '—'}</strong>
            {config.modelName && <> · Model: <strong>{config.modelName}</strong></>}
            {config.baseUrl && <> · Base URL: <strong>{config.baseUrl}</strong></>}
          </p>
        </div>
      )}

      <div className={styles.formSection}>
        <div className={styles.detailsHeader}>
          <Bot size={18} />
          <span>Provider settings</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="ai-provider">Provider type</label>
            <select
              id="ai-provider"
              value={providerType}
              onChange={(e) => setProviderType(e.target.value)}
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ai-apikey">API key</label>
            <input
              id="ai-apikey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.configured ? 'Leave blank to keep current' : 'Enter your API key'}
              autoComplete="off"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ai-baseurl">Base URL (optional)</label>
            <input
              id="ai-baseurl"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ai-model">Model name</label>
            <input
              id="ai-model"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. gpt-4o-mini"
            />
          </div>

          {formError && (
            <div style={{ color: 'var(--error)', marginBottom: '12px', fontSize: '14px' }}>{formError}</div>
          )}
          {saveMessage === 'success' && (
            <div style={{ color: 'var(--success)', marginBottom: '12px', fontSize: '14px' }}>Saved.</div>
          )}

          <div className={styles.formGroup}>
            <button
              type="submit"
              className="btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 size={16} className="spin" style={{ marginRight: '8px' }} />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsAIConfig;
