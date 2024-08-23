import { describe, it, expect, beforeEach } from 'vitest';
import { CommitHandler, Doc } from '../src';
import { OperationToken } from '../src/operation-token';

describe('RGA CRDT - Multiple Peers with a Server', () => {
  let p1: Doc<any>;
  let p2: Doc<any>;
  let p3: Doc<any>;
  const server = {
    insert: new Map<ID, Operation>(),
    delete: new Map<ID, Operation>(),
  };

  beforeEach(() => {
    const setupPeer = (id: string) => {
      return new Doc(id, _operations => {
        const operations = _operations.map(OperationToken.copy);

        [p1, p2, p3].forEach(peer => {
          if (peer.client == id) return;
          try {
            peer.merge(operations);
          } catch (error) {
            console.log({
              error,
              peer: peer.client,
              sender: id,
            });
            throw error;
          }
        });
        operations.forEach(op => {
          server[op.type].set(op.id, op);
        });
        return;
      });
    };

    p1 = setupPeer('p1');
    p2 = setupPeer('p2');
    p3 = setupPeer('p3');
  });

  it('should synchronize all peers with consistent state', () => {
    p1.insert('A');
    p1.commit();
    p2.insert('B');
    p2.commit();
    p3.insert('C');
    p3.commit();
    expect(p1.stringify()).toEqual('CBA');
    expect(p1.stringify()).toEqual(p2.stringify());
    expect(p2.stringify()).toEqual(p3.stringify());
    expect(server.insert.size).toBe(3);
  });

  it.only('should handle duplicate tokens and still have consistent state', () => {
    p1.insert('X');
    p2.insert('Y');
    p3.insert('Z');

    p1.commit();
    p2.commit();
    p3.commit();
    console.log(p1.stringify());
    console.log(p2.stringify());
    console.log(p3.stringify());

    expect(p1.stringify()).toEqual(p2.stringify());
    expect(p2.stringify()).toEqual(p3.stringify());

    expect(server.insert.size).toBe(3);
  });
});
