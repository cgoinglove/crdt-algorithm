import { describe, it, expect, beforeEach } from 'vitest';
import { Doc } from '../src/rga';
import { OperationToken } from '../src/operation-token';
import { ID, Operation } from '../src/interface';

describe('RGA CRDT - 여러 피어 간의 동기화 및 서버 테스트', () => {
  let p1: Doc;
  let p2: Doc;
  let p3: Doc;
  const server = {
    insert: new Map<ID, Operation>(),
    delete: new Map<ID, Operation>(),
  };
  let version = 0;

  let peers: Doc[];

  const broadcast = (id: string, operations: Operation[]) => {
    peers.forEach(peer => {
      if (peer.client != id) peer.merge(operations);
    });
    operations.forEach(op => server[op.type].set(op.id, op));

    return version++;
  };

  const setupPeer = (id: string) => {
    const peer = new Doc(id);

    peers.push(peer);
    return peer;
  };

  beforeEach(() => {
    peers = [];
    version = 0;
    p1 = setupPeer('p1');
    p2 = setupPeer('p2');
    p3 = setupPeer('p3');
    server.delete.clear();
    server.insert.clear();
  });

  it('모든 피어가 일관된 상태를 유지해야 합니다', () => {
    p1.insert('A');
    broadcast('p1', p1.commit());
    p2.insert('B');
    broadcast('p2', p2.commit());
    p3.insert('C');
    broadcast('p3', p3.commit());
    expect(p1.stringify()).toEqual('CBA');
    expect(p1.stringify()).toEqual(p2.stringify());
    expect(p2.stringify()).toEqual(p3.stringify());
    expect(server.insert.size).toBe(3);
  });

  it('중복된 토큰이 발생해도 일관된 상태를 유지해야 합니다', () => {
    p1.insert('X');
    p2.insert('Y');
    p3.insert('Z');

    broadcast('p1', p1.commit());
    broadcast('p2', p2.commit());
    broadcast('p3', p3.commit());

    expect(p1.stringify()).toEqual('ZYX');
    expect(p1.stringify()).toEqual(p2.stringify());
    expect(p2.stringify()).toEqual(p3.stringify());

    expect(server.insert.size).toBe(3);
  });

  it('삭제 연산이 모든 피어에 동기화 되어야 합니다', () => {
    const A_TOKEN = p1.insert('A');
    broadcast('p1', p1.commit());

    p2.delete(A_TOKEN.id);
    broadcast('p2', p2.commit());

    expect(p1.stringify()).toEqual('');
    expect(p2.stringify()).toEqual('');
    expect(p3.stringify()).toEqual('');

    expect(server.insert.size).toBe(1);
    expect(server.delete.size).toBe(1);
  });

  it('다양한 중복 삽입 및 삭제 처리', () => {
    const { id: X_TOKEN_ID } = p1.insert('X');
    broadcast('p1', p1.commit());

    const { id: Y_TOKEN_ID } = p2.insert('Y');
    broadcast('p2', p2.commit());

    p3.insert('Z');
    broadcast('p3', p3.commit());

    expect(p1.stringify()).toEqual('ZYX');

    p2.delete(X_TOKEN_ID);
    broadcast('p2', p2.commit());

    p1.insert('X');
    broadcast('p1', p1.commit());

    p3.delete(Y_TOKEN_ID);
    broadcast('p3', p3.commit());

    expect(p1.stringify()).toEqual('XZ');
    expect(p1.stringify()).toEqual(p2.stringify());
    expect(p2.stringify()).toEqual(p3.stringify());

    expect(server.insert.size).toBe(4);
    expect(server.delete.size).toBe(2);
  });

  it('모든 피어가 병합 후 동일한 최종 상태를 가져야 합니다', () => {
    p1.insert('1');
    broadcast('p1', p1.commit());

    p2.insert('2');
    broadcast('p2', p2.commit());

    p3.insert('3');
    broadcast('p3', p3.commit());

    p1.insert('4');
    broadcast('p1', p1.commit());

    p2.insert('5');
    broadcast('p2', p2.commit());

    p3.insert('6');
    broadcast('p3', p3.commit());

    expect(p1.stringify()).toEqual('654321');
    expect(p1.stringify()).toEqual(p2.stringify());
    expect(p2.stringify()).toEqual(p3.stringify());

    expect(server.insert.size).toBe(6);
  });
  it('다양한 부모에 데이터를 삽입하여 Hello World를 만들어야 합니다', () => {
    const helToken1 = p1.insert('H');

    const helToken2 = p1.insert('e', helToken1.id);

    const helToken3 = p1.insert('l', helToken2.id);

    broadcast('p1', p1.commit());

    const loToken1 = p2.insert('l', helToken3.id);
    const loToken2 = p2.insert('o', loToken1.id);
    const spaceToken = p2.insert(' ', loToken2.id);
    broadcast('p2', p2.commit());

    const wToken = p3.insert('W', spaceToken.id);
    const oToken = p3.insert('o', wToken.id);
    const rToken = p3.insert('r', oToken.id);
    broadcast('p3', p3.commit());

    const lToken = p1.insert('l', rToken.id);
    const dToken = p1.insert('d', lToken.id);
    broadcast('p1', p1.commit());

    expect(p1.stringify()).toEqual('Hello World');
    expect(p1.stringify()).toEqual(p2.stringify());
    expect(p2.stringify()).toEqual(p3.stringify());
    expect(server.insert.size).toBe(11);

    const newPeer = setupPeer('p4');

    newPeer.merge([
      ...Array.from(server.delete.values()),
      ...Array.from(server.insert.values()),
    ]);

    expect(p1.stringify()).toEqual(newPeer.stringify());
  });

  it('같은 부모에 중복된 삽입이 있어도 일관된 상태를 유지해야 합니다', () => {
    const hToken = p1.insert('H');
    broadcast('p1', p1.commit());

    const eToken = p2.insert('e', hToken.id);
    broadcast('p2', p2.commit());

    const eUpperToken = p3.insert('E', hToken.id);
    broadcast('p3', p3.commit());

    const lToken = p1.insert('l', eToken.id);
    broadcast('p1', p1.commit());

    const result = p1.stringify();
    expect(result.includes('H')).toBeTruthy();
    expect(result.includes('e')).toBeTruthy();
    expect(result.includes('E')).toBeTruthy();
    expect(result.includes('l')).toBeTruthy();
    expect(server.insert.size).toBe(4);
  });

  it('커밋의 순서가 잘못 들어 왔을 경우에도 버퍼를 통해 커밋들을 lazy 하게 merge 할 수 있도록 한다', () => {
    const A = p1.insert('A');
    const B = p1.insert('B', A.id);
    const C = p1.insert('C', B.id);

    const ABC_OPERATIONS = p1.commit();
    broadcast('p1', ABC_OPERATIONS);

    const D = p2.insert('D', C.id);
    const E = p2.insert('E', D.id);
    const F = p2.insert('F', E.id);

    const DEF_OPERATIONS = p2.commit();
    broadcast('p2', DEF_OPERATIONS);

    expect(p1.stringify()).toBe('ABCDEF');

    const testPeer1 = setupPeer('test-1');
    const testPeer2 = setupPeer('test-2');

    testPeer1.merge(ABC_OPERATIONS);
    testPeer1.merge(DEF_OPERATIONS);

    expect(testPeer1.stringify()).toBe(p1.stringify());

    testPeer2.merge(DEF_OPERATIONS);
    testPeer2.merge(ABC_OPERATIONS);

    expect(testPeer2.stringify()).toBe(testPeer1.stringify());
  });
  it('중복된 부모의 하위 노드들의 병합 issue', () => {
    const A = p1.insert('A');
    const B = p1.insert('B', A.id);
    const C = p1.insert('C', B.id);

    broadcast('p1', p1.commit());

    const D = p1.insert('D', C.id);
    p1.insert('D', D.id); // ABCDD

    expect(p1.stringify()).toBe('ABCDD');

    const E = p2.insert('E', C.id);
    p2.insert('E', E.id);

    expect(p2.stringify()).toBe('ABCEE');

    broadcast('p1', p1.commit());
    broadcast('p2', p2.commit());

    expect(p1.stringify()).toBe('ABCEEDD');
    expect(p1.stringify()).toBe(p3.stringify());
    expect(p1.stringify()).toBe(p2.stringify());
  });
});
