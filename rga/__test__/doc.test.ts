// doc.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Doc } from '../src';

describe('Doc', () => {
  let doc: Doc<string>;

  beforeEach(() => {
    doc = new Doc<string>('client1');
  });

  it('should insert a node correctly', () => {
    const op = doc.insert('A');
    expect(op.type).toBe('insert');
    expect(op.value).toBe('A');

    const list = doc.list();
    expect(list.length).toBe(1);
    expect(list[0].value.value).toBe('A');
  });

  it('should delete a node correctly', () => {
    const opInsert = doc.insert('A');
    const opDelete = doc.delete(opInsert.id);

    expect(opDelete.type).toBe('delete');
    expect(opDelete.id).toBe(opInsert.id);

    const list = doc.list();
    expect(list.length).toBe(0);
  });

  it('should handle multiple inserts', () => {
    doc.insert('A');
    doc.insert('B');
    doc.insert('C');

    const list = doc.list();
    expect(list.length).toBe(3);
    expect(list[0].value.value).toBe('C');
    expect(list[1].value.value).toBe('B');
    expect(list[2].value.value).toBe('A');
  });

  it('should handle inserts with parent', () => {
    const opA = doc.insert('A');
    const opB = doc.insert('B', opA.id);
    const opC = doc.insert('C', opB.id);

    const list = doc.list();
    expect(list.length).toBe(3);
    expect(list[0].value.value).toBe('A');
    expect(list[1].value.value).toBe('B');
    expect(list[2].value.value).toBe('C');
  });

  it('should handle deletes correctly', () => {
    const opA = doc.insert('A');
    const opB = doc.insert('B');
    doc.delete(opA.id);

    const list = doc.list();
    expect(list.length).toBe(1);
    expect(list[0].value.value).toBe('B'); // 'B'가 리스트의 앞에 위치함
  });

  it('should resolve conflicts in concurrent inserts', () => {
    const doc1 = new Doc<string>('client1');
    const doc2 = new Doc<string>('client2');

    const opA1 = doc1.insert('A');
    const opB1 = doc1.insert('B', opA1.id);

    const opA2 = doc2.insert('A');
    const opC2 = doc2.insert('C', opA2.id);

    // 연산 병합
    doc1.merge([opA2, opC2]);
    doc2.merge([opA1, opB1]);

    const list1 = doc1.list();
    const list2 = doc2.list();

    expect(list1.length).toBe(4);
    expect(list2.length).toBe(4);

    const values1 = list1.map(node => node.value.value);
    const values2 = list2.map(node => node.value.value);

    expect(values1.join('')).toEqual('ACAB');
    expect(values1).toEqual(values2);
  });

  it('should throw error when inserting with non-existent parent locally', () => {
    expect(() => {
      doc.insert('A', 'non-existent-parent');
    }).toThrowError('Not Found Node');
  });

  it('should buffer operations with missing dependencies during merge', () => {
    const opInsert = {
      type: 'insert' as const,
      id: 'client2::1',
      parent: 'client2::0',
      value: 'B',
    };

    // Merge operation with missing parent
    doc.merge([opInsert]);

    // The operation should be buffered
    expect(doc['buffer'].length).toBe(1);

    // Now merge the missing parent
    const opParent = {
      type: 'insert' as const,
      id: 'client2::0',
      parent: undefined,
      value: 'A',
    };

    doc.merge([opParent]);

    // Buffered operation should now be processed
    expect(doc['buffer'].length).toBe(0);

    const list = doc.list();
    expect(list.length).toBe(2);
    const values = list.map(node => node.value.value);
    expect(values).toEqual(['A', 'B']);
  });

  it('should handle concurrent inserts at the same parent from different peers', () => {
    const doc1 = new Doc<string>('peer1');
    const doc2 = new Doc<string>('peer2');
    const doc3 = new Doc<string>('peer3');

    const opA = doc1.insert('A');
    const opB = doc1.insert('B', opA.id);
    const opC = doc1.insert('C', opB.id);

    const defaultOperations = doc1.commit();
    doc2.merge(defaultOperations);
    doc3.merge(defaultOperations);

    // Peer1 inserts P1A -> P1B after B
    const opP1A = doc1.insert('P1A', opB.id);
    const opP1B = doc1.insert('P1B', opP1A.id);

    // Peer2 inserts P2A -> P2B after B
    const opP2A = doc2.insert('P2A', opB.id);
    const opP2B = doc2.insert('P2B', opP2A.id);

    const p1Commit = doc1.commit();
    const p2Commit = doc2.commit();

    doc1.merge(p2Commit);
    doc2.merge(p1Commit);
    doc3.merge([...p1Commit, ...p2Commit]);

    // Both docs should have the same state
    const list1 = doc1.list();
    const list2 = doc2.list();
    const list3 = doc3.list();

    const values1 = list1.map(node => node.value.value);
    const values2 = list2.map(node => node.value.value);
    const values3 = list3.map(node => node.value.value);

    expect(values1).toEqual(['A', 'B', 'P2A', 'P2B', 'P1A', 'P1B', 'C']);
    expect(values1).toEqual(values2);
    expect(values2).toEqual(values3);
  });

  it('should ensure idempotence when merging the same operations multiple times', () => {
    const opA = doc.insert('A');
    const opB = doc.insert('B', opA.id);

    // Merge the same operations multiple times
    doc.merge([opA, opB]);
    doc.merge([opA, opB]);

    const list = doc.list();
    expect(list.length).toBe(2);
  });

  it('should maintain consistent state after complex merges', () => {
    const peer1 = new Doc<string>('peer1');
    const peer2 = new Doc<string>('peer2');
    const peer3 = new Doc<string>('peer3');

    // Peer1 operations
    const opA1 = peer1.insert('A');
    const opB1 = peer1.insert('B', opA1.id);

    // Peer2 operations
    const opA2 = peer2.insert('A');
    const opC2 = peer2.insert('C', opA2.id);

    // Peer3 operations
    const opA3 = peer3.insert('A');
    const opD3 = peer3.insert('D', opA3.id);

    // Merge operations
    peer1.merge([opA2, opC2, opA3, opD3]);
    peer2.merge([opA1, opB1, opA3, opD3]);
    peer3.merge([opA1, opB1, opA2, opC2]);

    const list1 = peer1.list();
    const list2 = peer2.list();
    const list3 = peer3.list();

    expect(list1.length).toBe(6);
    expect(list2.length).toBe(6);
    expect(list3.length).toBe(6);

    const values1 = list1.map(node => node.value.value);
    const values2 = list2.map(node => node.value.value);
    const values3 = list3.map(node => node.value.value);

    expect(values1).toEqual(['A', 'D', 'A', 'C', 'A', 'B']);
    expect(values1).toEqual(values2);
    expect(values2).toEqual(values3);
  });

  it('should handle deletion of non-existent nodes gracefully during merge', () => {
    const opDelete = {
      type: 'delete' as const,
      id: 'non-existent-id::1',
    };

    // Merge delete operation for non-existent node
    doc.merge([opDelete]);

    // The operation should be buffered
    expect(doc['buffer'].length).toBe(1);

    // Now insert the node
    const opInsert = {
      type: 'insert' as const,
      id: 'non-existent-id::1',
      parent: undefined,
      value: 'A',
    };

    doc.merge([opInsert]);
    
    // Buffered delete operation should now be processed
    expect(doc['buffer'].length).toBe(0);

    const list = doc.list();
    expect(list.length).toBe(0); // The node was inserted and then deleted
  });

  it('should handle operations with different orders during merge', () => {
    const doc1 = new Doc<string>('peer1');
    const doc2 = new Doc<string>('peer2');

    // Doc1 operations
    const opA = doc1.insert('A');
    const opB = doc1.insert('B', opA.id);

    // Doc2 operations in different order
    const opC = doc2.insert('C');
    const opD = doc2.insert('D', opC.id);

    // Merge operations in different order
    doc1.merge([opC, opD]);
    doc2.merge([opA, opB]);

    const list1 = doc1.list();
    const list2 = doc2.list();

    expect(list1.map(node => node.value.value)).toEqual(
      list2.map(node => node.value.value),
    );
  });
});
