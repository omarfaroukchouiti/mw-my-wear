export function Marquee({ words }: { words: string[] }) {
  const sequence = [...words, ...words, ...words, ...words];

  return (
    <div className="overflow-hidden border-y border-ink bg-ink py-3 text-paper">
      <div className="mw-marquee-track items-center">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {sequence.map((word, index) => (
              <span
                key={`${copy}-${index}-${word}`}
                className="flex items-center whitespace-nowrap px-5 text-xs font-semibold uppercase tracking-[0.3em]"
              >
                {word}
                <span className="ms-10 text-paper/40">✳</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
