import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnsavedChangesModal } from '../src/components/modals/unsaved-changes-modal';

describe('UnsavedChangesModal', () => {
  it('renders the warning message and accessible dialog', () => {
    render(
      <UnsavedChangesModal
        isOpen={true}
        onConfirmDiscard={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        'You have unsaved changes. Are you sure you want to leave?',
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Discard Changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep Editing' })).toBeInTheDocument();
  });

  it('calls onConfirmDiscard when Discard Changes is clicked', async () => {
    const onConfirmDiscard = vi.fn();
    const user = userEvent.setup();

    render(
      <UnsavedChangesModal
        isOpen={true}
        onConfirmDiscard={onConfirmDiscard}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Discard Changes' }));
    expect(onConfirmDiscard).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Keep Editing is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <UnsavedChangesModal
        isOpen={true}
        onConfirmDiscard={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Escape is pressed', () => {
    const onCancel = vi.fn();

    render(
      <UnsavedChangesModal
        isOpen={true}
        onConfirmDiscard={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('moves focus into the dialog when opened', () => {
    render(
      <UnsavedChangesModal
        isOpen={true}
        onConfirmDiscard={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Keep Editing' }),
    ).toHaveFocus();
  });

  it('keeps keyboard focus within the dialog when tabbing', async () => {
    const user = userEvent.setup();

    render(
      <UnsavedChangesModal
        isOpen={true}
        onConfirmDiscard={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const keepEditing = screen.getByRole('button', { name: 'Keep Editing' });
    const discardChanges = screen.getByRole('button', { name: 'Discard Changes' });

    expect(keepEditing).toHaveFocus();

    await user.tab();
    expect(discardChanges).toHaveFocus();

    await user.tab();
    expect(keepEditing).toHaveFocus();

    await user.tab({ shift: true });
    expect(discardChanges).toHaveFocus();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <UnsavedChangesModal
        isOpen={false}
        onConfirmDiscard={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});