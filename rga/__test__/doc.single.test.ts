import { describe, it, expect, vi } from 'vitest';
import { Doc } from '../src/rga';
import { OperationToken } from '../src/operation-token';

// Mocking autoIncrement and LamportClock

describe('Doc 클래스', () => {
  it('노드를 삽입하고 문자열로 변환한 내용이 정확해야 한다', () => {
    const doc = new Doc('client');
    const root = doc.insert('A');
    doc.insert('B', root.id);
    expect(doc.stringify()).toBe('AB');
    doc.insert('-');
    expect(doc.stringify()).toBe('-AB');
  });

  it('노드를 삭제한 후 문자열이 제대로 업데이트되어야 한다', () => {
    const doc = new Doc('client');
    const root = doc.insert('A');
    doc.insert('B', root.id);
    expect(doc.stringify()).toBe('AB');
    doc.delete(root.id);
    expect(doc.stringify()).toBe('B');
  });

  it('delete를 호출하면 insert에 있던 토큰이 삭제되는지 확인한다', () => {
    const doc = new Doc('client');
    const root = doc.insert('A');

    expect(doc['staging'].insert).toHaveLength(1);

    // 첫 번째 토큰 삭제
    doc.delete(root.id);

    expect(doc['staging'].delete).toHaveLength(0);
  });
  it('올바른 commit 확인', () => {
    const doc = new Doc('client');
    const root = doc.insert('A');

    const result = doc.commit();
    expect(doc['staging'].delete).toHaveLength(0);
    expect(doc['staging'].insert).toHaveLength(0);

    expect(result.map(OperationToken.hash)).toEqual([
      OperationToken.hash(
        OperationToken.ofInsert({
          id: root.id,
          content: root.content,
        }),
      ),
    ]);
  });
});
