import { beforeEach, describe, expect, it } from 'vitest';
import { DocumentTree } from '../src';

describe('DocumentTree Merging', () => {
  let doc1: DocumentTree;
  let doc2: DocumentTree;

  beforeEach(() => {
    doc1 = new DocumentTree(1);
    doc2 = new DocumentTree(2);
  });

  it('should merge operations from different instances correctly', () => {
    const rootId1 = doc1.insert('Root');
    const id1 = doc1.insert('A', rootId1);

    const rootId2 = doc2.insert('Root');
    const id2 = doc2.insert('B', rootId2);

    // Simulate sending operations from doc1 to doc2
    const operationsFromDoc1 = doc1.pendingOperations.slice();
    doc2.merge(operationsFromDoc1);

    // Simulate sending operations from doc2 to doc1
    const operationsFromDoc2 = doc2.pendingOperations.slice();
    doc1.merge(operationsFromDoc2);

    expect(doc1.stringify()).toBe('RootAB');
    expect(doc2.stringify()).toBe('RootAB');
  });
});
