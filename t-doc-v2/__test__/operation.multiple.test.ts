import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentOperator } from '../src';

describe.skip('DocumentOperator CRDT Tests', () => {
  let master: DocumentOperator;
  let peer1: DocumentOperator;
  let peer2: DocumentOperator;
  const broadcast = (peer: DocumentOperator) => {
    const tokens = peer.commit();
    [master, peer1, peer2].forEach(receiver => {
      if (peer != receiver) receiver.merge(tokens);
    });
    return tokens;
  };

  beforeEach(() => {
    master = new DocumentOperator('master');
    peer1 = new DocumentOperator('peer1');
    peer2 = new DocumentOperator('peer2');
    master.insert(master.gen('')); // Initialize with a root node
    broadcast(master);
  });
});
