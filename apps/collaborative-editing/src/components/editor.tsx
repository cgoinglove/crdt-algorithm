import { useDoc } from '../hooks/use-doc';

type Props = {
  name: string;
};

export default function Editor(props: Props) {
  const doc = useDoc(props.name);
  return (
    <div className="px-6 py-4 ring-1 ">
      {props.name}
      <input
        type="text"
        className="ring-1"
        onChange={() => {}}
        onKeyDown={e => {
          if (e.key == 'Enter') return doc.commit();
          if (e.key == 'Backspace') {
            console.log(e.currentTarget.selectionStart);
            return doc.delete(e.currentTarget.selectionStart ?? 0);
          }

          if (e.key.length != 1) return;
          doc.input(e.currentTarget.selectionStart ?? 0, e.key);
        }}
        value={doc.text}
      />
    </div>
  );
}
