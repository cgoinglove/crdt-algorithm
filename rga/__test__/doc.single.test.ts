import { describe, it, expect, vi } from 'vitest';
import { Doc } from '../src/rga';

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

  it('commit 시 올바른 작업들이 commitHandler로 전달되어야 한다', () => {
    const commitHandlerMock = vi.fn(operations => {
      expect(operations.length).toBe(2);
      expect(operations[0].type).toBe('insert');
      expect(operations[1].type).toBe('insert');
      return '커밋 성공';
    });

    const doc = new Doc('client', commitHandlerMock);
    const root = doc.insert('A');
    doc.insert('B', root.id);
    const commitResult = doc.commit();
    expect(commitResult).toBe('커밋 성공');
    expect(commitHandlerMock).toHaveBeenCalledTimes(1);
  });

  it('commit 중 롤백이 필요할 경우 롤백이 제대로 호출되어야 한다', () => {
    const commitHandlerMock = vi.fn((operations, rollback) => {
      expect(doc['staging'].insert).toHaveLength(0);
      rollback();
      expect(doc['staging'].insert).toHaveLength(2);
      return '커밋 실패';
    });

    const doc = new Doc('client', commitHandlerMock);
    const root = doc.insert('A');
    doc.insert('B', root.id);

    const commitResult = doc.commit();
    expect(commitResult).toBe('커밋 실패');
  });

  it('delete를 호출하면 insert에 있던 토큰이 삭제되는지 확인한다', () => {
    const doc = new Doc('client');
    const root = doc.insert('A');

    expect(doc['staging'].insert).toHaveLength(1);

    // 첫 번째 토큰 삭제
    doc.delete(root.id);

    expect(doc['staging'].delete).toHaveLength(0);
  });
});
