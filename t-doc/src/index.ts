type StableKey = `${number}-${number}`;
export class TextDocumentOperator implements TextCRDT {
  private keyMap: Map<StableKey, OID> = new Map();

  document: Map<OID, string> = new Map();
  pendingOperations: OperationToken[] = [];

  constructor(
    private author: number,
    private commitFunction?: CommitHandler,
  ) {}

  private toStableKey(id: OID): StableKey {
    return id.join('-') as StableKey;
  }

  private setDocument(id: OID, text: string) {
    this.keyMap.set(this.toStableKey(id), id);
    this.document.set(id, text);
  }
  private deleteDocument(id: OID) {
    const key = this.toStableKey(id);
    const stableId = this.keyMap.get(key);
    this.keyMap.delete(key);
    this.document.delete(stableId!);
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

  private generateId(prevId?: OID, postId?: OID): OID {
    const index = (() => {
      if (prevId?.[0] == undefined) return 0;
      if (postId?.[0] != undefined) return (prevId[0] + postId[0]) / 2;
      return prevId[0] + 1;
    })();

    const priority = Date.now() + this.author;
    let newId: OID = [index, priority];

    while (this.keyMap.has(this.toStableKey(newId))) {
      newId = [index, newId[1] + 1];
    }
    return newId;
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
        this.setDocument(op.id, op.text!);
      } else if (op.type === 'remove') {
        this.deleteDocument(op.id);
      }
    });
  }
  /** unstable */
  insert(text: string, preId?: OID, postId?: OID): OID {
    const id: OID = this.generateId(preId, postId);
    this.setDocument(id, text);
    this.pendingOperations.push(this.generateToken('insert', id, text));
    return id;
  }

  remove(id: OID): void {
    if (this.keyMap.has(this.toStableKey(id))) {
      this.deleteDocument(id);
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
