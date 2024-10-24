import { Operation } from './interface';

export class OperationToken<Item = any> implements Operation<Item> {
  private constructor(
    public type: Operation<Item>['type'],
    public id: Operation<Item>['id'],
    public parent?: Operation<Item>['parent'],
    public value?: Item,
  ) {}

  static ofInsert<T = any>(operation: Omit<Operation<T>, 'type'>) {
    return new OperationToken<T>(
      'insert',
      operation.id,
      operation.parent,
      operation.value,
    );
  }
  static ofDelete<T>(operation: Pick<Operation<T>, 'id'>) {
    return new OperationToken<T>('delete', operation.id);
  }
  static hash(token: Operation<any>): string {
    const args: any[] = [token.type, token.id];
    if (token.type == 'insert') args.push(token.parent, token.value);
    return JSON.stringify(args);
  }
  static copy<T>(token: Operation<T>): Operation<T> {
    return OperationToken.fromHash(OperationToken.hash(token));
  }
  static fromHash<T>(hash: string): OperationToken<T> {
    const [type, id, parent, content] = JSON.parse(hash);
    switch (type as Operation<T>['type']) {
      case 'insert':
        return new OperationToken(type, id, parent ?? undefined, content);
      case 'delete':
        return new OperationToken(type, id);
      default:
        throw new Error('TypeError');
    }
  }
}
