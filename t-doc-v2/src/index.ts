import { createIncrement } from '@repo/shared';
export type CommitHandler = (operations: OperationToken[]) => Promise<void>;

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
  readonly document = new Map<ID, Node>();
  root: Node | undefined;
  pendingOperations: OperationToken[] = [];
  commitFunction?: CommitHandler;

  constructor(
    private clientID: string,
    commitFunction?: CommitHandler,
  ) {
    this.commitFunction = commitFunction;
  }

  private genNode(content: Node['content'], left?: ID, right?: ID): Node {
    return {
      author: this.clientID,
      id: increment(),
      content,
      left,
      right,
    };
  }
  update(id: ID, content: string): void {
    const node = this.document.get(id);
    if (!node) throw new Error('존재하지 않는 Node 입니다.');
    node.content = content;
    this.pendingOperations.push(OperationToken.gen('update', node));
  }
  insert(content: string, left?: ID): ID {
    const leftNode = this.document.get(left!);

    const hasRoot = Boolean(this.root);

    // has root
    if (hasRoot && !leftNode) throw new Error('잘못된 경로 입니다.');

    const node = this.genNode(content, left);
    // 중복 처리

    if (leftNode) {
      node.left = leftNode.id;
      node.right = leftNode.right;
      leftNode.right = node.id;
    }
    if (!hasRoot) this.root = node;
    this.document.set(node.id, node);
    this.pendingOperations.push(OperationToken.gen('insert', node));
    return node.id;
  }

  split(id: ID, index: number) {
    const node = this.document.get(id);
    if (!node) throw new Error('존재하지 않는 Node 입니다.');

    const rightContent = node.content.slice(index);
    this.update(node.id, node.content.slice(0, index));
    const newId = this.insert(rightContent, node.id);
    return this.document.get(newId)!;
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
    this.pendingOperations.push(OperationToken.gen('remove', node));
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
        this.insert(op.node.content!, op.node.left);
      } else if (op.type === 'remove') {
        this.remove(op.node.id);
      } else if (op.type === 'update') {
        this.update(op.node.id, op.node.content);
      }
    });
  }
}
