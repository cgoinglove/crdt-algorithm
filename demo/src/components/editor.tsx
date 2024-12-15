/* eslint-disable react-hooks/exhaustive-deps */
import { ClipboardEventHandler, KeyboardEventHandler, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRgaDocument } from '../hooks/use-rga-document'
import Switch from './common/switch'

type Props = {
  name: string
}

export default function Editor(props: Props) {
  const doc = useRgaDocument(props.name)
  const input = useRef<HTMLInputElement>(null)
  const lastCursor = useRef(0)

  const debounceCommit = useMemo(() => {
    let key: ReturnType<typeof setTimeout>
    return () => {
      clearTimeout(key)
      key = setTimeout(() => {
        doc.commit()
      }, 600)
    }
  }, [doc.commit])

  const onKeyDownHandler = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    e => {
      const start = Math.min(e.currentTarget.selectionStart ?? 0, e.currentTarget.selectionEnd ?? 0)
      const end = Math.max(e.currentTarget.selectionStart ?? 0, e.currentTarget.selectionEnd ?? 0)
      if (e.key == 'Backspace') {
        let deleteCount = 1
        let deleteIndex = start

        if (start != end) {
          deleteCount = end - start
        } else {
          deleteIndex--
        }
        Array.from({ length: deleteCount }).forEach(doc.remove.bind(null, deleteIndex))
        lastCursor.current = deleteIndex
      } else if (e.key.length != 1) return
      else if (!(e.ctrlKey || e.metaKey)) {
        doc.input(start - 1, e.key)
        lastCursor.current = start + 1
      }
      debounceCommit()
    },
    [debounceCommit],
  )

  const onPasteHandler = useCallback<ClipboardEventHandler<HTMLInputElement>>(e => {
    const text = e.clipboardData.getData('text')
    const start = Math.min(e.currentTarget.selectionStart ?? 0, e.currentTarget.selectionEnd ?? 0)
    const end = Math.max(e.currentTarget.selectionStart ?? 0, e.currentTarget.selectionEnd ?? 0)
    if (start != end) {
      Array.from({ length: end - start }).forEach(doc.remove.bind(null, start))
    }

    ;[...text].forEach(char => {
      doc.input(start - 1, char)
    })
    lastCursor.current = start + text.length
  }, [])

  useEffect(() => {
    setTimeout(() => {
      if (!input.current) return

      input.current.selectionStart = lastCursor.current
      input.current.selectionEnd = lastCursor.current
    })
  }, [doc.text])

  return (
    <div
      className={` text-zinc-400 w-full px-6 py-4 rounded-md border border-zinc-800 bg-zinc-950`}
      id={`doc-peer-${props.name}`}
    >
      <div className='flex w-full gap-1.5 mb-4'>
        {Array(3)
          .fill(undefined)
          .map((_, i) => (
            <div key={i} className='w-2 h-2 rounded-full bg-zinc-800'></div>
          ))}
      </div>
      <div className='flex items-center '>
        <h1 className='px-4 py-4 mr-auto text-lg font-bold text-zinc-200'>{props.name}</h1>
        <div
          className={`mx-4 font-bold transition-colors min-w-16 ${doc.network ? 'text-zinc-200 animate-pulse' : 'text-zinc-700'}`}
        >
          {doc.network ? 'ON' : 'OFF'}LINE
        </div>
        <Switch checked={doc.network} onClick={doc.setNetwork.bind(null, !doc.network)} />
      </div>

      <input
        ref={input}
        type='text'
        key={props.name}
        className='w-full px-6 py-4 text-lg rounded-md text-zinc-400 bg-zinc-950 ring-1 ring-zinc-800 focus:outline-none focus:ring-zinc-600 focus:text-zinc-300'
        onPaste={onPasteHandler}
        onKeyDown={onKeyDownHandler}
        value={doc.text}
      />
      <div className='mt-4 overflow-hidden border border-dashed rounded-md border-zinc-800 min-h-[100px] max-h-[100px] overflow-y-auto'>
        {doc.staging.length ? (
          <div className='flex flex-wrap gap-2 p-2'>
            {doc.staging.map((operation, i) => {
              return (
                <div
                  key={i}
                  className={`flex text-xs items-center px-2 py-1 rounded-lg border-dashed border-zinc-800  ${operation.type == 'insert' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}
                >
                  <div
                    className={`shadow-lg ${operation.type == 'insert' ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'} flex items-center justify-center w-4 h-4 text-lg  rounded-full`}
                  >
                    <span className='translate-y-[-1px]'>{operation.type == 'insert' ? '+' : '-'}</span>
                  </div>
                  <span className='ml-2'>
                    {`${operation.id}`} {operation.type == 'insert' ? `'${operation.value}'` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='flex items-center justify-center w-full h-[100px] py-4 font-bold text-center'>Staging</div>
        )}
      </div>
    </div>
  )
}
