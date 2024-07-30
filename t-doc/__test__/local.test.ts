import { describe, it, expect, beforeEach } from 'vitest';
import { TextDocumentOperator } from '../src';
import { OperationToken } from '../src/token';

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

  it('should insert a character and generate the correct ID', () => {
    operator.insert('H');
    expect(operator.stringify()).toBe('H');
  });

  it('should remove a character correctly', () => {
    const id = operator.insert('H');
    operator.remove(id);
    expect(operator.stringify()).toBe('');
  });

  it('should commit pending operations', async () => {
    operator.insert('H');
    await operator.commit();
    expect(operationsCommitted.length).toBe(1);
    expect(operationsCommitted[0].type).toBe('insert');
  });

  it('should merge insert operations correctly', () => {
    const token = OperationToken.of('insert', [0, 0], 'H');
    operator.merge(token);
    expect(operator.stringify()).toBe('H');
  });

  it('should merge remove operations correctly', () => {
    const id = operator.insert('H');
    const token = OperationToken.of('remove', id);
    operator.merge(token);
    expect(operator.stringify()).toBe('');
  });

  it('should handle concurrent inserts', () => {
    const id1 = operator.insert('H');
    const id2 = operator.insert('e', id1);
    expect(operator.stringify()).toBe('He');
  });

  it('should correctly update the keyMap when setting document', () => {
    const id = operator.insert('H');
    const key = operator['toStableKey'](id);
    expect(operator['keyMap'].has(key)).toBe(true);
  });

  it('should correctly update the keyMap when deleting document', () => {
    const id = operator.insert('H');
    const key = operator['toStableKey'](id);
    operator.remove(id);
    expect(operator['keyMap'].has(key)).toBe(false);
  });

  it('should insert text between two existing nodes', () => {
    const id1 = operator.insert('H');
    const id2 = operator.insert('d');
    console.log(id1, id2);
    const idMiddle = operator.insert('e', id1, id2);
    expect(operator.stringify()).toBe('Hed');
  });

  it('should insert text at the beginning correctly', () => {
    const id1 = operator.insert('d');
    operator.insert('H', undefined, id1);
    expect(operator.stringify()).toBe('Hd');
  });

  it('should insert text at the end correctly', () => {
    const id1 = operator.insert('H');
    operator.insert('d', id1);
    expect(operator.stringify()).toBe('Hd');
  });

  it('should generate and parse hash correctly', () => {
    const token = OperationToken.of('insert', [1, 2], 'H');
    const hash = token.hash();
    const parsedToken = OperationToken.fromHash(hash);
    expect(parsedToken.type).toBe(token.type);
    expect(parsedToken.id).toEqual(token.id);
    expect(parsedToken.text).toBe(token.text);
  });
});
