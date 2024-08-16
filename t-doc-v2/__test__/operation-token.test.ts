import { describe, it, expect } from 'vitest';
import { OperationToken } from '../src';

describe('OperationToken', () => {
  it('ofInsert를 사용하여 insert 작업을 생성해야 한다', () => {
    const operation: Pick<Operation, 'content' | 'id' | 'parent'> = {
      id: ['client1', 1],
      parent: ['client0', 0],
      content: 'hello',
    };
    const token = OperationToken.ofInsert(operation);

    expect(token.type).toBe('insert');
    expect(token.id).toEqual(['client1', 1]);
    expect(token.parent).toEqual(['client0', 0]);
    expect(token.content).toBe('hello');
  });

  it('ofDelete를 사용하여 delete 작업을 생성해야 한다', () => {
    const operation: Pick<Operation, 'id'> = {
      id: ['client1', 1],
    };
    const token = OperationToken.ofDelete(operation);

    expect(token.type).toBe('delete');
    expect(token.id).toEqual(['client1', 1]);
    expect(token.parent).toBeUndefined();
    expect(token.content).toBeUndefined();
  });

  it('insert 작업을 올바르게 해시해야 한다', () => {
    const operation: Operation = {
      type: 'insert',
      id: ['client1', 1],
      parent: ['client0', 0],
      content: 'hello',
    };
    const hash = OperationToken.hash(operation);

    expect(hash).toBe(
      JSON.stringify(['insert', ['client1', 1], ['client0', 0], 'hello']),
    );
  });

  it('delete 작업을 올바르게 해시해야 한다', () => {
    const operation: Operation = {
      type: 'delete',
      id: ['client1', 1],
    };
    const hash = OperationToken.hash(operation);

    expect(hash).toBe(JSON.stringify(['delete', ['client1', 1]]));
  });

  it('해시에서 insert 작업을 올바르게 재생성해야 한다', () => {
    const hash = JSON.stringify([
      'insert',
      ['client1', 1],
      ['client0', 0],
      'hello',
    ]);
    const token = OperationToken.fromHash(hash);

    expect(token.type).toBe('insert');
    expect(token.id).toEqual(['client1', 1]);
    expect(token.parent).toEqual(['client0', 0]);
    expect(token.content).toBe('hello');
  });

  it('해시에서 delete 작업을 올바르게 재생성해야 한다', () => {
    const hash = JSON.stringify(['delete', ['client1', 1]]);
    const token = OperationToken.fromHash(hash);
    expect(token.type).toBe('delete');
    expect(token.id).toEqual(['client1', 1]);
    expect(token.parent).toBeUndefined();
    expect(token.content).toBeUndefined();
  });

  it('잘못된 타입에 대해 예외를 발생시켜야 한다', () => {
    const invalidHash = JSON.stringify(['unknown', ['client1', 1]]);
    expect(() => OperationToken.fromHash(invalidHash)).toThrow('TypeError');
  });
});
