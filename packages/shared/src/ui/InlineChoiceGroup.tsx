import { SegmentedControl, type SegmentedOption } from './SegmentedControl'

export function InlineChoiceGroup({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return <SegmentedControl options={options} value={value} onChange={onChange} className={className} />
}
