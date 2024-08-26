import { compareToken, createId, extractId, updateClock } from './id';
import { ID, Operation, RGA } from './interface';
import { createNodeManager, Node } from './node';
import { OperationToken } from './operation-token';

export type CommitHandler<T = any> = (
  operations: Operation[],
  rollback: () => void,
) => T;

type ParentID = ID;
export class Doc<T = OperationToken[]> implements RGA {
  private head: Node | undefined;
  private nodeManager: ReturnType<typeof createNodeManager>;

  private buffer: Operation[];

  private staging: {
    insert: Map<ID, Operation>;
    delete: Map<ID, Operation>;
  };

  private logs: {
    delete: Map<ID, Operation>;
    insert: Map<ParentID, Map<ID, Operation>>;
  };

  constructor(
    public readonly client: string,
    private commitHandler?: CommitHandler<T>,
  ) {
    this.nodeManager = createNodeManager();

    this.buffer = [];

    this.staging = {
      delete: new Map(),
      insert: new Map(),
    };
    this.logs = {
      delete: new Map(),
      insert: new Map(),
    };
  }
  private findNode(id: ID): Node | undefined {
    return this.nodeManager.find(id);
  }
  private applyInsert(operation: Operation) {
    const parent = this.findNode(operation.parent!);
    if (operation.parent && !parent)
      throw new Error(
        `[${this.client}] Not Found Parent ${OperationToken.hash(operation)}`,
      );
    const newNode: Node = this.nodeManager.create(
      operation.id,
      operation.content!,
    );
    if (parent) return parent.append(newNode);
    if (this.head) newNode.append(this.head);
    this.head = newNode;
  }
  private applyDelete(operation: Operation): void {
    const target = this.findNode(operation.id);
    target?.delete();
  }
  private addStage(token: Operation) {
    switch (token.type) {
      case 'delete':
        {
          const duplicate = this.staging.insert.has(token.id);
          if (duplicate) {
            this.staging.insert.delete(token.id);
            this.nodeManager.forceDelete(token.id);
          } else {
            this.staging.delete.set(token.id, token);
          }
        }
        break;

      case 'insert': {
        this.staging.insert.set(token.id, token);
      }
    }
  }
  private addLog(tokens: Operation | Operation[]) {
    const commit = [tokens].flat();
    commit.forEach(token => {
      switch (token.type) {
        case 'delete':
          !this.logs.delete.has(token.id) &&
            this.logs.delete.set(token.id, token);
        case 'insert': {
          if (!this.logs.insert.has(token.parent as ID)) {
            this.logs.insert.set(token.parent as ID, new Map());
          }
          this.logs.insert.get(token.parent as ID)?.set(token.id, token);
        }
      }
    });
  }
  private deleteLog(tokens: Operation | Operation[]) {
    const commit = [tokens].flat();
    commit.forEach(token => {
      switch (token.type) {
        case 'delete':
          this.logs.delete.delete(token.id);
        case 'insert': {
          this.logs.insert.get(token.parent as ID)?.delete(token.id);
        }
      }
    });
  }
  undo() {
    'undo';
  }

  commit(): T {
    const tokens = [
      ...Array.from(this.staging.insert.values()),
      ...Array.from(this.staging.delete.values()),
    ].sort(compareToken);
    this.staging.insert.clear();
    this.staging.delete.clear();
    this.addLog(tokens);
    const rollback = () => {
      tokens.forEach(this.addStage.bind(this));
      this.deleteLog(tokens);
    };
    if (this.commitHandler) {
      return this.commitHandler(tokens, rollback);
    }
    return tokens as T;
  }
  insert(content: string, parent?: ID): Operation {
    const token = OperationToken.ofInsert({
      id: createId(this.client),
      content,
      parent,
    });
    this.applyInsert(token);
    this.addStage(token);
    return token;
  }
  delete(id: ID): Operation {
    const token = OperationToken.ofDelete({
      id,
    });
    this.applyDelete(token);
    this.addStage(token);
    return token;
  }
  stringify(): string {
    let node = this.head;
    let result = '';
    while (node) {
      if (!node.deleted) result += node.value;
      node = node.right;
    }
    return result;
  }
  private conflictResolution(token: Operation): Operation | undefined {
    const resolveToken = OperationToken.copy(token);
    switch (token.type) {
      case 'delete':
        {
          if (this.logs.delete.has(token.id)) {
            this.staging.delete.delete(token.id);
            return;
          }
          if (!this.findNode(token.id)) {
            this.buffer.push(token);
            return;
          }
        }
        break;
      case 'insert':
        {
          const duplicateTokens = Array.from(
            this.logs.insert.get(token.parent as ID)?.values() ?? [],
          ).sort(compareToken);
          if (duplicateTokens.length) {
            resolveToken.parent =
              duplicateTokens.find(op => compareToken(op, token) == 1)?.id ||
              resolveToken.parent;
          }
          if (token.parent && !this.findNode(token.parent)) {
            this.buffer.push(token);
            return;
          }
        }
        break;
    }
    return resolveToken;
  }
  merge(token: Operation | Operation[]): void {
    const tokens = [token].flat().sort(compareToken);
    if (!tokens.length) return;

    const lastClock = extractId(tokens.at(-1)!.id).clock;
    updateClock(lastClock);

    const staged = [
      ...Array.from(this.staging.insert.values()),
      ...Array.from(this.staging.delete.values()),
    ];
    this.addLog(staged);

    const buffer = this.buffer.splice(-this.buffer.length);
    try {
      [...tokens, ...buffer].forEach(op => {
        const resolve = this.conflictResolution(op);
        switch (resolve.type) {
          case 'delete':
            this.applyDelete(resolve);
            break;
          case 'insert':
            this.applyInsert(resolve);
            break;
        }
        this.addLog(op);
      });
    } catch (error) {
      this.buffer = buffer;
      this.deleteLog(tokens);
      throw error;
    } finally {
      this.deleteLog(staged);
    }
  }
}