type OID = [index: number, priority: number];

/**
 * 실제 서버에 저장되고 유저가 최초 진입시 받을 도큐먼트의 엘리먼트
 */
interface Node {
  /**
   * 문자열
   */
  text: string;
  /**
   * 순서를 정할 수 있는 고유 아이디
   */
  id: OID;
}

/**
 * 유저의 편집 작업
 */
interface OperationToken {
  type: 'insert' | 'remove';
  id: OID;
  text?: string; // insert에만 필요
}

/**
 * CRDT 클래스 인터페이스
 */
interface TextCRDT {
  /**
   * 현재 도큐먼트를 문자열로 변환
   */
  stringify(): string;

  /**
   * 도큐먼트에 새로운 노드를 삽입
   */
  insert(text: string, preId?: OID, postID?: OID): void;

  /**
   * 도큐먼트에서 노드를 제거
   */
  remove(id: OID): void;

  /**
   * 받은 오퍼레이션 토큰(들)을 도큐먼트에 반영
   */
  merge(token: OperationToken | OperationToken[]): void;

  /**
   * 대기 중인 오퍼레이션들을 다른 피어들에게 전송하고 비움
   */
  commit(): Promise<void>;
}

type CommitHandler = (operations: OperationToken[]) => Promise<void>;
