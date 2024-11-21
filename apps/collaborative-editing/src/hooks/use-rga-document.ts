/* eslint-disable react-hooks/exhaustive-deps */
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Doc, Operation } from 'rga';
import { MockSocket } from '../lib/mock-socket.ts';

const createVersion = (
  (i = 0) =>
  () =>
    String(i++)
)();

export const useRgaDocument = (client: string) => {
  const [network, setNetwork] = useState(true);

  const [tick, nextTick] = useReducer(v => ++v, 0);

  const doc = useMemo(() => new Doc<string>(client), []);
  const commits = useMemo<Map<string, Operation[]>>(() => new Map(), []);
  const list = useRef<Operation<string>[]>([]);

  const text = useMemo(() => {
    return list.current.map(v => v.value!).join('');
  }, [tick]);

  const staging = useMemo(() => {
    return doc['staging'];
  }, [tick]);

  const _updateList = useCallback(() => {
    const nextList = doc.list().map(node => node.value);
    list.current = nextList;
    nextTick();
  }, []);

  const input = useCallback((index: number, char: string) => {
    doc.insert(char, list.current[index]?.id);
    _updateList();
  }, []);

  const remove = useCallback((index: number) => {
    if (!list.current[index]?.id) return;
    doc.delete(list.current[index].id);
    _updateList();
  }, []);

  const commit = useCallback(() => {
    if (!network) return;
    const operations = doc.commit();

    if (!operations.length) return;
    MockSocket.emit('push', {
      version: createVersion(),
      operations,
    });
  }, [network]);

  useEffect(() => {
    if (!network) return;

    const offPushEvent = MockSocket.on('push', commit => {
      if (commits.has(commit.version)) return;
      commits.set(commit.version, commit.operations);
      doc.merge(commit.operations);
      _updateList();
    });

    const offPushRequestEvent = MockSocket.on(
      'pushRequest',
      ({ ignoreVersions }) => {
        Array.from(commits.keys()).forEach(version => {
          if (ignoreVersions.includes(version)) return;
          MockSocket.emit('push', {
            version,
            operations: commits.get(version)!,
          });
        });
      },
    );

    MockSocket.emit('pushRequest', {
      ignoreVersions: Array.from(commits.keys()),
    });

    commit();

    return () => {
      offPushEvent();
      offPushRequestEvent();
    };
  }, [network]);

  return {
    text,
    input,
    remove,
    staging,
    commit,
    network,
    setNetwork,
  };
};
