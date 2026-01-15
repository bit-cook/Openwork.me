'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { getAccomplish } from '@/lib/accomplish';
import { analytics } from '@/lib/analytics';
import { API_KEY_PROVIDERS, type ProviderId } from './types';

interface AddApiKeyProps {
  providerId: ProviderId;
  onSuccess: () => void;
  onBack: () => void;
}

export default function AddApiKey({ providerId, onSuccess, onBack }: AddApiKeyProps) {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const provider = API_KEY_PROVIDERS.find((p) => p.id === providerId)!;

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setError(t('settings.apiKey.error', 'Please enter an API key.'));
      return;
    }

    if (!trimmedKey.startsWith(provider.prefix)) {
      setError(t('settings.apiKey.invalidFormat', `Invalid API key format. Key should start with ${provider.prefix}`));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const accomplish = getAccomplish();
      const validation = await accomplish.validateApiKeyForProvider(providerId, trimmedKey);

      if (!validation.valid) {
        setError(validation.error || 'Invalid API key');
        setIsSaving(false);
        return;
      }

      await accomplish.addApiKey(providerId, trimmedKey);
      analytics.trackSaveApiKey(provider.name);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t('settings.wizard.addApiKeyFor', 'Add your {{provider}} API key', { provider: provider.name })}
      </h2>
      <div>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider.placeholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('settings.wizard.back', 'Back')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? t('settings.apiKey.saving', 'Saving...') : t('settings.wizard.validateAndNext', 'Validate & Next')}
        </button>
      </div>
    </div>
  );
}
