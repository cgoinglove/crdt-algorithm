import { createIncrement } from '@repo/shared';
export type CommitHandler = (operations: OperationToken[]) => any;

export class OperationToken implements Operation {
  private constructor(
    public readonly type: Operation['type'],
    public readonly node: Operation['node'],
    public readonly timestamp: Operation['timestamp'],
  ) {}

  static gen(type: Operation['type'], node: Operation['node']): OperationToken {
    return new OperationToken(type, node, Date.now());
  }

  static fromHash(hash: string): OperationToken {
    const [type, node, timestamp] = JSON.parse(hash);
    return new OperationToken(type, node, timestamp);
  }

  hash(): string {
    return JSON.stringify([this.type, this.node, this.timestamp]);
  }
}

const increment = createIncrement();

export class DocumentOperator implements CRDT {
  document = new Map<ID, Node>();
  root: Node | undefined;
  pendingOperations: OperationToken[] = [];

  constructor(private clientID: string) {}

  private pushPendingOperations(type: OperationToken['type'], node: Node) {
    if (node.author === this.clientID)
      this.pendingOperations.push(OperationToken.gen(type, node));
  }

  gen(content: Node['content'], left?: ID, right?: ID): Node {
    return {
      author: this.clientID,
      id: increment(),
      content,
      left,
      right,
    };
  }

  update(node: Node): void {
    const localNode = this.document.get(node.id);
    if (!localNode) throw new Error('존재하지 않는 Node 입니다.');
    localNode.content = node.content;
    this.pushPendingOperations('update', localNode);
  }
  insert(node: Node) {
    console.log(`insert ${this.clientID}`);
    const leftNode = this.document.get(node.left!) || this.root;

    if (!leftNode) this.root = node;
    else {
      node.left = leftNode.id;
      node.right = leftNode.right;
      leftNode.right = node.id;
    }

    this.document.set(node.id, node);
    this.pushPendingOperations('insert', node);
    return node.id;
  }

  split(id: ID, index: number) {
    const leftNode = this.document.get(id);
    if (!leftNode) throw new Error('존재하지 않는 Node 입니다.');

    const leftContent = leftNode.content.slice(0, index);
    const rightContent = leftNode.content.slice(index);

    leftNode.content = leftContent;
    const rightNode = this.gen(rightContent, leftNode.id);

    this.update(leftNode);
    this.insert(rightNode);
  }

  remove(id: ID): void {
    const node = this.document.get(id);
    if (!node) throw new Error('존재하지 않는 Node 입니다.');

    const leftNode = this.document.get(node.left!);
    const rightNode = this.document.get(node.right!);

    if (!leftNode) {
      this.root = rightNode;
    }

    if (leftNode) {
      leftNode.right = rightNode?.id;
    }
    if (rightNode) {
      rightNode.left = leftNode?.id;
    }

    this.document.delete(id);
    this.pushPendingOperations('remove', node);
  }
  stringify(): string {
    let node = this.root;
    let result = '';
    while (node) {
      result += node.content;
      node = this.document.get(node.right!);
    }
    return result;
  }

  commit() {
    return this.pendingOperations.splice(-this.pendingOperations.length);
  }

  merge(token: OperationToken | OperationToken[]): void {
    const tokens = [token].flat();
    tokens.forEach(op => {
      switch (op.type) {
        case 'insert':
          this.insert(op.node);
          break;
        case 'update':
          this.update(op.node);
          break;
        case 'remove':
          this.remove(op.node.id);
          break;
      }
    });
  }
}
