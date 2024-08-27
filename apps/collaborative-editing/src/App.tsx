import { CommitProvider } from './context/commit.context';
import Editor from './components/editor';

export default function App() {
  return (
    <CommitProvider>
      <div className="flex gap-8">
        <Editor name="peer1" />
        <Editor name="peer2" />
        <Editor name="peer3" />
        hel
      </div>
    </CommitProvider>
  );
}
