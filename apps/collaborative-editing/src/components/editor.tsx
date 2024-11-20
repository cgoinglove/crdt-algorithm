import {
  ClipboardEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useRgaDocument } from '../hooks/use-rga-document';

type Props = {
  name: string;
};

const noop = () => {
  console.log(`change?`);
};

export default function Editor(props: Props) {
  const doc = useRgaDocument(props.name);
  const input = useRef<HTMLInputElement>(null);
  const lastCursor = useRef(0);

  const onKeyDownHandler = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    e => {
      const start = Math.min(
        e.currentTarget.selectionStart ?? 0,
        e.currentTarget.selectionEnd ?? 0,
      );
      const end = Math.max(
        e.currentTarget.selectionStart ?? 0,
        e.currentTarget.selectionEnd ?? 0,
      );
      if (e.key == 'Backspace') {
        let deleteCount = 1;
        let deleteIndex = start;

        if (start != end) {
          deleteCount = end - start;
        } else {
          deleteIndex--;
        }
        Array.from({ length: deleteCount }).forEach(
          doc.remove.bind(null, deleteIndex),
        );
        lastCursor.current = deleteIndex;
        return;
      }
      if (e.key.length != 1) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      if (!isCtrl) {
        doc.input(start - 1, e.key);
        lastCursor.current = start + 1;
      }
    },
    [],
  );

  const onPasteHandler = useCallback<ClipboardEventHandler<HTMLInputElement>>(
    e => {
      const text = e.clipboardData.getData('text');
      const start = Math.min(
        e.currentTarget.selectionStart ?? 0,
        e.currentTarget.selectionEnd ?? 0,
      );
      const end = Math.max(
        e.currentTarget.selectionStart ?? 0,
        e.currentTarget.selectionEnd ?? 0,
      );
      if (start != end) {
        Array.from({ length: end - start }).forEach(
          doc.remove.bind(null, start),
        );
      }

      [...text].forEach(char => {
        doc.input(start - 1, char);
      });
      lastCursor.current = start + text.length;
    },
    [],
  );

  useEffect(() => {
    setTimeout(() => {
      if (!input.current) return;

      input.current.selectionStart = lastCursor.current;
      input.current.selectionEnd = lastCursor.current;
    });
  }, [doc.text]);

  useEffect(() => {
    if (!doc.network) return;
    // auto commit
    const timeoutKey = setInterval(() => {
      doc.commit();
    }, 1000);

    return () => {
      clearInterval(timeoutKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.network]);

  return (
    <div className="px-6 py-4 ring-1 ">
      <input
        type="checkbox"
        checked={doc.network}
        onChange={doc.setNetwork.bind(null, !doc.network)}
      />
      {props.name}
      <input
        ref={input}
        type="text"
        key={props.name}
        onChange={noop}
        className="ring-1"
        onPaste={onPasteHandler}
        onKeyDown={onKeyDownHandler}
        value={doc.text}
      />
    </div>
  );
}
