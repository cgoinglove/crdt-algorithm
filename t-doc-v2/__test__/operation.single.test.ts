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
    docOperator = new DocumentOperator('test-client');
  });

  it('should generate a new node using gen method', () => {
    const content = 'Hello World';
    const node = docOperator.gen(content);

    expect(node).toBeDefined();
    expect(node.content).toBe(content);
    expect(node.author).toBe('test-client');
  });

  it('should insert a node into the document', () => {
    const node: Node = {
      id: 1,
      content: 'Hello',
      author: 'test-client',
    };

    docOperator.insert(node);

    const storedNode = docOperator.document.get(node.id);
    expect(storedNode).toBeDefined();
    expect(docOperator.stringify()).toBe(node.content);
    expect(storedNode!.author).toBe(node.author);
    expect(docOperator.pendingOperations).toHaveLength(1);
    expect(docOperator.pendingOperations[0].type).toBe('insert');
  });

  it('should update a node in the document', () => {
    const node: Node = {
      id: 1,
      content: 'Hello',
      author: 'test-client',
    };

    docOperator.insert(node);

    const updatedNode: Node = {
      ...node,
      content: 'Hello World',
    };

    docOperator.update(updatedNode);

    const storedNode = docOperator.document.get(node.id);
    expect(storedNode!.content).toBe('Hello World');
    expect(docOperator.pendingOperations).toHaveLength(2);
    expect(docOperator.pendingOperations[1].type).toBe('update');
    expect(docOperator.stringify()).toBe('Hello World');
  });

  it('should throw an error when updating a non-existent node', () => {
    const nonExistentNode: Node = {
      id: 999,
      content: 'Non-existent',
      author: 'test-client',
    };

    expect(() => docOperator.update(nonExistentNode)).toThrow(
      '존재하지 않는 Node 입니다.',
    );
  });

  it('should remove a node from the document', () => {
    const node: Node = {
      id: 1,
      content: 'Hello',
      author: 'test-client',
    };

    docOperator.insert(node);
    docOperator.remove(node.id);

    expect(docOperator.document.has(node.id)).toBe(false);
    expect(docOperator.pendingOperations).toHaveLength(2);
    expect(docOperator.pendingOperations[1].type).toBe('remove');
  });

  it('should throw an error when removing a non-existent node', () => {
    expect(() => docOperator.remove(999)).toThrow('존재하지 않는 Node 입니다.');
  });

  it('should split a node at a given index', () => {
    const node: Node = {
      id: 1,
      content: 'Hello World',
      author: 'test-client',
    };

    docOperator.insert(node);
    docOperator.split(node.id, 5);

    const leftNode = docOperator.document.get(node.id);
    const rightNode = docOperator.document.get(leftNode!.right!);

    expect(leftNode!.content).toBe('Hello');
    expect(rightNode!.content).toBe(' World');
    expect(docOperator.pendingOperations).toHaveLength(3); // includes insert, update, and split
  });

  it('should commit pending operations', async () => {
    const node: Node = {
      id: 1,
      content: 'Hello',
      author: 'test-client',
    };

    docOperator.insert(node);

    docOperator.commit();
    expect(docOperator.pendingOperations).toHaveLength(0);
  });

  it('should merge operations into the document', () => {
    const node: Node = {
      id: 1,
      content: 'Hello',
      author: 'another-client',
    };

    const operation = OperationToken.gen('insert', node);

    docOperator.merge(operation);

    const storedNode = docOperator.document.get(node.id);
    expect(storedNode).toBeDefined();
    expect(storedNode!.content).toBe(node.content);
  });

  it('should convert the document to a string using stringify method', () => {
    const node1: Node = {
      id: 1,
      content: 'Hello',
      author: 'test-client',
    };

    const node2: Node = {
      id: 2,
      content: ' World',
      author: 'test-client',
    };

    docOperator.insert(node1);
    docOperator.insert(node2);

    const result = docOperator.stringify();
    expect(result).toBe('Hello World');
  });
});
