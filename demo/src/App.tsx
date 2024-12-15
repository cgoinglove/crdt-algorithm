import Editor from './components/editor';

export default function App() {
  return (
    <div className="flex items-center w-full h-screen gap-8 p-20">
      <div className="w-1/3">
        <Editor name="Lee" />
      </div>
      <div className="w-1/3">
        <Editor name="Kim" />
      </div>
      <div className="w-1/3">
        <Editor name="Choi" />
      </div>
    </div>
  );
}
