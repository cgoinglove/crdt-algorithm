// import { useContext, useEffect, useMemo, useRef } from 'react';
// import { RGAContext } from '../context/rga.context';
// import { Doc } from 'rga';

// export const useDoc = (client: string) => {
//   const context = useContext(RGAContext);

//   if (!context) throw new Error('Not Found RGAContext Provider.');

//   const document = useMemo(() => {
//     const doc = new Doc(client);
//     context.setPeers(prev => [...prev, doc]);
//     return doc;
//   }, []);

//   const latestVersion = useRef();

//   const commit = () => {};

//   useEffect(
//     () => () => context.setPeers(prev => prev.filter(peer => peer != document)),
//     [],
//   );
// };
