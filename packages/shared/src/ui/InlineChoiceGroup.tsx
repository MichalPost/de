export function InlineChoiceGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div
      className="grid h-9 gap-1 rounded-xl border p-1"
      style={{
        borderColor: 'var(--border-input)',
        backgroundColor: 'var(--bg-input)',
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="h-full rounded-lg px-3 text-[12px] font-medium transition-colors cursor-pointer"
            style={active ? {
              backgroundColor: 'var(--accent)',
              color: '#fff',
              boxShadow: 'var(--shadow-sm)',
            } : {
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={e => {
              if (active) return
              e.currentTarget.style.backgroundColor = 'var(--bg-card)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              if (active) return
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
