import { describe, it, expect } from 'vitest';
import {Logoot, Operation} from '../src/logoot';


describe('Logoot', () => {
  it('should insert characters correctly', () => {
    const logoot = new Logoot();
    logoot.insert(0, 'H');
    logoot.insert(1, 'e');
    logoot.insert(2, 'l');
    logoot.insert(3, 'l');
    logoot.insert(4, 'o');

    expect(logoot.getDocument()).toBe('Hello');
  });

  it('should remove characters correctly', () => {
    const logoot = new Logoot();
    logoot.insert(0, 'H');
    logoot.insert(1, 'e');
    logoot.insert(2, 'l');
    logoot.insert(3, 'l');
    logoot.insert(4, 'o');
    logoot.remove(2);

    expect(logoot.getDocument()).toBe('Helo');
  });

  it('should merge operations correctly', () => {
    const logoot1 = new Logoot();
    const logoot2 = new Logoot();

    logoot1.insert(0, 'H');
    logoot1.insert(1, 'e');
    logoot2.insert(0, 'W');
    logoot2.insert(1, 'o');

    const ops:Operation[] = [
      { type: 'insert', posId: logoot2.document[0].pos, character: 'W' },
      { type: 'insert', posId: logoot2.document[1].pos, character: 'o' },
    ];

    logoot1.merge(ops);


    expect(logoot1.getDocument()).toBe('WoHe');
  });
});
