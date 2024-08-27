import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CommitContext } from '../context/commit.context.tsx';

import { Doc, ID } from 'rga';
import { MockSocket } from '../lib/mock-socket.ts';

export const useDoc = (client: string) => {
  const context = useContext(CommitContext);

  if (!context) throw new Error('Not Found RGAContext Provider.');

  const [network, setNetwork] = useState(true);

  const [text, setText] = useState('');

  const document = useMemo(() => {
    const doc = new Doc(client);
    return doc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const versions = useRef<string[]>([]);

  const getNode = (index: number) => {
    if (index < 0) return undefined;
    let node = document.head;

    while (node) {
      if (!node.deleted) break;
      node = node?.right;
    }

    while (node && index > 0) {
      if (!node.deleted) index--;
      node = node.right;
    }
    return node;
  };

  useEffect(() => {
    if (network) {
      context.pull(versions.current).forEach(commit => {
        versions.current.push(commit.version);
        document.merge(commit.operations);
      });
      setText(document.stringify());
      const off = MockSocket.on('commit', commit => {
        versions.current.push(commit.version);
        if (commit.author == client) return;
        document.merge(commit.operations);
        setText(document.stringify());
      });
      return off;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  return {
    text,
    input(index: number, char: string) {
      document.insert(char, getNode(index - 1)?.id as ID);
      setText(document.stringify());
    },
    delete(index: number) {
      document.delete(getNode(index - 1)?.id as ID);
      setText(document.stringify());
    },
    commit: () => {
      console.log(`commit`);
      MockSocket.emit('commit', {
        author: client,
        operations: document.commit(),
        version: Date.now().toString(),
      });
    },
    setNetwork,
  };
};
