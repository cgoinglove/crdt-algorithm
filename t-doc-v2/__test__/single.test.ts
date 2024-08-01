import { describe, it, expect, beforeEach } from 'vitest';
import { CommitHandler, DocumentTree, OID, OperationToken } from '../src';

describe('DocumentTree', () => {
  let docTree: DocumentTree;
  let commitHandler: CommitHandler;
  let operationsCommitted: OperationToken[];

  beforeEach(() => {
    operationsCommitted = [];
    commitHandler = async (operations: OperationToken[]) => {
      operationsCommitted.push(...operations);
    };
    docTree = new DocumentTree(1, commitHandler);
  });

  it('should insert an item as the root if no root exists', () => {
    const id = docTree.insert('Hello');
    expect(docTree.stringify()).toBe('Hello');
    expect(docTree.root?.id).toEqual(id);
  });

  it('should insert an item to the right of the root', () => {
    const rootId = docTree.insert('Hello');
    const id = docTree.insert('World', rootId);
    expect(docTree.stringify()).toBe('HelloWorld');
  });

  it('should remove an item and update the tree structure', () => {
    const rootId = docTree.insert('Hello');
    const id = docTree.insert('World', rootId);
    docTree.remove(id);
    expect(docTree.stringify()).toBe('Hello');
  });

  it('should correctly insert item between existing nodes', () => {
    const rootId = docTree.insert('Hello');
    const A = docTree.insert('World', rootId);
    expect(docTree.stringify()).toBe('HelloWorld');
    const space = docTree.insert(' ', rootId);
    expect(docTree.stringify()).toBe('Hello World');
  });

  it('should commit pending operations', async () => {
    const id = docTree.insert('Hello');
    await docTree.commit();
    expect(operationsCommitted.length).toBe(1);
    expect(operationsCommitted[0].type).toBe('insert');
    expect(operationsCommitted[0].id).toEqual(id);
    expect(operationsCommitted[0].content).toBe('Hello');
  });

  it('should merge insert operations correctly', () => {
    const token = OperationToken.of('insert', [2, 0], undefined, 'Hello');
    docTree.merge(token);
    expect(docTree.stringify()).toBe('Hello');
  });

  it('should merge remove operations correctly', () => {
    const rootId = docTree.insert('Hello');
    const token = OperationToken.of('remove', rootId);
    docTree.merge(token);
    expect(docTree.stringify()).toBe('');
  });

  it('should handle concurrent inserts', () => {
    const id1 = docTree.insert('Hello');
    const id2 = docTree.insert('World', id1);
    expect(docTree.stringify()).toBe('HelloWorld');
  });

  it('should generate and parse hash correctly', () => {
    const token = OperationToken.of('insert', [1, 2], undefined, 'Hello');
    const hash = token.hash();
    const parsedToken = OperationToken.fromHash(hash);
    expect(parsedToken.type).toBe(token.type);
    expect(parsedToken.id).toEqual(token.id);
    expect(parsedToken.content).toBe(token.content);
  });
});
