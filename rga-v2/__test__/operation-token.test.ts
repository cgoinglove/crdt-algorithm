import { describe, it, expect } from 'vitest';
import { OperationToken } from '../src/operation-token';
import { Operation } from '../src/interface';

describe('OperationToken', () => {
  it('ofInsert를 사용하여 insert 작업을 생성해야 한다', () => {
    const operation: Pick<Operation, 'value' | 'id' | 'parent'> = {
      id: `id-1`,
      parent: `id-2`,
      value: 'hello',
    };
    const token = OperationToken.ofInsert(operation);

    expect(token.type).toBe('insert');
    expect(token.id).toEqual(`id-1`);
    expect(token.parent).toEqual(`id-2`);
    expect(token.value).toBe('hello');
  });

  it('ofDelete를 사용하여 delete 작업을 생성해야 한다', () => {
    const operation: Pick<Operation, 'id'> = {
      id: `id-1`,
    };
    const token = OperationToken.ofDelete(operation);

    expect(token.type).toBe('delete');
    expect(token.id).toEqual(`id-1`);
    expect(token.parent).toBeUndefined();
    expect(token.value).toBeUndefined();
  });

  it('insert 작업을 올바르게 해시해야 한다', () => {
    const operation: Operation = {
      type: 'insert',
      id: `id-1`,
      parent: `id-2`,
      value: 'hello',
    };
    const hash = OperationToken.hash(operation);

    expect(hash).toBe(JSON.stringify(['insert', `id-1`, `id-2`, 'hello']));
  });

  it('delete 작업을 올바르게 해시해야 한다', () => {
    const operation: Operation = {
      type: 'delete',
      id: `id-1`,
    };
    const hash = OperationToken.hash(operation);

    expect(hash).toBe(JSON.stringify(['delete', `id-1`]));
  });

  it('해시에서 insert 작업을 올바르게 재생성해야 한다', () => {
    const hash = JSON.stringify(['insert', `id-1`, `id-2`, 'hello']);
    const token = OperationToken.fromHash(hash);

    expect(token.type).toBe('insert');
    expect(token.id).toEqual(`id-1`);
    expect(token.parent).toEqual(`id-2`);
    expect(token.value).toBe('hello');
  });

  it('해시에서 delete 작업을 올바르게 재생성해야 한다', () => {
    const hash = JSON.stringify(['delete', `id-1`]);
    const token = OperationToken.fromHash(hash);
    expect(token.type).toBe('delete');
    expect(token.id).toEqual(`id-1`);
    expect(token.parent).toBeUndefined();
    expect(token.value).toBeUndefined();
  });

  it('잘못된 타입에 대해 예외를 발생시켜야 한다', () => {
    const invalidHash = JSON.stringify(['unknown', `id-1`]);
    expect(() => OperationToken.fromHash(invalidHash)).toThrow('TypeError');
  });
});
