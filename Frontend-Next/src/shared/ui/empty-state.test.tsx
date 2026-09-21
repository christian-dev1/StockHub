import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders title, description and actions in a status region', () => {
    render(
      <EmptyState title="Aucun produit" description="Ajoutez votre premier produit">
        <button type="button">Ajouter</button>
      </EmptyState>,
    );
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Aucun produit');
    expect(region).toHaveTextContent('Ajoutez votre premier produit');
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
  });
});
