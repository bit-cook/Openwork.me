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

import AddApiKey from '@/components/layout/settings/AddApiKey';

describe('AddApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateApiKeyForProvider.mockResolvedValue({ valid: true });
    mockAddApiKey.mockResolvedValue({ id: '1', provider: 'anthropic', keyPrefix: 'sk-ant-...' });
  });

  describe('rendering', () => {
    it('should render provider name in title', () => {
      render(<AddApiKey providerId="anthropic" onSuccess={vi.fn()} onBack={vi.fn()} />);

      expect(screen.getByText(/anthropic/i)).toBeInTheDocument();
    });

    it('should render API key input with correct placeholder', () => {
      render(<AddApiKey providerId="anthropic" onSuccess={vi.fn()} onBack={vi.fn()} />);

      expect(screen.getByPlaceholderText('sk-ant-...')).toBeInTheDocument();
    });
  });

  describe('validation and saving', () => {
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
  });

  describe('navigation', () => {
    it('should call onBack when Back button is clicked', () => {
      const onBack = vi.fn();
      render(<AddApiKey providerId="anthropic" onSuccess={vi.fn()} onBack={onBack} />);

      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      expect(onBack).toHaveBeenCalled();
    });
  });
});
