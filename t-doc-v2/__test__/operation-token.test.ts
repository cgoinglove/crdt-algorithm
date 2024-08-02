import { describe, it, expect } from 'vitest';
import { OperationToken } from '../src';

describe('OperationToken', () => {
  it('should create an OperationToken using gen method', () => {
    const node = {
      id: 1,
      content: 'test content',
      author: 'test author',
    };
    const type = 'insert';
    const operationToken = OperationToken.gen(type, node);

    expect(operationToken.type).toBe(type);
    expect(operationToken.node).toEqual(node);
    expect(typeof operationToken.timestamp).toBe('number');
  });

  it('should convert an OperationToken to a hash and back', () => {
    const node = {
      id: 1,
      content: 'test content',
      author: 'test author',
    };
    const type = 'update';
    const operationToken = OperationToken.gen(type, node);
    const hash = operationToken.hash();

    const newOperationToken = OperationToken.fromHash(hash);
    expect(newOperationToken.type).toBe(operationToken.type);
    expect(newOperationToken.node).toEqual(operationToken.node);
    expect(newOperationToken.timestamp).toBe(operationToken.timestamp);
  });

  it('should handle different operation types', () => {
    const types: Operation['type'][] = ['insert', 'remove', 'update'];

    types.forEach(type => {
      const node = {
        id: 1,
        content: 'content',
        author: 'author',
      };
      const operationToken = OperationToken.gen(type, node);
      expect(operationToken.type).toBe(type);
    });
  });
});
