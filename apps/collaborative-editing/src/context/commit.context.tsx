import { useEffect, useState } from 'react';
import { PropsWithChildren } from 'react';

import { createContext } from 'react';
import { Operation } from 'rga';
import { MockSocket } from '../lib/mock-socket';

type Commit = {
  author: string;
  operations: Operation[];
  version: string;
};

type Context = {
  commits: { [version: string]: Commit };
  pull(beforeCommits: string[]): Commit[];
};

export const CommitContext = createContext<Context | null>(null);

export const CommitProvider = ({ children }: PropsWithChildren) => {
  const [commits, setCommits] = useState<{
    [version: string]: Commit;
  }>({});

  useEffect(() => {
    const off = MockSocket.on('commit', event => {
      setCommits(prev => ({
        ...prev,
        [event.version]: event,
      }));
    });
    return off;
  }, []);

  const pull = (beforeCommits: string[]): Commit[] => {
    return Object.keys(commits)
      .filter(version => !beforeCommits.includes(version))
      .map(version => commits[version]);
  };

  return (
    <CommitContext.Provider value={{ pull, commits }}>
      {children}
    </CommitContext.Provider>
  );
};
