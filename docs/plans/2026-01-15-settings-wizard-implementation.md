# Settings Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the settings dialog from a tabbed interface into a step-by-step wizard for model configuration.

**Architecture:** Extract wizard steps into separate components, manage wizard state in parent component, keep always-visible sections (API Keys, Language, Debug, About) as separate components below the wizard area.

**Tech Stack:** React, TypeScript, Tailwind CSS, i18next, Vitest + React Testing Library

---

## Task 1: Add New Translation Keys

**Files:**
- Modify: `apps/desktop/src/renderer/locales/en.json`
- Modify: `apps/desktop/src/renderer/locales/ja.json`

**Step 1: Add wizard translations to en.json**

Add these keys under `settings.wizard`:

```json
{
  "settings": {
    "wizard": {
      "chooseModel": "Choose Model",
      "cloud": "Cloud",
      "cloudDescription": "Use AI models from cloud providers",
      "local": "Local",
      "localDescription": "Use Ollama on your machine",
      "selectProvider": "Select Provider",
      "addApiKey": "Add API Key",
      "addApiKeyFor": "Add your {{provider}} API key",
      "selectModel": "Select Model",
      "back": "Back",
      "next": "Next",
      "done": "Done",
      "validateAndNext": "Validate & Next",
      "modelSetTo": "Model set to {{model}}"
    }
  }
}
```

**Step 2: Add wizard translations to ja.json**

Add equivalent Japanese translations under `settings.wizard`.

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/locales/en.json apps/desktop/src/renderer/locales/ja.json
git commit -m "feat: add wizard translation keys for settings redesign"
```

---

## Task 2: Create Wizard Types

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/settings/types.ts`

**Step 1: Create the types file**

```typescript
export type WizardStep =
  | 'choose-type'
  | 'select-provider'
  | 'add-api-key'
  | 'select-model'
  | 'ollama-setup';

export type ModelType = 'cloud' | 'local' | null;

export type ProviderId = 'anthropic' | 'openai' | 'google' | 'xai';

export interface WizardState {
  step: WizardStep;
  modelType: ModelType;
  selectedProvider: ProviderId | null;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  prefix: string;
  placeholder: string;
}

export const API_KEY_PROVIDERS: ProviderConfig[] = [
  { id: 'anthropic', name: 'Anthropic', prefix: 'sk-ant-', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI', prefix: 'sk-', placeholder: 'sk-...' },
  { id: 'google', name: 'Google AI', prefix: 'AIza', placeholder: 'AIza...' },
  { id: 'xai', name: 'xAI (Grok)', prefix: 'xai-', placeholder: 'xai-...' },
];
```

**Step 2: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/settings/types.ts
git commit -m "feat: add wizard types for settings redesign"
```

---

## Task 3: Create ChooseModelType Step Component

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/settings/ChooseModelType.tsx`
- Create: `apps/desktop/__tests__/integration/renderer/components/settings/ChooseModelType.test.tsx`

**Step 1: Write the failing test**

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

import ChooseModelType from '@/components/layout/settings/ChooseModelType';

