
import { useDoc } from '../hooks/use-doc';

type Props = {
  name: string;
};

export default function Editor(props: Props) {
  const doc = useDoc(props.name);
  return (
    <div className="px-6 py-4 ring-1 ">
      {props.name}
      <input type="text" className='ring-1'
      value={doc.text} />
    </div>
  );
}
