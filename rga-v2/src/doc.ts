import {
  NodeCommand,
  NodeInsertCommand,
  NodeDeleteCommand,
  generateNodeCommand,
} from './command';
import { ClockId } from './id';
import { ID, Operation, RGA } from './interface';
import { Node } from './node';
import { OperationToken } from './operation-token';

const compareToken = (a: Operation, b: Operation) =>
  ClockId.compare(a.id, b.id);

export class Doc<T> implements RGA<T> {
  private head!: Node<Operation<T>>;
  private staging!: NodeCommand<T>[];
  private cursor!: number; // for undo,redo
  private clock!: ClockId;
  private buffer!: {
    insert: Operation[];
    delete: Operation[];
  };
  private operations!: {
    insert: Map<
      ID,
      {
        operation: Operation;
        children: Operation[];
      }
    >;
    delete: Set<ID>;
  };
  constructor(public readonly client: string) {
    this.init();
  }
  init() {
    const root = new Node<T>('DOC-ROOT', undefined as unknown as T);
    root.delete();
    this.head = root;
    this.buffer = {
      insert: [],
      delete: [],
      update: [],
    };
    this.operations = {
      insert: new Map(),
      delete: new Set(),
      update: new Map(),
    };
    this.staging = [];
    this.clock = new ClockId(this.client);
    this.cursor = 0;
  }
  undo() {
    const command = this.staging.pop();
    command?.undo();
  }

  private resolveConflict(operation: Operation<T>): Operation<T> | undefined {
    const op = OperationToken.copy(operation);
    switch (operation.type) {
      case 'insert': {
        const duplicate =
          this.operations.insert.get(op.parent!)?.children ?? [];
        const parent = duplicate.find(dp => compareToken(op, dp) == -1);
        if (parent) {
          op.parent = parent.id;
          return this.resolveConflict(op);
        }
        return op;
      }
      case 'delete': {
        if (!this.operations.delete.has(operation.id)) return undefined;
      }
    }
    return op;
  }

  private apply(operation: Operation<T>) {
    switch (operation.type) {
      case 'insert':
        {
          if (
            operation.parent &&
            !this.operations.insert.has(operation.parent)
          ) {
            this.buffer.insert.push(operation);
            return;
          }
        }

        break;
      case 'delete':
        {
          if (!this.operations.insert.has(operation.id)) {
            this.buffer.delete.push(operation);
            return;
          }
        }
        break;
    }
    const resolve = this.resolveConflict(operation);
    if (!resolve) return;

    const command = generateNodeCommand(resolve);
    command.execute(this.head);
    return command;
  }
  private commit(operation: Operation) {
    const command = this.apply(operation);
    if (!command) throw new Error('Fail Operation');
    this.staging.push(command);
    return operation;
  }
  insert(value: T, parent?: ID) {
    const operation = OperationToken.ofInsert({
      id: this.clock.gen(),
      value,
      parent,
    });
    return this.commit(operation);
  }
  update(id: ID, value: T) {
    const operation = OperationToken.ofUpdate({
      id,
      value,
      clock: this.clock.gen(),
    });
    return this.commit(operation);
  }
  delete(id: ID) {
    const operation = OperationToken.ofDelete<T>({
      id,
    });
    return this.commit(operation);
  }
  pull(operations: Commit<T>): void {
    // if (this.commits.has(commit.version)) return;
    // this.commits.set(commit.version, commit);
    // this.clock.updateClock(ClockId.extract(commit.version).clock);
  }

  push() {
    const commands = this.staging
      .splice(0, this.staging.length)
      .filter(command => command.executed);

    const groupByType = commands.reduce(
      (prev, cur) => {
        prev[cur.operation.type].set(cur.operation.id, cur);
        return prev;
      },
      {
        update: new Map(),
        delete: new Map(),
        insert: new Map(),
      } as Record<Operation['type'], Map<ID, NodeCommand<T>>>,
    );

    Array.from(groupByType.insert.values())
      .reverse()
      .forEach(command => {
        const op = command.operation;
        if (groupByType.update.has(op.id)) {
          op.value = groupByType.update.get(op.id)!.operation.value;
          groupByType.update.delete(op.id);
        }

        if (groupByType.delete.has(op.id)) {
          groupByType.delete.delete(op.id);
          groupByType.insert.delete(op.id);
          this.head.find(op.id)?.delete();
        }

        const node = this.head.find(op.id);

        if (op.parent && node?.left?.deleted) {
          let parent: Node<T> | undefined = node?.left;
          while (parent && parent.deleted) {
            parent = parent?.left;
          }
          command.undo();
          op.parent = parent?.id;
          new NodeInsertCommand(op).execute(this.head);
        }
      });

    return {
      insert: Array.from(groupByType.insert.values()).map(v => v.operation),
      delete: Array.from(groupByType.delete.values()).map(v => v.operation),
      update: Array.from(groupByType.update.values()).map(v => v.operation),
    };
  }
  list(): Node<T>[] {
    const list: Node<T>[] = [];
    let node: Node<T> | undefined = this.head;
    while (node) {
      if (!node.deleted) list.push(node);
      node = node.right;
    }
    return list;
  }
}
