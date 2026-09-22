import { toCategory } from '../../data/mappers/category.mapper';
import { Category, canDelete, possibleParents } from './category';

const drinks = toCategory({
  id: 'd',
  name: 'Boissons',
  description: null,
  parentId: null,
  parentName: null,
  productCount: 0,
  version: 0,
});
const juices = toCategory({
  id: 'j',
  name: 'Jus',
  description: null,
  parentId: 'd',
  parentName: 'Boissons',
  productCount: 3,
  version: 0,
});
const food = toCategory({
  id: 'f',
  name: 'Épicerie',
  description: null,
  parentId: null,
  parentName: null,
  productCount: 0,
  version: 0,
});
const all: Category[] = [drinks, juices, food];

describe('category tree rules', () => {
  it('derives the level from the parent', () => {
    expect(drinks.level).toBe(1);
    expect(juices.level).toBe(2);
  });

  it('offers only other root categories as parents, and none to a parent', () => {
    expect(possibleParents(all, null).map((c) => c.id)).toEqual(['d', 'f']);
    expect(possibleParents(all, food).map((c) => c.id)).toEqual(['d']);
    expect(possibleParents(all, drinks)).toEqual([]);
  });

  it('only lets empty categories be deleted', () => {
    expect(canDelete(all, food)).toBe(true);
    expect(canDelete(all, juices)).toBe(false);
    expect(canDelete(all, drinks)).toBe(false);
  });
});
