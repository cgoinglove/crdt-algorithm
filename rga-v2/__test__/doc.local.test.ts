import { describe, it, expect, beforeEach } from 'vitest';
import { Doc } from '../src';

function docToString<T>(doc: Doc<string>): string {
  return doc
    .list()
    .map(node => node.value)
    .join('');
}

describe('Doc', () => {
  let doc: Doc<string>;

  beforeEach(() => {
    doc = new Doc<string>('client1');
  });

  it('should insert strings with proper parent IDs', () => {
    const op1 = doc.insert('Hello'); // 'Hello'

    const op2 = doc.insert(' World', op1.id); // 'Hello World'

    doc.insert('!', op2.id); // 'Hello World!'

    const result = docToString(doc);
    expect(result).toBe('Hello World!');
  });

  it('should delete a string', () => {
    const op1 = doc.insert('Hello');
    const op2 = doc.insert(' World', op1.id);
    doc.insert('!', op2.id);

    // ' World'의 ID를 가져와 삭제
    doc.delete(op2.id);

    const result = docToString(doc);
    expect(result).toBe('Hello!');
  });

  it('should update a string', () => {
    const op1 = doc.insert('Hello');
    const op2 = doc.insert(' World', op1.id);
    doc.insert('!', op2.id);

    // 'Hello'의 ID를 가져와 업데이트
    doc.update(op1.id, 'Hi');

    const result = docToString(doc);
    expect(result).toBe('Hi World!');
  });

  it('should undo the last operation', () => {
    const op1 = doc.insert('Hello');
    const op2 = doc.insert(' World', op1.id);
    const op3 = doc.insert('!', op2.id);

    doc.undo(); // '!' 삽입 취소
    let result = docToString(doc);
    expect(result).toBe('Hello World');

    doc.undo(); // ' World' 삽입 취소
    result = docToString(doc);
    expect(result).toBe('Hello');

    doc.undo(); // 'Hello' 삽입 취소
    result = docToString(doc);
    expect(result).toBe('');
  });

  it('should handle complex operations with undo', () => {
    const op1 = doc.insert('Hello');
    const op2 = doc.insert(' World', op1.id);
    const op3 = doc.insert('!', op2.id);

    // 업데이트
    doc.update(op2.id, ', Vitest');

    let result = docToString(doc);
    expect(result).toBe('Hello, Vitest!');

    // 업데이트 취소
    doc.undo();
    result = docToString(doc);
    expect(result).toBe('Hello World!');

    // 삭제
    doc.delete(op1.id);

    result = docToString(doc);
    expect(result).toBe(' World!');

    // 삭제 취소
    doc.undo();
    result = docToString(doc);
    expect(result).toBe('Hello World!');
  });

  it('should maintain correct order with multiple inserts and deletes', () => {
    const op1 = doc.insert('A'); // 맨 앞에 삽입
    const op2 = doc.insert('B', op1.id); // 'A' 뒤에 'B' 삽입
    const op3 = doc.insert('C', op2.id); // 'B' 뒤에 'C' 삽입
    const op4 = doc.insert('D', op3.id); // 'C' 뒤에 'D' 삽입

    // 'B'를 삭제하고 'C'를 업데이트
    doc.delete(op2.id);
    doc.update(op3.id, 'Z');

    let result = docToString(doc);
    expect(result).toBe('AZD');

    // 'C'의 업데이트를 취소하고 'B'의 삭제를 취소
    doc.undo(); // 'C'의 업데이트 취소
    doc.undo(); // 'B'의 삭제 취소

    result = docToString(doc);
    expect(result).toBe('ABCD');
  });
  it('should not include operations for items inserted and then deleted before push', () => {
    // 아이템 삽입
    const op1 = doc.insert('Test');

    // 같은 커밋 내에서 아이템 삭제
    doc.delete(op1.id);

    // push() 호출하여 커밋 생성
    const commit = doc.push();

    expect(commit.operations.insert).toHaveLength(0);
    expect(commit.operations.delete).toHaveLength(0);

    // 문서 내용이 비어 있는지 확인
    const docContent = docToString(doc);
    expect(docContent).toBe('');
  });

  it('should handle multiple operations and remove redundant ones', () => {
    // 여러 아이템 삽입
    const op1 = doc.insert('A');
    const op2 = doc.insert('B', op1.id);
    doc.insert('C', op2.id);

    // op2를 같은 커밋 내에서 삭제
    doc.delete(op2.id);
    doc.delete(op1.id);

    // push() 호출하여 커밋 생성
    const commit = doc.push();

    const operations = commit.operations;

    const docContent = docToString(doc);
    expect(docContent).toBe('C');
  });
});
