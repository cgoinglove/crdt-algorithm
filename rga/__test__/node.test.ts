import { describe, it, expect } from 'vitest';
import { Node } from '../src/node';

describe('Node 클래스 테스트', () => {
  it('노드 생성 테스트', () => {
    const node = new Node('1', 'A');
    expect(node.id).toBe('1');
    expect(node.value).toBe('A');
    expect(node.deleted).toBe(false);
    expect(node.left).toBeUndefined();
    expect(node.right).toBeUndefined();
  });

  it('append 함수 테스트', () => {
    const nodeA = new Node('1', 'A');
    const nodeB = new Node('2', 'B');

    nodeA.append(nodeB);

    expect(nodeA.right).toBe(nodeB);
    expect(nodeB.left).toBe(nodeA);
  });

  it('prepend 함수 테스트', () => {
    const nodeA = new Node('1', 'A');
    const nodeB = new Node('2', 'B');

    nodeA.prepend(nodeB);

    expect(nodeA.left).toBe(nodeB);
    expect(nodeB.right).toBe(nodeA);
  });

  it('append 함수: 중간에 삽입 테스트', () => {
    const nodeA = new Node('1', 'A');
    const nodeB = new Node('2', 'B');
    const nodeC = new Node('3', 'C');

    nodeA.append(nodeC); // A -> C
    nodeA.append(nodeB); // A -> B -> C

    expect(nodeA.right).toBe(nodeB);
    expect(nodeB.left).toBe(nodeA);
    expect(nodeB.right).toBe(nodeC);
    expect(nodeC.left).toBe(nodeB);
  });

  it('prepend 함수: 중간에 삽입 테스트', () => {
    const nodeA = new Node('1', 'A');
    const nodeB = new Node('2', 'B');
    const nodeC = new Node('3', 'C');

    nodeC.prepend(nodeA); // A -> C
    nodeC.prepend(nodeB); // A -> B -> C

    expect(nodeC.left).toBe(nodeB);
    expect(nodeB.right).toBe(nodeC);
    expect(nodeB.left).toBe(nodeA);
    expect(nodeA.right).toBe(nodeB);
  });

  it('delete 함수 테스트 (소프트 삭제)', () => {
    const nodeA = new Node('1', 'A');
    nodeA.delete();
    expect(nodeA.deleted).toBe(true);
  });

  it('delete 함수 테스트 (강제 삭제)', () => {
    const nodeA = new Node('1', 'A');
    const nodeB = new Node('2', 'B');
    const nodeC = new Node('3', 'C');

    nodeA.append(nodeB);
    nodeB.append(nodeC); // A -> B -> C

    nodeB.delete(true); // B 삭제, A -> C

    expect(nodeA.right).toBe(nodeC);
    expect(nodeC.left).toBe(nodeA);
  });

  it('delete 함수 테스트: 중간 노드 강제 삭제', () => {
    const nodeA = new Node('1', 'A');
    const nodeB = new Node('2', 'B');
    const nodeC = new Node('3', 'C');

    nodeA.append(nodeB);
    nodeB.append(nodeC); // A -> B -> C

    nodeB.delete(true); // B 강제 삭제

    expect(nodeA.right).toBe(nodeC);
    expect(nodeC.left).toBe(nodeA);
    expect(nodeB.deleted).toBe(false); // 노드는 강제 삭제 되었지만, 실제로는 '삭제' 상태 아님
  });

  it('마지막 노드 찾기', () => {
    const nodeA = new Node('1', 'A');
    const nodeB = new Node('2', 'B');
    const nodeC = new Node('3', 'C');

    nodeA.append(nodeB);
    nodeB.append(nodeC); // A -> B -> C

    expect(nodeA.findTail()).toBe(nodeB.findTail());
    expect(nodeA.findTail()).toBe(nodeC.findTail());
    expect(nodeC).toBe(nodeC.findTail());
  });

  it('첫번쨰 노드 찾기', () => {
    const nodeA = new Node('1', 'A');
    const nodeB = new Node('2', 'B');
    const nodeC = new Node('3', 'C');

    nodeA.append(nodeB);
    nodeB.append(nodeC); // A -> B -> C

    expect(nodeA.findHead()).toBe(nodeB.findHead());
    expect(nodeA.findHead()).toBe(nodeC.findHead());
    expect(nodeA).toBe(nodeC.findHead());
  });

  it('여러 노드 한번에 append,prepend', () => {
    const nodeA = new Node('1', 'A');
    const nodeB = new Node('2', 'B');
    const nodeC = new Node('3', 'C');
    const nodeD = new Node('4', 'D');
    const nodeE = new Node('5', 'E');
    const nodeF = new Node('6', 'F');
    const nodeG = new Node('7', 'G');
    const nodeH = new Node('8', 'H');

    nodeA.append(nodeB);
    nodeC.append(nodeD);
    nodeE.append(nodeF);
    nodeG.append(nodeH);

    nodeB.append(nodeG); // A->B->G->H

    expect(nodeG.left).toBe(nodeB);

    nodeB.append(nodeC); // A->B->->C->D->G->H

    expect(nodeG.left).toBe(nodeD);
    expect(nodeD.right).toBe(nodeG);

    nodeG.prepend(nodeE); // A->B->->C->D->E->F->G->H

    expect(nodeG.left).toBe(nodeF);
    expect(nodeF.right).toBe(nodeG);
  });
});
