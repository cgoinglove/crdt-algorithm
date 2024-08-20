import { describe, it, expect } from 'vitest';
import { createNodeManager } from '../src/node'; // 파일 경로에 맞게 수정하세요

describe('Node 클래스 및 createNodeManager 테스트', () => {
  describe('createNodeManager 기본 기능 테스트', () => {
    const nodeManager = createNodeManager();

    it('노드를 정상적으로 생성하고 캐시에 저장', () => {
      const node = nodeManager.create('1', 'A');
      expect(node.value).toBe('A');
      expect(node.id).toBe('1');
      expect(node.deleted).toBe(false);
    });

    it('생성된 노드를 find 메서드로 검색', () => {
      const node = nodeManager.find('1');
      expect(node).toBeDefined();
      expect(node?.value).toBe('A');
    });

    it('존재하지 않는 ID를 검색하면 undefined를 반환', () => {
      const node = nodeManager.find('999');
      expect(node).toBeUndefined();
    });
  });

  describe('Node 클래스 메서드 append 및 prepend 테스트', () => {
    const nodeManager = createNodeManager();

    it('append를 통해 노드를 연결', () => {
      const nodeA = nodeManager.create('2', 'A');
      const nodeB = nodeManager.create('3', 'B');

      nodeA.append(nodeB);

      expect(nodeA.right).toBe(nodeB);
      expect(nodeB.left).toBe(nodeA);
    });

    it('prepend를 통해 노드를 연결', () => {
      const nodeA = nodeManager.create('4', 'A');
      const nodeB = nodeManager.create('5', 'B');

      nodeB.prepend(nodeA);

      expect(nodeB.left).toBe(nodeA);
      expect(nodeA.right).toBe(nodeB);
    });

    it('append로 중간에 노드를 삽입', () => {
      const nodeA = nodeManager.create('6', 'A');
      const nodeB = nodeManager.create('7', 'B');
      const nodeC = nodeManager.create('8', 'C');

      nodeA.append(nodeB);
      nodeA.append(nodeC); // nodeA와 nodeB 사이에 nodeC 삽입

      expect(nodeA.right).toBe(nodeC);
      expect(nodeC.left).toBe(nodeA);
      expect(nodeC.right).toBe(nodeB);
      expect(nodeB.left).toBe(nodeC);
    });
  });

  describe('Node 삭제 기능 테스트', () => {
    const nodeManager = createNodeManager();

    it('노드를 삭제하면 deleted 플래그가 true로 설정됨', () => {
      const node = nodeManager.create('9', 'A');
      node.delete();
      expect(node.deleted).toBe(true);
    });

    it('삭제 후에도 append 및 prepend 기능은 정상 작동', () => {
      const nodeA = nodeManager.create('10', 'A');
      const nodeB = nodeManager.create('11', 'B');

      nodeA.delete();
      nodeA.append(nodeB);

      expect(nodeA.deleted).toBe(true);
      expect(nodeA.right).toBe(nodeB);
      expect(nodeB.left).toBe(nodeA);
    });
  });
});
