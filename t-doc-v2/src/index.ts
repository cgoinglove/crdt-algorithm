export type OID = [author: number, clock: number];

export type CommitHandler = (operations: OperationToken[]) => Promise<void>;
export class OperationToken {
  type: 'insert' | 'remove';
  id: OID;
  prevId?: OID;
  content?: string;
  timestamp: number; // New field to handle ordering

  private constructor(
    type: 'insert' | 'remove',
    id: OID,
    prevId?: OID,
    content?: string,
    timestamp: number = Date.now(),
  ) {
    this.type = type;
    this.id = id;
    this.prevId = prevId;
    this.content = content;
    this.timestamp = timestamp;
  }

  static of(
    type: 'insert' | 'remove',
    id: OID,
    prevId?: OID,
    content?: string,
    timestamp?: number,
  ): OperationToken {
    return new OperationToken(type, id, prevId, content, timestamp);
  }

  static fromHash(hash: string): OperationToken {
    const [type, id, prevId, content, timestamp] = JSON.parse(hash);
    return OperationToken.of(
      type as 'insert' | 'remove',
      id,
      prevId,
      content,
      timestamp,
    );
  }

  hash(): string {
    return JSON.stringify([
      this.type,
      this.id,
      this.prevId,
      this.content || '',
      this.timestamp,
    ]);
  }
}

class Node {
  id: OID;
  content: string;
  next?: Node;

  constructor(id: OID, content: string) {
    this.id = id;
    this.content = content;
  }
}
export class DocumentTree {
  private clientID: number;
  private clock: number = 0;
  private commitFunction?: CommitHandler;

  root: Node | undefined;
  pendingOperations: OperationToken[] = [];

  constructor(clientID: number, commitFunction?: CommitHandler) {
    this.clientID = clientID;
    this.commitFunction = commitFunction;
  }

  generateID(): OID {
    return [this.clientID, this.clock++];
  }

  insert(content: string, prevId?: OID): OID {
    const id = this.generateID();
    const node = new Node(id, content);
    if (!this.root) {
      this.root = node;
    } else {
      if (!prevId) throw new Error('이전 아이디는 필수');
      const prevNode = this.findItem(prevId);
      if (!prevNode) throw new Error('잘못된 경로');
      const nextNode = prevNode?.next;
      prevNode.next = node;
      node.next = nextNode;
    }
    this.pendingOperations.push(
      OperationToken.of('insert', id, prevId, content),
    );
    return id;
  }

  remove(id: OID): void {
    const item = this.findItem(id);
    if (!item) throw new Error('잘못된 경로');
    if (item == this.root) {
      this.root = this.root?.next;
    } else {
      let prev = this.root;
      while (prev?.next) {
        if (this.compareID(prev.next.id, id) === 0) {
          prev.next = item.next;
          prev = undefined;
          break;
        }
        prev = prev.next;
      }
    }

    this.pendingOperations.push(OperationToken.of('remove', id));
  }

  findItem(id: OID): Node | null {
    let current = this.root;
    while (current) {
      if (this.compareID(current.id, id) === 0) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  compareID(id1: OID, id2: OID): number {
    if (id1[0] === id2[0]) {
      return id1[1] - id2[1];
    }
    return id1[0] - id2[0];
  }

  stringify(): string {
    let result = '';
    let current = this.root;
    while (current) {
      result += current.content;
      current = current.next;
    }
    return result;
  }

  async commit(): Promise<void> {
    if (this.pendingOperations.length > 0) {
      await this.commitFunction?.(this.pendingOperations);
      this.pendingOperations = [];
    }
  }

  merge(token: OperationToken | OperationToken[]): void {
    const tokens = Array.isArray(token) ? token : [token];
    tokens.sort((a, b) => {
      if (a.prevId === b.prevId) {
        return a.timestamp - b.timestamp || a.id[0] - b.id[0];
      }
      return 0;
    });

    tokens.forEach(op => {
      if (op.type === 'insert') {
        // Adjust to allow multiple inserts at the same prevId
        const prevNodeExists = this.findItem(op.prevId!);
        if (prevNodeExists) {
          this.insert(op.content!, op.prevId);
        } else {
          // If previous node doesn't exist, insert at root
          // But typically should handle reordering or flagging this operation
          this.insert(op.content!, undefined);
        }
      } else if (op.type === 'remove') {
        this.remove(op.id);
      }
    });
  }
}
