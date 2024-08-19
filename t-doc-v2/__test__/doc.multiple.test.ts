import { describe, it, expect } from 'vitest';
import { Doc } from '../src'; // 경로 수정

describe('Doc merge 테스트', () => {
  it.only('두 피어가 동일 노드에 삽입할 경우 충돌 해결', () => {
    const peer1 = new Doc('Lee');
    const peer2 = new Doc('Choi');

    const root = peer1.insert('A');

    peer2.merge(peer1.commit()); // peer2에 peer1의 작업 병합

    expect(peer1.stringify()).toBe(peer2.stringify());

    peer2.insert('C', root.id);
    peer1.insert('B', root.id);

    expect(peer1.stringify()).toBe('AB');
    expect(peer2.stringify()).toBe('AC');

    peer1.merge(peer2.commit()); // peer2가 peer1의 새로운 작업을 병합
    peer2.merge(peer1.commit()); // peer2가 peer1의 새로운 작업을 병합

    expect(peer1.stringify()).toBe(peer1.stringify());
    expect(peer1.stringify()).toBe('ABC');
  });

  it('한 피어가 삭제한 후 다른 피어가 부모 노드에 삽입 시 충돌 처리', () => {
    const peer1 = new Doc();
    const peer2 = new Doc();

    const root = peer1.insert('A');
    peer1.commit();

    peer2.merge(peer1.commit()); // peer2에 peer1의 작업 병합

    // peer1에서 노드 삭제
    peer1.delete(root.id);
    const peer1Delete = peer1.commit();

    // peer2에서 삭제된 부모 앞에 삽입 시도
    const peer2Insert = peer2.insert('B', root.id);

    peer2.merge(peer1Delete); // peer2에 peer1의 삭제 병합

    expect(peer1.stringify()).toBe('');
    expect(peer2.stringify()).toBe('B'); // peer2는 'B' 삽입을 유지
  });

  it('동일한 부모 노드 앞에 두 피어가 동시에 삽입할 때 충돌 해결', () => {
    const peer1 = new Doc();
    const peer2 = new Doc();

    const root = peer1.insert('A');
    peer1.commit();

    peer2.merge(peer1.commit());

    // 동일한 부모 앞에 두 피어가 동시에 삽입
    const peer1Insert = peer1.insert('B', root.id);
    const peer2Insert = peer2.insert('C', root.id);

    peer2.merge(peer1.commit()); // peer2가 peer1의 삽입을 병합

    expect(peer1.stringify()).toBe('AB');
    expect(peer2.stringify()).toBe('AC');
  });

  it('readonlyPeer가 두 피어의 병합을 정상적으로 수행하는지 확인', () => {
    const peer1 = new Doc();
    const peer2 = new Doc();
    const readonlyPeer = new Doc();

    const root = peer1.insert('A');
    peer1.commit();

    peer2.merge(peer1.commit()); // peer2에 peer1의 작업 병합

    const peer1Insert = peer1.insert('B', root.id);
    const peer2Insert = peer2.insert('C', root.id);

    readonlyPeer.merge(peer1.commit()); // readonlyPeer에 peer1의 작업 병합
    readonlyPeer.merge(peer2.commit()); // readonlyPeer에 peer2의 작업 병합

    expect(readonlyPeer.stringify()).toBe('AC'); // peer2의 삽입이 마지막으로 병합됨
  });

  it('중복된 부모를 기준으로 두 피어가 동시에 삽입하는 경우 처리', () => {
    const peer1 = new Doc();
    const peer2 = new Doc();

    const root = peer1.insert('A');
    peer1.commit();

    peer2.merge(peer1.commit());

    // 동일한 부모 앞에 두 피어가 중복 삽입
    const peer1Insert = peer1.insert('B', root.id);
    const peer2Insert = peer2.insert('C', root.id);

    peer2.merge(peer1.commit()); // peer2가 peer1의 작업을 병합

    const finalMerge = peer1.commit(); // 최종 병합

    expect(peer1.stringify()).toBe('AB');
    expect(peer2.stringify()).toBe('AC');

    peer1.merge(finalMerge); // peer1이 peer2의 삽입을 병합
    expect(peer1.stringify()).toBe('AC'); // 최종적으로 동일한 결과가 나와야 함
  });
});
