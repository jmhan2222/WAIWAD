interface Props {
  text: string
}

export function JapaneseScript({ text }: Props) {
  const lines = text.split('\n')
  const pairs: { reading: string; original: string }[] = []

  for (let i = 0; i < lines.length; i += 2) {
    const reading = lines[i]?.trim() ?? ''
    const original = lines[i + 1]?.trim() ?? ''
    if (reading || original) {
      pairs.push({ reading, original })
    }
  }

  return (
    <div className="space-y-3">
      {pairs.map((pair, i) => (
        <div key={i}>
          {pair.reading && (
            <p className="text-base text-gray-900 leading-relaxed">{pair.reading}</p>
          )}
          {pair.original && (
            <p className="text-sm text-gray-400 leading-relaxed">{pair.original}</p>
          )}
        </div>
      ))}
    </div>
  )
}
