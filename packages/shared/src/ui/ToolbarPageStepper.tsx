interface ToolbarPageStepperProps {
  currentPage: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

export function ToolbarPageStepper({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: ToolbarPageStepperProps) {
  return (
    <div className="flex items-center gap-1 text-[11px]">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentPage === 0}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-ct-border bg-ct-surface-card text-ct-content-secondary transition-colors hover:bg-ct-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="上一页"
      >
        ‹
      </button>
      <span className="px-1 tabular-nums text-ct-content-muted">{currentPage + 1}/{totalPages}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={currentPage >= totalPages - 1}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-ct-border bg-ct-surface-card text-ct-content-secondary transition-colors hover:bg-ct-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="下一页"
      >
        ›
      </button>
    </div>
  )
}