describe('ChooseModelType', () => {
  it('should render Cloud and Local options', () => {
    render(<ChooseModelType onSelect={vi.fn()} />);

    expect(screen.getByText('Cloud')).toBeInTheDocument();
    expect(screen.getByText('Local')).toBeInTheDocument();
  });

  it('should call onSelect with "cloud" when Cloud is clicked', () => {
    const onSelect = vi.fn();
    render(<ChooseModelType onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Cloud'));

    expect(onSelect).toHaveBeenCalledWith('cloud');
  });

  it('should call onSelect with "local" when Local is clicked', () => {
    const onSelect = vi.fn();
    render(<ChooseModelType onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Local'));

    expect(onSelect).toHaveBeenCalledWith('local');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/ChooseModelType.test.tsx`

Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
'use client';

import { useTranslation } from 'react-i18next';
import { Cloud, HardDrive } from 'lucide-react';
import type { ModelType } from './types';

interface ChooseModelTypeProps {
  onSelect: (type: ModelType) => void;
}

export default function ChooseModelType({ onSelect }: ChooseModelTypeProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t('settings.wizard.chooseModel', 'Choose Model')}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('cloud')}
          className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-muted"
        >
          <Cloud className="h-8 w-8 text-primary" />
          <div className="text-center">
            <div className="font-medium text-foreground">
              {t('settings.wizard.cloud', 'Cloud')}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t('settings.wizard.cloudDescription', 'Use AI models from cloud providers')}
            </div>
          </div>
        </button>
        <button
          onClick={() => onSelect('local')}
          className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-muted"
        >
          <HardDrive className="h-8 w-8 text-primary" />
          <div className="text-center">
            <div className="font-medium text-foreground">
              {t('settings.wizard.local', 'Local')}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t('settings.wizard.localDescription', 'Use Ollama on your machine')}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/ChooseModelType.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/settings/ChooseModelType.tsx apps/desktop/__tests__/integration/renderer/components/settings/ChooseModelType.test.tsx
git commit -m "feat: add ChooseModelType wizard step component"
```

---

## Task 4: Create SelectProvider Step Component

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/settings/SelectProvider.tsx`
- Create: `apps/desktop/__tests__/integration/renderer/components/settings/SelectProvider.test.tsx`

**Step 1: Write the failing test**

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

import SelectProvider from '@/components/layout/settings/SelectProvider';

describe('SelectProvider', () => {
  it('should render all four providers', () => {
    render(<SelectProvider onSelect={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Google AI')).toBeInTheDocument();
    expect(screen.getByText('xAI (Grok)')).toBeInTheDocument();
  });

  it('should call onSelect with provider id when clicked', () => {
    const onSelect = vi.fn();
    render(<SelectProvider onSelect={onSelect} onBack={vi.fn()} />);

    fireEvent.click(screen.getByText('Anthropic'));

    expect(onSelect).toHaveBeenCalledWith('anthropic');
  });

  it('should call onBack when Back button is clicked', () => {
    const onBack = vi.fn();
    render(<SelectProvider onSelect={vi.fn()} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/SelectProvider.test.tsx`

Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
'use client';

import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { API_KEY_PROVIDERS, type ProviderId } from './types';

interface SelectProviderProps {
  onSelect: (providerId: ProviderId) => void;
  onBack: () => void;
}

export default function SelectProvider({ onSelect, onBack }: SelectProviderProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t('settings.wizard.selectProvider', 'Select Provider')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {API_KEY_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onSelect(provider.id)}
            className="rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary hover:bg-muted"
          >
            <div className="font-medium text-foreground">{provider.name}</div>
          </button>
        ))}
      </div>
      <div className="flex justify-start pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('settings.wizard.back', 'Back')}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/SelectProvider.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/settings/SelectProvider.tsx apps/desktop/__tests__/integration/renderer/components/settings/SelectProvider.test.tsx
git commit -m "feat: add SelectProvider wizard step component"
```

---

## Task 5: Create AddApiKey Step Component

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/settings/AddApiKey.tsx`
- Create: `apps/desktop/__tests__/integration/renderer/components/settings/AddApiKey.test.tsx`

**Step 1: Write the failing test**

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockValidateApiKeyForProvider = vi.fn();
const mockAddApiKey = vi.fn();

vi.mock('@/lib/accomplish', () => ({
  getAccomplish: () => ({
    validateApiKeyForProvider: mockValidateApiKeyForProvider,
    addApiKey: mockAddApiKey,
  }),
}));

vi.mock('@/lib/analytics', () => ({
  analytics: { trackSaveApiKey: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

import AddApiKey from '@/components/layout/settings/AddApiKey';

describe('AddApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateApiKeyForProvider.mockResolvedValue({ valid: true });
    mockAddApiKey.mockResolvedValue({ id: '1', provider: 'anthropic', keyPrefix: 'sk-ant-...' });
  });

  it('should render provider name in title', () => {
    render(<AddApiKey providerId="anthropic" onSuccess={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByText(/anthropic/i)).toBeInTheDocument();
  });

  it('should render API key input with correct placeholder', () => {
    render(<AddApiKey providerId="anthropic" onSuccess={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByPlaceholderText('sk-ant-...')).toBeInTheDocument();
  });

  it('should call onSuccess after valid key is saved', async () => {
    const onSuccess = vi.fn();
    render(<AddApiKey providerId="anthropic" onSuccess={onSuccess} onBack={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('sk-ant-...'), { target: { value: 'sk-ant-test123' } });
    fireEvent.click(screen.getByRole('button', { name: /validate/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show error for invalid key format', async () => {
    render(<AddApiKey providerId="anthropic" onSuccess={vi.fn()} onBack={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('sk-ant-...'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: /validate/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid api key format/i)).toBeInTheDocument();
    });
  });

  it('should call onBack when Back button is clicked', () => {
    const onBack = vi.fn();
    render(<AddApiKey providerId="anthropic" onSuccess={vi.fn()} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/AddApiKey.test.tsx`

Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
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
          onClick={onBack}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('settings.wizard.back', 'Back')}
        </button>
        <button
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/AddApiKey.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/settings/AddApiKey.tsx apps/desktop/__tests__/integration/renderer/components/settings/AddApiKey.test.tsx
git commit -m "feat: add AddApiKey wizard step component"
```

---

## Task 6: Create SelectModel Step Component

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/settings/SelectModel.tsx`
- Create: `apps/desktop/__tests__/integration/renderer/components/settings/SelectModel.test.tsx`

**Step 1: Write the failing test**

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockSetSelectedModel = vi.fn();

vi.mock('@/lib/accomplish', () => ({
  getAccomplish: () => ({
    setSelectedModel: mockSetSelectedModel,
  }),
}));

vi.mock('@/lib/analytics', () => ({
  analytics: { trackSelectModel: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

import SelectModel from '@/components/layout/settings/SelectModel';

describe('SelectModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetSelectedModel.mockResolvedValue(undefined);
  });

  it('should render model dropdown for selected provider', () => {
    render(<SelectModel providerId="anthropic" onDone={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should call onDone with model name after selection', async () => {
    const onDone = vi.fn();
    render(<SelectModel providerId="anthropic" onDone={onDone} onBack={vi.fn()} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'anthropic/claude-sonnet-4-5' } });
    fireEvent.click(screen.getByRole('button', { name: /done/i }));

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled();
    });
  });

  it('should call onBack when Back button is clicked', () => {
    const onBack = vi.fn();
    render(<SelectModel providerId="anthropic" onDone={vi.fn()} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/SelectModel.test.tsx`

Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { getAccomplish } from '@/lib/accomplish';
import { analytics } from '@/lib/analytics';
import { DEFAULT_PROVIDERS } from '@accomplish/shared';
import type { ProviderId } from './types';

interface SelectModelProps {
  providerId: ProviderId;
  onDone: (modelName: string) => void;
  onBack: () => void;
}

export default function SelectModel({ providerId, onDone, onBack }: SelectModelProps) {
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const provider = DEFAULT_PROVIDERS.find((p) => p.id === providerId);
  const models = provider?.models || [];

  const handleDone = async () => {
    if (!selectedModel) return;

    setIsSaving(true);
    try {
      const accomplish = getAccomplish();
      const model = models.find((m) => m.fullId === selectedModel);

      await accomplish.setSelectedModel({
        provider: providerId,
        model: selectedModel,
      });

      analytics.trackSelectModel(model?.displayName || selectedModel);
      onDone(model?.displayName || selectedModel);
    } catch (err) {
      console.error('Failed to save model:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t('settings.wizard.selectModel', 'Select Model')}
      </h2>
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="" disabled>
          {t('settings.model.selectModel', 'Select a model...')}
        </option>
        {models.map((model) => (
          <option key={model.fullId} value={model.fullId}>
            {model.displayName}
          </option>
        ))}
      </select>
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('settings.wizard.back', 'Back')}
        </button>
        <button
          onClick={handleDone}
          disabled={!selectedModel || isSaving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? t('settings.model.saving', 'Saving...') : t('settings.wizard.done', 'Done')}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/SelectModel.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/settings/SelectModel.tsx apps/desktop/__tests__/integration/renderer/components/settings/SelectModel.test.tsx
git commit -m "feat: add SelectModel wizard step component"
```

---

## Task 7: Create OllamaSetup Step Component

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/settings/OllamaSetup.tsx`
- Create: `apps/desktop/__tests__/integration/renderer/components/settings/OllamaSetup.test.tsx`

**Step 1: Write the failing test**

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockTestOllamaConnection = vi.fn();
const mockSetOllamaConfig = vi.fn();
const mockSetSelectedModel = vi.fn();

vi.mock('@/lib/accomplish', () => ({
  getAccomplish: () => ({
    testOllamaConnection: mockTestOllamaConnection,
    setOllamaConfig: mockSetOllamaConfig,
    setSelectedModel: mockSetSelectedModel,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

import OllamaSetup from '@/components/layout/settings/OllamaSetup';

describe('OllamaSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTestOllamaConnection.mockResolvedValue({
      success: true,
      models: [{ id: 'llama3', displayName: 'Llama 3', size: 4000000000 }],
    });
    mockSetOllamaConfig.mockResolvedValue(undefined);
    mockSetSelectedModel.mockResolvedValue(undefined);
  });

  it('should render Ollama URL input', () => {
    render(<OllamaSetup onDone={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByPlaceholderText('http://localhost:11434')).toBeInTheDocument();
  });

  it('should render Test button', () => {
    render(<OllamaSetup onDone={vi.fn()} onBack={vi.fn()} />);

    expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument();
  });

  it('should show models after successful connection test', async () => {
    render(<OllamaSetup onDone={vi.fn()} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /test/i }));

    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    });
  });

  it('should call onBack when Back button is clicked', () => {
    const onBack = vi.fn();
    render(<OllamaSetup onDone={vi.fn()} onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(onBack).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/OllamaSetup.test.tsx`

Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { getAccomplish } from '@/lib/accomplish';

interface OllamaModel {
  id: string;
  displayName: string;
  size: number;
}

interface OllamaSetupProps {
  onDone: (modelName: string) => void;
  onBack: () => void;
}

export default function OllamaSetup({ onDone, onBack }: OllamaSetupProps) {
  const { t } = useTranslation();
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [testingOllama, setTestingOllama] = useState(false);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState('');
  const [savingOllama, setSavingOllama] = useState(false);

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const handleTestOllama = async () => {
    const accomplish = getAccomplish();
    setTestingOllama(true);
    setOllamaError(null);
    setOllamaConnected(false);
    setOllamaModels([]);

    try {
      const result = await accomplish.testOllamaConnection(ollamaUrl);
      if (result.success && result.models) {
        setOllamaConnected(true);
        setOllamaModels(result.models);
        if (result.models.length > 0) {
          setSelectedOllamaModel(result.models[0].id);
        }
      } else {
        setOllamaError(result.error || 'Connection failed');
      }
    } catch (err) {
      setOllamaError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setTestingOllama(false);
    }
  };

  const handleSaveOllama = async () => {
    const accomplish = getAccomplish();
    setSavingOllama(true);

    try {
      await accomplish.setOllamaConfig({
        baseUrl: ollamaUrl,
        enabled: true,
        lastValidated: Date.now(),
        models: ollamaModels,
      });

      await accomplish.setSelectedModel({
        provider: 'ollama',
        model: `ollama/${selectedOllamaModel}`,
        baseUrl: ollamaUrl,
      });

      onDone(selectedOllamaModel);
    } catch (err) {
      setOllamaError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingOllama(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">
        {t('settings.model.localModels', 'Local Models')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t('settings.model.localDescription', 'Connect to a local Ollama server to use models running on your machine.')}
      </p>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-foreground">
          {t('settings.model.ollamaUrl', 'Ollama Server URL')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={ollamaUrl}
            onChange={(e) => {
              setOllamaUrl(e.target.value);
              setOllamaConnected(false);
              setOllamaModels([]);
            }}
            placeholder="http://localhost:11434"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={handleTestOllama}
            disabled={testingOllama}
            className="rounded-md bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80 disabled:opacity-50"
          >
            {testingOllama ? t('settings.model.testing', 'Testing...') : t('settings.model.test', 'Test')}
          </button>
        </div>
      </div>

      {ollamaConnected && (
        <div className="flex items-center gap-2 text-sm text-success">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {t('settings.model.connected', 'Connected - {{count}} model(s) available', { count: ollamaModels.length })}
        </div>
      )}

      {ollamaError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {ollamaError}
        </div>
      )}

      {ollamaConnected && ollamaModels.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            {t('settings.model.selectModelLabel', 'Select Model')}
          </label>
          <select
            value={selectedOllamaModel}
            onChange={(e) => setSelectedOllamaModel(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {ollamaModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.displayName} ({formatBytes(model.size)})
              </option>
            ))}
          </select>
        </div>
      )}

      {!ollamaConnected && !ollamaError && (
        <p className="text-sm text-muted-foreground">
          {t('settings.model.ollamaHelp', 'Make sure Ollama is installed and running, then click Test to connect.')}{' '}
          <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Ollama
          </a>
        </p>
      )}

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('settings.wizard.back', 'Back')}
        </button>
        {ollamaConnected && selectedOllamaModel && (
          <button
            onClick={handleSaveOllama}
            disabled={savingOllama}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {savingOllama ? t('settings.model.saving', 'Saving...') : t('settings.model.useThisModel', 'Use This Model')}
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/OllamaSetup.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/settings/OllamaSetup.tsx apps/desktop/__tests__/integration/renderer/components/settings/OllamaSetup.test.tsx
git commit -m "feat: add OllamaSetup wizard step component"
```

---

## Task 8: Create ApiKeysSection Component

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/settings/ApiKeysSection.tsx`
- Create: `apps/desktop/__tests__/integration/renderer/components/settings/ApiKeysSection.test.tsx`

**Step 1: Write the failing test**

```typescript
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ApiKeyConfig } from '@accomplish/shared';

const mockRemoveApiKey = vi.fn();
const mockValidateApiKeyForProvider = vi.fn();
const mockAddApiKey = vi.fn();

vi.mock('@/lib/accomplish', () => ({
  getAccomplish: () => ({
    removeApiKey: mockRemoveApiKey,
    validateApiKeyForProvider: mockValidateApiKeyForProvider,
    addApiKey: mockAddApiKey,
  }),
}));

vi.mock('@/lib/analytics', () => ({
  analytics: { trackSaveApiKey: vi.fn(), trackSelectProvider: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

import ApiKeysSection from '@/components/layout/settings/ApiKeysSection';

describe('ApiKeysSection', () => {
  const savedKeys: ApiKeyConfig[] = [
    { id: 'key-1', provider: 'anthropic', keyPrefix: 'sk-ant-...' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoveApiKey.mockResolvedValue(undefined);
    mockValidateApiKeyForProvider.mockResolvedValue({ valid: true });
    mockAddApiKey.mockResolvedValue({ id: '2', provider: 'openai', keyPrefix: 'sk-...' });
  });

  it('should render section title', () => {
    render(<ApiKeysSection savedKeys={savedKeys} onKeysChange={vi.fn()} />);

    expect(screen.getByText('API Keys')).toBeInTheDocument();
  });

  it('should render saved keys', () => {
    render(<ApiKeysSection savedKeys={savedKeys} onKeysChange={vi.fn()} />);

    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('sk-ant-...')).toBeInTheDocument();
  });

  it('should render Add API Key button', () => {
    render(<ApiKeysSection savedKeys={savedKeys} onKeysChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /add api key/i })).toBeInTheDocument();
  });

  it('should show add form when Add API Key is clicked', () => {
    render(<ApiKeysSection savedKeys={savedKeys} onKeysChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /add api key/i }));

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/ApiKeysSection.test.tsx`

Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { getAccomplish } from '@/lib/accomplish';
import { analytics } from '@/lib/analytics';
import type { ApiKeyConfig } from '@accomplish/shared';
import { API_KEY_PROVIDERS, type ProviderId } from './types';

interface ApiKeysSectionProps {
  savedKeys: ApiKeyConfig[];
  onKeysChange: (keys: ApiKeyConfig[]) => void;
}

export default function ApiKeysSection({ savedKeys, onKeysChange }: ApiKeysSectionProps) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [provider, setProvider] = useState<ProviderId>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  const handleSaveApiKey = async () => {
    const accomplish = getAccomplish();
    const trimmedKey = apiKey.trim();
    const currentProvider = API_KEY_PROVIDERS.find((p) => p.id === provider)!;

    if (!trimmedKey) {
      setError('Please enter an API key.');
      return;
    }

    if (!trimmedKey.startsWith(currentProvider.prefix)) {
      setError(`Invalid API key format. Key should start with ${currentProvider.prefix}`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const validation = await accomplish.validateApiKeyForProvider(provider, trimmedKey);
      if (!validation.valid) {
        setError(validation.error || 'Invalid API key');
        setIsSaving(false);
        return;
      }

      const savedKey = await accomplish.addApiKey(provider, trimmedKey);
      analytics.trackSaveApiKey(currentProvider.name);
      setApiKey('');
      setShowAddForm(false);

      const filtered = savedKeys.filter((k) => k.provider !== savedKey.provider);
      onKeysChange([...filtered, savedKey]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    const accomplish = getAccomplish();
    try {
      await accomplish.removeApiKey(id);
      onKeysChange(savedKeys.filter((k) => k.id !== id));
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  };

  return (
    <section>
      <h2 className="mb-4 text-base font-medium text-foreground">API Keys</h2>
      <div className="rounded-lg border border-border bg-card p-5">
        {savedKeys.length > 0 && (
          <div className="space-y-2 mb-4">
            {savedKeys.map((key) => {
              const providerConfig = API_KEY_PROVIDERS.find((p) => p.id === key.provider);
              return (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <span className="text-xs font-bold text-primary">
                        {providerConfig?.name.charAt(0) || key.provider.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {providerConfig?.name || key.provider}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {key.keyPrefix}
                      </div>
                    </div>
                  </div>
                  {keyToDelete === key.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t('settings.apiKey.deleteConfirm')}</span>
                      <button
                        onClick={() => {
                          handleDeleteApiKey(key.id);
                          setKeyToDelete(null);
                        }}
                        className="rounded px-2 py-1 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('common.yes')}
                      </button>
                      <button
                        onClick={() => setKeyToDelete(null)}
                        className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80"
                      >
                        {t('common.no')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setKeyToDelete(key.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title={t('settings.apiKey.removeTitle')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showAddForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Add New API Key</span>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {API_KEY_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    analytics.trackSelectProvider(p.name);
                    setProvider(p.id);
                  }}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    provider === p.id
                      ? 'border-primary bg-muted'
                      : 'border-border hover:border-ring'
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">{p.name}</div>
                </button>
              ))}
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={API_KEY_PROVIDERS.find((p) => p.id === provider)?.placeholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={handleSaveApiKey}
              disabled={isSaving}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? t('settings.apiKey.saving') : t('settings.apiKey.saveButton')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add API Key
          </button>
        )}
      </div>
    </section>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/settings/ApiKeysSection.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/settings/ApiKeysSection.tsx apps/desktop/__tests__/integration/renderer/components/settings/ApiKeysSection.test.tsx
git commit -m "feat: add ApiKeysSection component"
```

---

## Task 9: Create Index File for Settings Components

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/settings/index.ts`

**Step 1: Create the index file**

```typescript
export { default as ChooseModelType } from './ChooseModelType';
export { default as SelectProvider } from './SelectProvider';
export { default as AddApiKey } from './AddApiKey';
export { default as SelectModel } from './SelectModel';
export { default as OllamaSetup } from './OllamaSetup';
export { default as ApiKeysSection } from './ApiKeysSection';
export * from './types';
```

**Step 2: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/settings/index.ts
git commit -m "feat: add index file for settings components"
```

---

## Task 10: Refactor SettingsDialog to Use Wizard Components

**Files:**
- Modify: `apps/desktop/src/renderer/components/layout/SettingsDialog.tsx`

**Step 1: Refactor SettingsDialog**

Replace the entire content of `SettingsDialog.tsx` with the new wizard-based implementation:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAccomplish } from '@/lib/accomplish';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Globe } from 'lucide-react';
import type { ApiKeyConfig, SelectedModel } from '@accomplish/shared';
import logoImage from '/assets/logo.png';
import {
  ChooseModelType,
  SelectProvider,
  AddApiKey,
  SelectModel,
  OllamaSetup,
  ApiKeysSection,
  type WizardStep,
  type ModelType,
  type ProviderId,
} from './settings';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySaved?: () => void;
}

export default function SettingsDialog({ open, onOpenChange, onApiKeySaved }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('choose-type');
  const [selectedModelType, setSelectedModelType] = useState<ModelType>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);

  // Data state
  const [savedKeys, setSavedKeys] = useState<ApiKeyConfig[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [loadingDebug, setLoadingDebug] = useState(true);
  const [appVersion, setAppVersion] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset wizard when dialog closes
      setWizardStep('choose-type');
      setSelectedModelType(null);
      setSelectedProvider(null);
      setCompletionMessage(null);
      return;
    }

    const accomplish = getAccomplish();

    const fetchKeys = async () => {
      try {
        const keys = await accomplish.getApiKeys();
        setSavedKeys(keys);
      } catch (err) {
        console.error('Failed to fetch API keys:', err);
      } finally {
        setLoadingKeys(false);
      }
    };

    const fetchDebugSetting = async () => {
      try {
        const enabled = await accomplish.getDebugMode();
        setDebugMode(enabled);
      } catch (err) {
        console.error('Failed to fetch debug setting:', err);
      } finally {
        setLoadingDebug(false);
      }
    };

    const fetchVersion = async () => {
      try {
        const version = await accomplish.getVersion();
        setAppVersion(version);
      } catch (err) {
        console.error('Failed to fetch version:', err);
      }
    };

    const fetchLanguage = async () => {
      try {
        const language = await accomplish.getLanguage();
        setCurrentLanguage(language);
      } catch (err) {
        console.error('Failed to fetch language:', err);
      }
    };

    fetchKeys();
    fetchDebugSetting();
    fetchVersion();
    fetchLanguage();
  }, [open]);

  const handleDebugToggle = async () => {
    const accomplish = getAccomplish();
    const newValue = !debugMode;
    setDebugMode(newValue);
    try {
      await accomplish.setDebugMode(newValue);
    } catch (err) {
      console.error('Failed to save debug setting:', err);
      setDebugMode(!newValue);
    }
  };

  const handleLanguageChange = async (language: string) => {
    const accomplish = getAccomplish();
    try {
      await accomplish.setLanguage(language);
      setCurrentLanguage(language);
      i18n.changeLanguage(language);
    } catch (err) {
      console.error('Failed to save language setting:', err);
    }
  };

  // Wizard navigation handlers
  const handleModelTypeSelect = (type: ModelType) => {
    setSelectedModelType(type);
    if (type === 'cloud') {
      setWizardStep('select-provider');
    } else {
      setWizardStep('ollama-setup');
    }
  };

  const handleProviderSelect = (providerId: ProviderId) => {
    setSelectedProvider(providerId);
    // Check if API key exists for this provider
    const hasKey = savedKeys.some((k) => k.provider === providerId);
    if (hasKey) {
      setWizardStep('select-model');
    } else {
      setWizardStep('add-api-key');
    }
  };

  const handleApiKeySuccess = async () => {
    // Refresh keys
    const accomplish = getAccomplish();
    const keys = await accomplish.getApiKeys();
    setSavedKeys(keys);
    onApiKeySaved?.();
    setWizardStep('select-model');
  };

  const handleModelDone = (modelName: string) => {
    setCompletionMessage(t('settings.wizard.modelSetTo', 'Model set to {{model}}', { model: modelName }));
    // Close dialog after brief delay
    setTimeout(() => {
      onOpenChange(false);
    }, 1500);
  };

  const handleBack = () => {
    switch (wizardStep) {
      case 'select-provider':
        setWizardStep('choose-type');
        setSelectedModelType(null);
        break;
      case 'add-api-key':
        setWizardStep('select-provider');
        setSelectedProvider(null);
        break;
      case 'select-model':
        // Go back to provider if they came from add-api-key, otherwise to provider selection
        setWizardStep('select-provider');
        setSelectedProvider(null);
        break;
      case 'ollama-setup':
        setWizardStep('choose-type');
        setSelectedModelType(null);
        break;
    }
  };

  const renderWizardStep = () => {
    if (completionMessage) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="mb-2 text-success">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-foreground">{completionMessage}</p>
          </div>
        </div>
      );
    }

    switch (wizardStep) {
      case 'choose-type':
        return <ChooseModelType onSelect={handleModelTypeSelect} />;
      case 'select-provider':
        return <SelectProvider onSelect={handleProviderSelect} onBack={handleBack} />;
      case 'add-api-key':
        return selectedProvider ? (
          <AddApiKey providerId={selectedProvider} onSuccess={handleApiKeySuccess} onBack={handleBack} />
        ) : null;
      case 'select-model':
        return selectedProvider ? (
          <SelectModel providerId={selectedProvider} onDone={handleModelDone} onBack={handleBack} />
        ) : null;
      case 'ollama-setup':
        return <OllamaSetup onDone={handleModelDone} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 mt-4">
          {/* Wizard Section */}
          <section>
            <div className="rounded-lg border border-border bg-card p-5">
              {renderWizardStep()}
            </div>
          </section>

          {/* API Keys Section */}
          <ApiKeysSection
            savedKeys={savedKeys}
            onKeysChange={(keys) => {
              setSavedKeys(keys);
              onApiKeySaved?.();
            }}
          />

          {/* Language Selection Section */}
          <section>
            <h2 className="mb-4 text-base font-medium text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('settings.language.title')}
            </h2>
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                {t('settings.language.description')}
              </p>
              <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </section>

          {/* Developer Section */}
          <section>
            <h2 className="mb-4 text-base font-medium text-foreground">{t('settings.developer.title', 'Developer')}</h2>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-foreground">{t('settings.debug.title')}</div>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {t('settings.debug.description')}
                  </p>
                </div>
                <div className="ml-4">
                  {loadingDebug ? (
                    <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
                  ) : (
                    <button
                      data-testid="settings-debug-toggle"
                      onClick={handleDebugToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        debugMode ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          debugMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
              {debugMode && (
                <div className="mt-4 rounded-xl bg-warning/10 p-3.5">
                  <p className="text-sm text-warning">
                    Debug mode is enabled. Backend logs will appear in the task view when running tasks.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* About Section */}
          <section>
            <h2 className="mb-4 text-base font-medium text-foreground">{t('settings.about.title')}</h2>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-4">
                <img src={logoImage} alt="Openwork" className="h-12 w-12 rounded-xl" />
                <div>
                  <div className="font-medium text-foreground">Openwork</div>
                  <div className="text-sm text-muted-foreground">Version {appVersion || '0.1.0'}</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Openwork is a local computer-use AI agent for your Mac that reads your files, creates documents, and automates repetitive knowledge work—all open-source with your AI models of choice.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Any questions or feedback?{' '}
                <a href="mailto:openwork-support@accomplish.ai" className="text-primary hover:underline">
                  Click here to contact us
                </a>.
              </p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Run existing tests to verify nothing breaks**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx`

Expected: Some tests may fail due to changed structure - update tests in next task

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/components/layout/SettingsDialog.tsx
git commit -m "feat: refactor SettingsDialog to use wizard flow"
```

---

## Task 11: Update SettingsDialog Integration Tests

**Files:**
- Modify: `apps/desktop/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx`

**Step 1: Update tests for new wizard structure**

Update the test file to test the new wizard flow. Key changes:
- Test wizard step navigation
- Test Cloud/Local selection
- Test provider selection flow
- Keep existing tests for API keys, debug mode, about section

```typescript
// Add new describe block for wizard navigation
describe('wizard navigation', () => {
  it('should show Choose Model step initially', async () => {
    render(<SettingsDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Choose Model')).toBeInTheDocument();
      expect(screen.getByText('Cloud')).toBeInTheDocument();
      expect(screen.getByText('Local')).toBeInTheDocument();
    });
  });

  it('should navigate to Select Provider when Cloud is clicked', async () => {
    render(<SettingsDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Cloud')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cloud'));

    await waitFor(() => {
      expect(screen.getByText('Select Provider')).toBeInTheDocument();
    });
  });

  it('should navigate to Ollama Setup when Local is clicked', async () => {
    render(<SettingsDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Local')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Local'));

    await waitFor(() => {
      expect(screen.getByText('Local Models')).toBeInTheDocument();
    });
  });

  it('should navigate back when Back button is clicked', async () => {
    render(<SettingsDialog {...defaultProps} />);

    // Go to provider selection
    await waitFor(() => {
      expect(screen.getByText('Cloud')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Cloud'));

    await waitFor(() => {
      expect(screen.getByText('Select Provider')).toBeInTheDocument();
    });

    // Go back
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    await waitFor(() => {
      expect(screen.getByText('Choose Model')).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `pnpm -F @accomplish/desktop test -- --run apps/desktop/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx`

Expected: PASS

**Step 3: Commit**

```bash
git add apps/desktop/__tests__/integration/renderer/components/SettingsDialog.integration.test.tsx
git commit -m "test: update SettingsDialog tests for wizard flow"
```

---

## Task 12: Run Full Test Suite and Fix Issues

**Step 1: Run all tests**

Run: `pnpm -F @accomplish/desktop test`

**Step 2: Fix any failing tests**

Address any test failures found.

**Step 3: Run typecheck**

Run: `pnpm typecheck`

**Step 4: Run lint**

Run: `pnpm lint`

**Step 5: Fix any issues found**

**Step 6: Final commit**

```bash
git add -A
git commit -m "fix: address test and lint issues from settings wizard refactor"
```

---

## Summary

This plan transforms the settings dialog into a wizard flow with:

1. **New Components:** 6 new step components + 1 shared types file
2. **Translations:** New i18n keys for wizard text
3. **Refactored Dialog:** SettingsDialog now orchestrates wizard navigation
4. **Updated Tests:** Tests cover new wizard flow

Total commits: ~12 incremental commits following TDD approach.
