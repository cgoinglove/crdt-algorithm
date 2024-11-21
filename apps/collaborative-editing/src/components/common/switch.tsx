import { MouseEventHandler } from 'react';

interface Props {
  checked?: boolean;

  onClick?: MouseEventHandler<HTMLDivElement>;
}

export default function Switch({ onClick, checked }: Props) {
  return (
    <div
      onClick={onClick}
      className="relative w-8 h-4 rounded-full cursor-pointer ring-4 ring-zinc-800 bg-zinc-900"
    >
      <div
        style={{
          left: `calc(${checked ? 100 : 0}% - ${checked ? 1 : 0}rem)`,
        }}
        className={`absolute top-0 w-4 h-4 transition-all rounded-full shadow-sm ${checked ? 'bg-zinc-200' : 'bg-zinc-700'}`}
      ></div>
    </div>
  );
}
