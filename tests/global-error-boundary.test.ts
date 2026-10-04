import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, { jsx: true, alias: { '@': path.resolve('src') } });
const {
  GlobalErrorBoundary,
  GlobalErrorFallback,
} = jiti('../src/components/ui/global-error-boundary.tsx') as {
  GlobalErrorBoundary: typeof import('../src/components/ui/global-error-boundary').GlobalErrorBoundary;
  GlobalErrorFallback: typeof import('../src/components/ui/global-error-boundary').GlobalErrorFallback;
};

type GlobalErrorBoundaryProps = React.ComponentProps<typeof GlobalErrorBoundary>;

function createTestInstance(props: GlobalErrorBoundaryProps = { children: null }) {
  const instance = new GlobalErrorBoundary(props);
  (instance as unknown as { updater: unknown }).updater = {
    isMounted: () => true,
    enqueueSetState: (inst: { state: Record<string, unknown>; props: unknown }, partialState: unknown) => {
      const next = typeof partialState === 'function' ? partialState(inst.state, inst.props) : partialState;
      inst.state = { ...inst.state, ...next };
    },
    enqueueForceUpdate: () => {},
  };
  return instance;
}

describe('PACT OS: GlobalErrorBoundary & Fallback UI Suite', () => {
  // ==========================================
  // 1. CLASS COMPONENT & LIFECYCLE CONTRACTS
  // ==========================================
  it('1.1 GlobalErrorBoundary is a React class component extending React.Component', () => {
    assert.equal(typeof GlobalErrorBoundary, 'function');
    assert.equal(GlobalErrorBoundary.prototype instanceof React.Component, true);
  });

  it('1.2 GlobalErrorBoundary implements required Error Boundary static and instance lifecycle methods', () => {
    assert.equal(typeof GlobalErrorBoundary.getDerivedStateFromError, 'function');
    assert.equal(typeof GlobalErrorBoundary.prototype.componentDidCatch, 'function');
    assert.equal(typeof GlobalErrorBoundary.prototype.render, 'function');
  });

  // ==========================================
  // 2. ERROR STATE DERIVATION & CATCH BEHAVIOR
  // ==========================================
  it('2.1 getDerivedStateFromError derives hasError: true and retains the caught error object', () => {
    const testError = new Error('Sub-view crashed unexpectedly');
    const nextState = GlobalErrorBoundary.getDerivedStateFromError(testError);

    assert.equal(nextState.hasError, true);
    assert.equal(nextState.error, testError);
  });

  it('2.2 componentDidCatch logs error, stores errorInfo, and triggers onError callback', () => {
    let callbackTriggered = false;
    let receivedError: Error | null = null;
    let receivedErrorInfo: React.ErrorInfo | null = null;

    const props: GlobalErrorBoundaryProps = {
      children: React.createElement('div', null, 'Normal Child'),
      onError: (err, info) => {
        callbackTriggered = true;
        receivedError = err;
        receivedErrorInfo = info;
      },
    };

    const instance = createTestInstance(props);
    const mockError = new Error('Database connection failed in sub-view');
    const mockErrorInfo: React.ErrorInfo = { componentStack: '\n    at BrokenWidget\n    at SubView' };

    instance.componentDidCatch(mockError, mockErrorInfo);

    assert.equal(callbackTriggered, true, 'onError prop was called');
    assert.equal(receivedError, mockError, 'Captured correct error reference');
    assert.equal(receivedErrorInfo, mockErrorInfo, 'Captured correct errorInfo component stack');
    assert.equal(instance.state.errorInfo, mockErrorInfo, 'State updated with errorInfo');
  });

  // ==========================================
  // 3. NORMAL CHILD RENDERING (NO ERROR)
  // ==========================================
  it('3.1 Renders child views cleanly when no exception is thrown', () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        GlobalErrorBoundary,
        null,
        React.createElement('div', { id: 'protected-tasks-view' }, 'Tasks & Backlog Active View')
      )
    );

    assert.ok(markup.includes('protected-tasks-view'), 'Child ID rendered');
    assert.ok(
      markup.includes('Tasks &amp; Backlog Active View') || markup.includes('Tasks & Backlog Active View'),
      'Child text rendered'
    );
    assert.equal(markup.includes('Try Reloading'), false, 'Fallback button not rendered when healthy');
    assert.equal(markup.includes('Copy Error Stack'), false, 'Copy stack button not rendered when healthy');
  });

  // ==========================================
  // 4. FALLBACK SCREEN & ACTION CONTROLS
  // ==========================================
  it('4.1 Fallback UI renders "Try Reloading" and "Copy Error Stack" buttons with friendly diagnostics', () => {
    const testError = new Error('SyntaxError: Unexpected token in JSON payload');
    const markup = renderToStaticMarkup(
      React.createElement(GlobalErrorFallback, {
        error: testError,
        onReload: () => {},
        onCopyStack: () => {},
      })
    );

    // Verify Accessible Alert Role
    assert.ok(markup.includes('role="alert"'), 'Accessible alert container present');
    assert.ok(markup.includes('aria-live="assertive"'), 'Assertive live region configured');

    // Verify Mandatory Button Texts
    assert.ok(markup.includes('Try Reloading'), 'Includes "Try Reloading" button');
    assert.ok(markup.includes('Copy Error Stack'), 'Includes "Copy Error Stack" button');

    // Verify User-Friendly Assurance
    assert.ok(markup.includes('System State Interruption'), 'Default title rendered');
    assert.ok(markup.includes('commitments and data remain safe'), 'User assurance message rendered');

    // Verify Error Message Display
    assert.ok(markup.includes('SyntaxError: Unexpected token in JSON payload'), 'Error message displayed');
  });

  it('4.2 Displays "Copied!" when copied state is active', () => {
    const markup = renderToStaticMarkup(
      React.createElement(GlobalErrorFallback, {
        error: new Error('Network timeout'),
        copied: true,
        onReload: () => {},
        onCopyStack: () => {},
      })
    );

    assert.ok(markup.includes('Copied!'), 'Displays Copied! confirmation state');
  });

  it('4.3 Displays sub-view name when viewName prop is specified', () => {
    const markup = renderToStaticMarkup(
      React.createElement(GlobalErrorFallback, {
        error: new Error('Canvas render exception'),
        viewName: 'Focus Timer Studio',
        onReload: () => {},
        onCopyStack: () => {},
      })
    );

    assert.ok(markup.includes('Focus Timer Studio'), 'Sub-view badge visible in fallback');
  });

  // ==========================================
  // 5. CUSTOM FALLBACK SUPPORT
  // ==========================================
  it('5.1 Supports custom ReactNode fallback in GlobalErrorBoundary', () => {
    const instance = createTestInstance({
      children: React.createElement('div', null, 'Normal'),
      fallback: React.createElement('div', { id: 'custom-fallback-node' }, 'Custom Disaster Shelter'),
    });

    instance.state = {
      hasError: true,
      error: new Error('Custom Error'),
      errorInfo: null,
      copied: false,
      showDetails: false,
    };

    const rendered = instance.render();
    const markup = renderToStaticMarkup(rendered as React.ReactElement);

    assert.ok(markup.includes('custom-fallback-node'), 'Custom fallback rendered');
    assert.ok(markup.includes('Custom Disaster Shelter'), 'Custom message rendered');
  });

  it('5.2 Supports render function fallback in GlobalErrorBoundary', () => {
    const instance = createTestInstance({
      children: React.createElement('div', null, 'Normal'),
      fallback: ({ error, reset }: { error: Error | null; reset: () => void }) =>
        React.createElement(
          'button',
          { id: 'custom-reset-btn', onClick: reset },
          `Handled: ${error?.message}`
        ),
    });

    instance.state = {
      hasError: true,
      error: new Error('Functional Error Test'),
      errorInfo: null,
      copied: false,
      showDetails: false,
    };

    const rendered = instance.render();
    const markup = renderToStaticMarkup(rendered as React.ReactElement);

    assert.ok(markup.includes('custom-reset-btn'), 'Custom functional fallback rendered');
    assert.ok(markup.includes('Handled: Functional Error Test'), 'Error message passed to callback');
  });

  // ==========================================
  // 6. ACTION CONTROLS: RESET & COPY INVARIANTS
  // ==========================================
  it('6.1 handleReload resets error state and triggers onReset callback', () => {
    let resetCalled = false;
    const instance = createTestInstance({
      children: React.createElement('span', null, 'Child'),
      onReset: () => {
        resetCalled = true;
      },
    });

    instance.state = {
      hasError: true,
      error: new Error('Transient view glitch'),
      errorInfo: { componentStack: 'at Component' },
      copied: true,
      showDetails: true,
    };

    instance.handleReload();

    assert.equal(resetCalled, true, 'onReset was triggered');
    assert.equal(instance.state.hasError, false, 'hasError reset to false');
    assert.equal(instance.state.error, null, 'error cleared');
    assert.equal(instance.state.errorInfo, null, 'errorInfo cleared');
    assert.equal(instance.state.copied, false, 'copied reset');
    assert.equal(instance.state.showDetails, false, 'showDetails reset');
  });

  it('6.2 handleCopyStack formats diagnostics and updates copied state', async () => {
    const instance = createTestInstance({
      children: React.createElement('span', null, 'Child'),
    });

    instance.state = {
      hasError: true,
      error: new Error('Detailed diagnostics test'),
      errorInfo: { componentStack: '\n    at TaskTable' },
      copied: false,
      showDetails: false,
    };

    let copiedText = '';
    // Mock navigator.clipboard in test environment
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: async (text: string) => {
            copiedText = text;
          },
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      await instance.handleCopyStack();

      assert.equal(instance.state.copied, true, 'copied state set to true');
      assert.ok(copiedText.includes('Detailed diagnostics test'), 'Contains error message');
      assert.ok(copiedText.includes('TaskTable'), 'Contains component stack');
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    }
  });

  it('6.3 toggleDetails flips showDetails state back and forth', () => {
    const instance = createTestInstance({
      children: React.createElement('span', null, 'Child'),
    });

    assert.equal(instance.state.showDetails, false);
    instance.toggleDetails();
    assert.equal(instance.state.showDetails, true);
    instance.toggleDetails();
    assert.equal(instance.state.showDetails, false);
  });
});
