import { describe, it, expect, beforeEach, vi, VitestUtils } from 'vitest';
import { DocumentOperator, OperationToken } from '../src';

// Mock the createIncrement function
vi.mock('@repo/shared', () => {
  const mockIncrement = (() => {
    let id = 0;
    return () => ++id;
  })();
  return {
    createIncrement: () => mockIncrement,
  };
});

describe('DocumentOperator', () => {
  let docOperator: DocumentOperator;
  let commitHandler: ReturnType<VitestUtils['fn']>;

  beforeEach(() => {
    commitHandler = vi.fn(async (operations: OperationToken[]) => {
      // Mock commit function
    });
    docOperator = new DocumentOperator('test-client', commitHandler);
  });

  it('should insert a node into the document', () => {
    const content = 'Hello World';
    const nodeId = docOperator.insert(content);

    const node = docOperator.document.get(nodeId);
    expect(node).toBeDefined();
    expect(docOperator.stringify()).toBe(content);
    expect(node!.author).toBe('test-client');
    expect(docOperator.pendingOperations).toHaveLength(1);
    expect(docOperator.pendingOperations[0].type).toBe('insert');
  });

  it('should update a node in the document', () => {
    const content = 'Hello World';
    const nodeId = docOperator.insert(content);

    docOperator.update(nodeId, 'Updated Content');
    const node = docOperator.document.get(nodeId);
    expect(docOperator.stringify()).toBe('Updated Content');
    expect(docOperator.pendingOperations).toHaveLength(2);
    expect(docOperator.pendingOperations[1].type).toBe('update');
  });

  it('should throw an error when updating a non-existent node', () => {
    expect(() => docOperator.update(999, 'New Content')).toThrow(
      '존재하지 않는 Node 입니다.',
    );
  });

  it('should remove a node from the document', () => {
    const content = 'Hello World';
    const nodeId = docOperator.insert(content);

    docOperator.remove(nodeId);
    expect(docOperator.document.has(nodeId)).toBe(false);
    expect(docOperator.stringify()).toBe('');
    expect(docOperator.pendingOperations).toHaveLength(2);
    expect(docOperator.pendingOperations[1].type).toBe('remove');
  });

  it('should throw an error when removing a non-existent node', () => {
    expect(() => docOperator.remove(999)).toThrow('존재하지 않는 Node 입니다.');
  });

  it('should split a node at a given index', () => {
    const content = 'Hello World';
    const nodeId = docOperator.insert(content);

    docOperator.split(nodeId, 5);
    const node = docOperator.document.get(nodeId);
    const newNode = docOperator.document.get(node!.right!);

    expect(node!.content).toBe('Hello');
    expect(newNode!.content).toBe(' World');
    expect(docOperator.stringify()).toBe(content);
    expect(docOperator.pendingOperations).toHaveLength(3); // insert, update, and split as another update
  });

  it('should commit pending operations', async () => {
    const content = 'Hello World';
    docOperator.insert(content);

    await docOperator.commit();
    expect(commitHandler).toHaveBeenCalledTimes(1);
    expect(docOperator.pendingOperations).toHaveLength(0);
  });

  it.skip('should merge operations into the document', () => {
    const content = 'Hello World';
    const operation = OperationToken.gen('insert', {
      id: 1,
      content,
      author: 'test-client',
    });

    docOperator.merge(operation);

    const node = docOperator.document.get(1);
    expect(node).toBeDefined();
    expect(node!.content).toBe(content);
    expect(node!.author).toBe('test-client');
  });

  it.skip('should convert the document to a string', () => {
    docOperator.insert('Hello');
    const worldId = docOperator.insert(' World');

    const result = docOperator.stringify();
    expect(result).toBe('Hello World');
  });
});
