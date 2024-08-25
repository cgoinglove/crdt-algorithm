// import React, { useRef } from 'react';
// import { PropsWithChildren } from 'react';
// import { useState } from 'react';
// import { createContext } from 'react';
// import { Doc, Operation } from 'rga';

// type Commit = {
//   author: string; // peer
//   version: number;
// };

// type Context = {
//   commits: Operation[][];
//   setCommits: React.Dispatch<React.SetStateAction<Operation[][]>>;
//   peers: Doc[];
//   setPeers: React.Dispatch<React.SetStateAction<Doc[]>>;
// };

// export const RGAContext = createContext<Context | null>(null);

// export const RGAProvider = ({ children }: PropsWithChildren) => {
//   const peers = useRef<{ [peer: string]: Doc }>({});

//   const commits = useRef();

//   const [commits, setCommits] = useState<Operation[][]>([]);

//   return (
//     <RGAContext.Provider value={{ peers, setPeers, commits, setCommits }}>
//       {children}
//     </RGAContext.Provider>
//   );
// };
