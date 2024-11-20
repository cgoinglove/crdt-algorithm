import Editor from './components/editor';

export default function App() {
  return (
    <div className="flex gap-8">
      <Editor name="peer1" />
      <Editor name="peer2" />
      <Editor name="peer3" />
    </div>
  );
}
