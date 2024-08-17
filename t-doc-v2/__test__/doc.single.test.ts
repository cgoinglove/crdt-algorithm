import { describe, it, expect, vi } from 'vitest';
import { Doc } from '../src';

// Mocking autoIncrement and LamportClock

describe('Doc 클래스', () => {
  it('노드를 삽입하고 문자열로 변환한 내용이 정확해야 한다', () => {
    const doc = new Doc();
    const root = doc.insert('A');
    doc.insert('B', root.id);
    expect(doc.stringify()).toBe('AB');
    doc.insert('-');
    expect(doc.stringify()).toBe('-AB');
  });

  it('노드를 삭제한 후 문자열이 제대로 업데이트되어야 한다', () => {
    const doc = new Doc();
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

    const doc = new Doc(commitHandlerMock);
    const root = doc.insert('A');
    doc.insert('B', root.id);
    const commitResult = doc.commit();
    expect(commitResult).toBe('커밋 성공');
    expect(commitHandlerMock).toHaveBeenCalledTimes(1);
  });

  it('commit 중 롤백이 필요할 경우 롤백이 제대로 호출되어야 한다', () => {
    const rollbackMock = vi.fn();
    const commitHandlerMock = vi.fn((operations, rollback) => {
      rollbackMock();
      rollback();
      return '커밋 실패';
    });

    const doc = new Doc(commitHandlerMock);
    const root = doc.insert('A');
    doc.insert('B', root.id);

    const commitResult = doc.commit();
    expect(commitResult).toBe('커밋 실패');
    expect(rollbackMock).toHaveBeenCalledTimes(1);
  });

  it('pendingTokens에 삽입된 토큰들이 제대로 기록되는지 확인한다', () => {
    const doc = new Doc();
    const root = doc.insert('A');
    const secondInsert = doc.insert('B', root.id);

    expect(doc['pendingTokens'].insert.size).toBe(2); // 두 개의 삽입된 토큰이 있는지 확인
    expect(doc['pendingTokens'].insert.get(root.id)).toEqual(root);
    expect(doc['pendingTokens'].insert.get(secondInsert.id)).toEqual(
      secondInsert,
    );
  });

  it('delete를 호출하면 insert에 있던 토큰이 삭제되는지 확인한다', () => {
    const doc = new Doc();
    const root = doc.insert('A');
    const secondInsert = doc.insert('B', root.id);

    expect(doc['pendingTokens'].insert.size).toBe(2); // 삽입된 토큰 두 개

    // 첫 번째 토큰 삭제
    doc.delete(root.id);

    expect(doc['pendingTokens'].insert.has(root.id)).toBe(false); // 삭제되었는지 확인
    expect(doc['pendingTokens'].insert.size).toBe(1); // 하나 남았는지 확인
    expect(doc['pendingTokens'].insert.get(secondInsert.id)).toEqual(
      secondInsert,
    );
  });

  it('commit 후에 pendingTokens가 비워지는지 확인한다', () => {
    const doc = new Doc();
    const root = doc.insert('A');
    doc.insert('B', root.id);

    expect(doc['pendingTokens'].insert.size).toBe(2); // 두 개의 토큰이 있는지 확인

    doc.commit(); // 커밋 호출

    expect(doc['pendingTokens'].insert.size).toBe(0); // 커밋 후 insert가 비었는지 확인
    expect(doc['pendingTokens'].delete.size).toBe(0); // delete도 비어 있어야 함
  });

  it('롤백을 호출한 후 pendingTokens가 원상태로 복구되는지 확인한다', () => {
    const commitHandlerMock = vi.fn((operations, rollback) => {
      rollback(); // 롤백 호출
      return '커밋 실패';
    });

    const doc = new Doc(commitHandlerMock);
    const root = doc.insert('A');
    const secondInsert = doc.insert('B', root.id);

    expect(doc['pendingTokens'].insert.size).toBe(2); // 두 개의 삽입된 토큰 확인

    doc.commit(); // 커밋 호출

    expect(doc['pendingTokens'].insert.size).toBe(2); // 롤백 후 다시 2개의 토큰이 복구되었는지 확인
    expect(doc['pendingTokens'].insert.get(root.id)).toEqual(root);
    expect(doc['pendingTokens'].insert.get(secondInsert.id)).toEqual(
      secondInsert,
    );
  });
});
