export type OID = [author: number, clock: number];

export type CommitHandler = (operations: OperationToken[]) => Promise<void>;

export class OperationToken {
  type: 'insert' | 'remove';
  id: OID;
  text?: string;

  private constructor(type: 'insert' | 'remove', id: OID, text?: string) {
    this.type = type;
    this.id = id;
    this.text = text;
  }

  static of(type: 'insert' | 'remove', id: OID, text?: string): OperationToken {
    return new OperationToken(type, id, text);
  }

  static fromHash(hash: string): OperationToken {
    const [type, id, text] = JSON.parse(hash);
    return OperationToken.of(type as 'insert' | 'remove', id, text);
  }

  hash(): string {
    return JSON.stringify([this.type, this.id, this.text || '']);
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
  // split(offset: number): Node {
  //   const newItem = new Node(this.id, this.content.slice(offset));
  //   this.content = this.content.slice(0, offset);
  //   newItem.right = this.right;
  //   if (this.right) {
  //     this.right.left = newItem;
  //   }
  //   this.right = newItem;
  //   newItem.left = this;
  //   return newItem;
  // }

  // deleteRange(start: number, end: number): void {
  //   this.content = this.content.slice(0, start) + this.content.slice(end);
  // }
}
export class DocumentTree {
  root: Node | null = null;
  clientID: number;
  clock: number = 0;
  pendingOperations: OperationToken[] = [];
  commitFunction?: CommitHandler;

  constructor(clientID: number, commitFunction?: CommitHandler) {
    this.clientID = clientID;
    this.commitFunction = commitFunction;
  }

  generateID(): OID {
    return [this.clientID, this.clock++];
  }

  insert(content: string, prev?: OID): OID {
    const id = this.generateID();
    const node = new Node(id, content);
    if (!this.root) {
      this.root = node;
    } else {
      const prevNode = this.findItem(prev);
      if (!prevNode) throw new Error('잘못된 경로');
      const nextNode = prevNode?.next;
      prevNode.next = node;
      node.next = nextNode;
    }
    this.pendingOperations.push(OperationToken.of('insert', id, content));
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
          prev = null;
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
    tokens.forEach(op => {
      if (op.type === 'insert') {
        this.insert(op.text!, op.id);
      } else if (op.type === 'remove') {
        this.remove(op.id);
      }
    });
  }
}
