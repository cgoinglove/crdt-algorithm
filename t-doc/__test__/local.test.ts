import { describe, it, expect, beforeEach } from 'vitest';
import { TextDocumentOperator } from '../src';

describe('TextDocumentOperator', () => {
  let operator: TextDocumentOperator;
  let commitHandler: CommitHandler;
  let operationsCommitted: OperationToken[];

  beforeEach(() => {
    operationsCommitted = [];
    commitHandler = async (operations: OperationToken[]) => {
      operationsCommitted.push(...operations);
    };
    operator = new TextDocumentOperator(1, commitHandler);
  });

  it('should insert a node and generate the correct ID', () => {
    operator.insert('Hello');
    expect(operator.stringify()).toBe('Hello');
  });

  it('should remove a node correctly', () => {
    const id = operator.insert('Hello');
    operator.remove(id);
    expect(operator.stringify()).toBe('');
  });

  it('should commit pending operations', async () => {
    operator.insert('Hello');
    await operator.commit();
    expect(operationsCommitted.length).toBe(1);
    expect(operationsCommitted[0].type).toBe('insert');
  });

  it('should merge insert operations correctly', () => {
    const token: OperationToken = {
      type: 'insert',
      id: [0, 0],
      text: 'Hello',
    };
    operator.merge(token);
    expect(operator.stringify()).toBe('Hello');
  });

  it('should merge remove operations correctly', () => {
    const id = operator.insert('Hello');
    const token: OperationToken = {
      type: 'remove',
      id,
    };
    operator.merge(token);
    expect(operator.stringify()).toBe('');
  });

  it('should handle concurrent inserts', () => {
    const id1 = operator.insert('Hello');
    operator.insert('World', id1);
    expect(operator.stringify()).toBe('HelloWorld');
  });

  it('should correctly update the keyMap when setting document', () => {
    const id = operator.insert('Hello');
    const key = operator['toStableKey'](id);
    expect(operator['keyMap'].has(key)).toBe(true);
  });

  it('should correctly update the keyMap when deleting document', () => {
    const id = operator.insert('Hello');
    const key = operator['toStableKey'](id);
    operator.remove(id);
    expect(operator['keyMap'].has(key)).toBe(false);
  });
});
