import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, testMeta } from '@/test/utils';
import { ModuleGate } from './guards';
import { isModuleEnabled } from './modules';

function renderGate(module: 'records' | 'files', modules: string[]) {
  renderWithProviders(
    <Routes>
      <Route element={<ModuleGate module={module} titleKey={`items.${module}`} />}>
        <Route path="/x" element={<p>module screen</p>} />
      </Route>
    </Routes>,
    { route: '/x', meta: { ...testMeta, modules } },
  );
}

describe('ModuleGate', () => {
  it('renders an implemented, enabled module', () => {
    renderGate('records', ['identity', 'data']);
    expect(screen.getByText('module screen')).toBeInTheDocument();
  });

  it('shows "module not enabled" instead of data when the server lacks the module', () => {
    renderGate('records', ['identity']);
    expect(screen.queryByText('module screen')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getAllByText('data').length).toBeGreaterThan(0);
  });

  it('explains that an enabled module has no Studio screen yet', () => {
    renderGate('files', ['storage']);
    expect(screen.queryByText('module screen')).not.toBeInTheDocument();
    expect(screen.getAllByText('storage').length).toBeGreaterThan(0);
  });

  it('matches module ids case-insensitively', () => {
    expect(isModuleEnabled(['DATA'], 'records')).toBe(true);
    expect(isModuleEnabled(undefined, 'records')).toBe(false);
    expect(isModuleEnabled(['events'], 'webhooks')).toBe(true);
  });
});
