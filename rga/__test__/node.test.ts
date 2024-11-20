import { describe, it, expect } from 'vitest';
import { Node } from '../src/node';
import { Operation } from '../src';

describe('Node', () => {
  it('should create a node with operation', () => {
    const operation: Operation<string> = {
      id: '1',
      value: 'A',
      type: 'insert',
    };
    const node = new Node(operation);

    expect(node.value.id).toBe('1');
    expect(node.value.value).toBe('A');
    expect(node.deleted).toBe(false);
    expect(node.left).toBeUndefined();
    expect(node.right).toBeUndefined();
  });

  it('should append nodes correctly', () => {
    const op1: Operation<string> = { id: '1', value: 'A', type: 'insert' };
    const op2: Operation<string> = { id: '2', value: 'B', type: 'insert' };
    const op3: Operation<string> = { id: '3', value: 'C', type: 'insert' };

    const node1 = new Node(op1);
    const node2 = new Node(op2);
    const node3 = new Node(op3);

    node1.append(node2);
    node2.append(node3);

    expect(node1.right).toBe(node2);
    expect(node2.left).toBe(node1);
    expect(node2.right).toBe(node3);
    expect(node3.left).toBe(node2);
  });

  it('should prepend nodes correctly', () => {
    const op1: Operation<string> = { id: '1', value: 'A', type: 'insert' };
    const op2: Operation<string> = { id: '2', value: 'B', type: 'insert' };
    const op3: Operation<string> = { id: '3', value: 'C', type: 'insert' };

    const node1 = new Node(op1);
    const node2 = new Node(op2);
    const node3 = new Node(op3);

    node1.prepend(node2);
    node2.prepend(node3);

    expect(node1.left).toBe(node2);
    expect(node2.right).toBe(node1);
    expect(node2.left).toBe(node3);
    expect(node3.right).toBe(node2);
  });

  it('should find nodes correctly', () => {
    const op1: Operation<string> = { id: '1', value: 'A', type: 'insert' };
    const op2: Operation<string> = { id: '2', value: 'B', type: 'insert' };
    const op3: Operation<string> = { id: '3', value: 'C', type: 'insert' };

    const node1 = new Node(op1);
    const node2 = new Node(op2);
    const node3 = new Node(op3);

    node1.append(node2);
    node2.append(node3);

    const foundNode = node1.find(node => node.value.id == '3');
    expect(foundNode).toBe(node3);

    const notFoundNode = node1.find(node => node.value.id == '4');
    expect(notFoundNode).toBeUndefined();
  });

  it('should soft delete a node', () => {
    const operation: Operation<string> = {
      id: '1',
      value: 'A',
      type: 'insert',
    };
    const node = new Node(operation);

    node.softDelete();
    expect(node.deleted).toBe(true);
  });

  it('should physically delete a node', () => {
    const op1: Operation<string> = { id: '1', value: 'A', type: 'insert' };
    const op2: Operation<string> = { id: '2', value: 'B', type: 'insert' };
    const op3: Operation<string> = { id: '3', value: 'C', type: 'insert' };

    const node1 = new Node(op1);
    const node2 = new Node(op2);
    const node3 = new Node(op3);

    node1.append(node2);
    node2.append(node3);

    node2.delete();

    expect(node1.right).toBe(node3);
    expect(node3.left).toBe(node1);
    expect(node2.left).toBeUndefined();
    expect(node2.right).toBeUndefined();
  });

  it('should find head and tail correctly', () => {
    const op1: Operation<string> = { id: '1', value: 'A', type: 'insert' };
    const op2: Operation<string> = { id: '2', value: 'B', type: 'insert' };
    const op3: Operation<string> = { id: '3', value: 'C', type: 'insert' };

    const node1 = new Node(op1);
    const node2 = new Node(op2);
    const node3 = new Node(op3);

    node1.append(node2);
    node2.append(node3);

    const head = node2.getHead();
    const tail = node2.getTail();

    expect(head).toBe(node1);
    expect(tail).toBe(node3);
  });

  it('should slice the node correctly', () => {
    const op1: Operation<string> = { id: '1', value: 'A', type: 'insert' };
    const op2: Operation<string> = { id: '2', value: 'B', type: 'insert' };

    const node1 = new Node(op1);
    const node2 = new Node(op2);

    node1.append(node2);

    const [left, slicedNode] = node2.slice();

    expect(left).toBe(node1);
    expect(slicedNode).toBe(node2);
    expect(node1.right).toBeUndefined();
    expect(node2.left).toBeUndefined();
  });
});
