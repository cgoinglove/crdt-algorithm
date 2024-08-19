import { compareToken, createId, extractId, updateClock } from './id';

import { OperationToken } from './operation-token';

export type preCommit<T = any> = (
  operations: Operation[],
  rollback: () => void,
) => T;

export class Doc<T = Operation[]> implements RGA {
  private document: Node<string> | undefined;
  private staging: Record<Operation['type'], Map<ID, Operation>>;
  // for undo
  private histories: Operation[];
  // for merge
  private commitLogs: Operation[][];

  constructor(
    public readonly client: string,
    private preCommit?: preCommit<T>,
  ) {
    this.staging = {
      insert: new Map(),
      delete: new Map(),
    };
    this.commitLogs = [];
    this.histories = [];
  }

  private findParentNode(id: ID): Node | undefined {
    if (this.document?.id == id) return undefined;
    let current: Node | undefined = this.document;
    while (current?.next) {
      if (current.next.id == id) return current;
      if (current.id == id) return;
      current = current.next;
    }
  }
  private findNode(id: ID): Node | undefined {
    if (id == this.document?.id) return this.document;
    return this.findParentNode(id)?.next;
  }

  private applyInsert(operation: Operation) {
    const parent = this.findNode(operation.parent!);
    if (operation.parent && !parent) throw new Error('Not Found Parent');
    const newNode: Node = {
      content: operation.content!,
      id: operation.id,
      next: parent ? parent.next : this.document,
    };
    if (parent) parent.next = newNode;
    else this.document = newNode;
  }
  private applyDelete(operation: Operation): void {
    const target = this.findNode(operation.id);
    if (!target) throw new Error('Not Found Node');
    target.delete = true;
  }
  private addStage(token: Operation) {
    /** 커밋되지 않은 중복된 operation 처리*/
    if (token.type == 'delete' && this.staging.insert.has(token.id)) {
      this.staging.insert.delete(token.id);
      const parent = this.findParentNode(token.id);
      if (parent) parent.next = parent.next?.next;
    } else this.staging[token.type].set(token.id, token);
    this.histories.push(token);
  }
  undo(depth: number = 1) {
    'undo';
  }
  commit(): T {
    const histories = this.histories.splice(-this.histories.length);

    const insertTokens = Array.from(this.staging.insert.values());
    this.staging.insert.clear();
    const deleteTokens = Array.from(this.staging.delete.values());
    this.staging.delete.clear();

    const list = [...insertTokens, ...deleteTokens].sort(compareToken);

    this.commitLogs.push(list);

    const rollback = () => {
      insertTokens.forEach(token => this.staging.insert.set(token.id, token));
      deleteTokens.forEach(token => this.staging.delete.set(token.id, token));
      this.histories.unshift(...histories);
      this.commitLogs = this.commitLogs.filter(commit => commit == list);
    };

    if (this.preCommit) return this.preCommit(list, rollback);
    return list as T;
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
    let node = this.document;
    let result = '';
    while (node) {
      if (!node.delete) result += node.content;
      node = node.next;
    }
    return result;
  }

  private conflictResolution(tokens: Operation[]): Operation[] {
    const insertConflictTokens = this.commitLogs
      .flat()
      .reduce<{ [parentId: ID]: Operation[] }>((prev, node) => {
        const parent = node.parent;
        prev[parent as ID] ??= [];
        prev[parent as ID].push(node);
        return prev;
      }, {});
    return tokens.filter(token => {
      switch (token.type) {
        case 'delete': {
          const duplicateOperation = this.staging.delete.has(token.id);
          if (duplicateOperation) {
            this.staging.delete.delete(token.id);
            return false;
          }
          break;
        }
        case 'insert':
          {
            const conflict = insertConflictTokens[token.parent as ID];
            if (conflict) {
              console.log({ conflict, token });
              token.parent = this.findParentNode(
                conflict.find(compareToken.bind(null, token))!.id,
              )?.id;
              console.log(token.parent, 'token.parent');
            }
          }
          break;
      }

      return token;
    });
  }

  merge(token: Operation | Operation[]): void {
    const tokens = [token].flat().sort(compareToken);
    if (!tokens.length) return;

    const lastClock = extractId(tokens.at(-1)!.id).clock;
    updateClock(lastClock);

    const resolveTokens = this.conflictResolution(tokens);
    resolveTokens.forEach(op => {
      switch (op.type) {
        case 'delete':
          this.applyDelete(op);
          break;
        case 'insert':
          this.applyInsert(op);
          break;
      }
    });
    this.commitLogs = [];
  }
}
