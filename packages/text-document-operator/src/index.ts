export class TextDocumentOperator implements TextCRDT {
  private document: Map<OID, string> = new Map();
  private pendingOperations: OperationToken[] = [];

  constructor(
    private author: number,
    private commitFunction?: CommitHandler,
  ) {}

  private genarateId(prevId?: OID, postId?: OID): OID {
    return [1, Date.now() + this.author];
  }

  private generateToken(
    type: 'insert' | 'remove',
    id: OID,
    text?: string,
  ): OperationToken {
    return {
      type,
      id,
      text,
    };
  }

  stringify(): string {
    return Array.from(this.document.entries())
      .sort(([idA], [idB]) => {
        if (idA[0] === idB[0]) {
          return idA[1] - idB[1];
        }
        return idA[0] - idB[0];
      })
      .reduce((prev, cur) => prev + cur[1], '');
  }

  /** unstable */
  merge(token: OperationToken | OperationToken[]): void {
    const tokens = [token].flat();
    tokens.forEach(op => {
      if (op.type === 'insert') {
        this.document.set(op.id, op.text!);
      } else if (op.type === 'remove') {
        this.document.delete(op.id);
      }
    });
  }
  /** unstable */
  insert(text: string, preId?: OID, postId?: OID): void {
    const id: OID = this.genarateId(preId, postId);
    this.document.set(id, text);
    this.pendingOperations.push(this.generateToken('insert', id, text));
  }

  remove(id: OID): void {
    if (this.document.has(id)) {
      this.document.delete(id);
      this.pendingOperations.push(this.generateToken('remove', id));
    }
  }

  async commit(): Promise<void> {
    if (this.pendingOperations.length > 0) {
      await this.commitFunction?.(this.pendingOperations);
      this.pendingOperations = [];
    }
  }
}
