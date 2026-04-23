import { useState, useCallback, useRef, type KeyboardEvent, type ChangeEvent } from 'react'
import { useForm, type FieldErrors, type Resolver, type SubmitErrorHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardHeader, StatusBar } from '../ui/Card'
import { Button } from '../ui/Button'
import { CustomerCodeInput } from '../ui/CustomerCodeInput'
import { buildLongCode } from '../lib/reagent-code'
import { createBarcodeSvg } from '../lib/code128'
import { reagentFormSchema, type ReagentFormValues } from '../lib/schemas'
import { useToast } from '../ui/Toast'
import { ZapIcon, CheckIcon, CopyImgIcon, InfoIcon } from '../ui/icons'
import { usePlatformOps } from '../lib/platformOps'
import { usePdfSettingsStore } from '../store/pdfSettingsStore'
import { useCopy } from '../ui/CopyButton'
import { twMerge } from 'tailwind-merge'

function getDefaultValues(): ReagentFormValues {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return {
    reagentId: 75,
    manufactureYear: String(d.getFullYear()).slice(-2).padStart(2, '0'),
    manufactureMonth: String(d.getMonth() + 1).padStart(2, '0'),
    manufactureDay: String(d.getDate()).padStart(2, '0'),
    storageHalfMonths: 48,
    openHalfMonths: 4,
    validUses: 1500,
    lotNumber: 1234,
    serialNumber: 1,
    agentId: 589,
    customerId: 3664,
    controlCode: 7,
  }
}

const FIELD_DEFS: { id: keyof ReagentFormValues; label: string; min: number; max: number }[] = [
  { id: 'reagentId',         label: '编号',    min: 0,  max: 255 },
  { id: 'manufactureYear',   label: '生产年',  min: 0,  max: 99 },
  { id: 'manufactureMonth',  label: '生产月',  min: 1,  max: 12 },
  { id: 'manufactureDay',    label: '生产日',  min: 1,  max: 31 },
  { id: 'storageHalfMonths', label: '储存半月',min: 0,  max: 255 },
  { id: 'openHalfMonths',    label: '使用半月',min: 0,  max: 255 },
  { id: 'validUses',         label: '有效次',  min: 0,  max: 65535 },
  { id: 'lotNumber',         label: '生产批',  min: 0,  max: 65535 },
  { id: 'serialNumber',      label: '序号',    min: 0,  max: 65535 },
  { id: 'controlCode',       label: '控制码',  min: 0,  max: 15 },
]

type Result = ReturnType<typeof buildLongCode>

/** 根据天数计算生产日期和半月数，填入表单 */
function calcDateFromDays(days: number): {
  year: string; month: string; day: string
  storageHalfMonths: number; openHalfMonths: number
} {
  const halfMonths = days <= 15 ? 1 : 2
  const offset = days <= 15 ? -15 + days : -30 + days
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return {
    year: String(d.getFullYear()).slice(-2).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    day: String(d.getDate()).padStart(2, '0'),
    storageHalfMonths: halfMonths,
    openHalfMonths: halfMonths,
  }
}

export function EncodePage() {
  const [result, setResult] = useState<Result | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [daysInput, setDaysInput] = useState('')
  const fieldRefs = useRef<Partial<Record<keyof ReagentFormValues, HTMLInputElement | null>>>({})
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ReagentFormValues>({
    resolver: zodResolver(reagentFormSchema) as Resolver<ReagentFormValues>,
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  })

  const agentId = watch('agentId')
  const customerId = watch('customerId')

  const onSubmit = useCallback((values: ReagentFormValues) => {
    try {
      const r = buildLongCode({
        ...values,
        manufactureYear: String(values.manufactureYear),
        manufactureMonth: String(values.manufactureMonth),
        manufactureDay: String(values.manufactureDay),
      })
      setResult(r)
      setSubmitError(null)
    } catch (e) {
      setSubmitError((e as Error).message)
      setResult(null)
    }
  }, [])

  const focusFirstErrorField = useCallback((invalidErrors: FieldErrors<ReagentFormValues>) => {
    const firstErrorField =
      FIELD_DEFS.find(({ id }) => invalidErrors[id])?.id ??
      (Object.keys(invalidErrors)[0] as keyof ReagentFormValues | undefined)
    if (!firstErrorField) return
    const target = fieldRefs.current[firstErrorField]
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => target.focus(), 120)
  }, [])

  const onInvalid: SubmitErrorHandler<ReagentFormValues> = useCallback((invalidErrors) => {
    focusFirstErrorField(invalidErrors)
  }, [focusFirstErrorField])

  const handleReset = useCallback(() => {
    reset(getDefaultValues())
    setResult(null)
    setSubmitError(null)
    setDaysInput('')
  }, [reset])

  const handleDaysApply = useCallback(() => {
    const days = parseInt(daysInput, 10)
    if (isNaN(days) || days < 1) return
    const { year, month, day, storageHalfMonths, openHalfMonths } = calcDateFromDays(days)
    setValue('manufactureYear', year, { shouldValidate: true })
    setValue('manufactureMonth', month, { shouldValidate: true })
    setValue('manufactureDay', day, { shouldValidate: true })
    setValue('storageHalfMonths', storageHalfMonths, { shouldValidate: true })
    setValue('openHalfMonths', openHalfMonths, { shouldValidate: true })
  }, [daysInput, setValue])

  const hasErrors = Object.keys(errors).length > 0
  const handleGenerate = handleSubmit(onSubmit, onInvalid)

  const onInputPanelKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
    if (!(e.target instanceof HTMLElement)) return
    if (e.target.tagName.toLowerCase() === 'textarea') return
    e.preventDefault()
    handleGenerate()
  }, [handleGenerate])

  return (
    <div className="flex flex-col lg:flex-row gap-5 p-3 md:p-5 min-h-full">
      <Card className="flex-1 flex flex-col min-h-0 min-w-0" onKeyDown={onInputPanelKeyDown}>
        <CardHeader tag={{ label: 'ENCODE', color: 'indigo' }} title="参数输入" />
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
          {submitError
            ? <StatusBar color="indigo"><span className="text-ct-danger-foreground">{submitError}</span></StatusBar>
            : hasErrors
              ? <StatusBar color="indigo"><span className="text-ct-danger-foreground">请修正红色字段后再生成</span></StatusBar>
              : <StatusBar color="indigo">录入参数后点击生成编码，长码、短码和条码预览将同步刷新。</StatusBar>
          }

          <div>
            <p className="mb-3 text-[11px] font-semibold tracking-widest uppercase text-ct-content-muted">天数快速填充</p>
            <div className="flex items-end gap-2">
              <label className="flex flex-col gap-1 w-28">
                <span className="text-[11px] font-medium text-ct-content-muted">天数</span>
                <input
                  type="number"
                  min={1}
                  value={daysInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDaysInput(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); handleDaysApply() } }}
                  placeholder="如 2 或 20"
                  className="h-9 rounded-xl border border-ct-border-input bg-ct-surface-input px-3 text-[13px] font-mono text-ct-content-primary outline-hidden focus:border-ct-brand focus:ring-4 focus:ring-ct-brand/15 transition-[background-color,border-color,color,box-shadow] duration-200"
                />
              </label>
              <Button variant="primary" size="md" onClick={handleDaysApply} disabled={!daysInput || isNaN(parseInt(daysInput, 10))}>
                自动填充
              </Button>
              {daysInput && !isNaN(parseInt(daysInput, 10)) && parseInt(daysInput, 10) >= 1 && (
                <span className="text-[11px] text-ct-content-muted pb-1">
                  → 半月 {parseInt(daysInput, 10) <= 15 ? 1 : 2}，生产日 {(() => { const days = parseInt(daysInput, 10); const offset = days <= 15 ? -15 + days : -30 + days; const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear().toString().slice(-2)}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}` })()}
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold tracking-widest uppercase text-ct-content-muted">参数输入</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {FIELD_DEFS.map(({ id, label, min, max }) => {
                const err = errors[id]
                const field = register(id)
                return (
                  <label key={id} className="flex flex-col gap-1">
                    <span className={err ? 'text-[11px] font-medium text-ct-danger-foreground' : 'text-[11px] font-medium text-ct-content-muted'}>
                      {label}
                      {err && <span className="ml-1 text-[10px]">({err.message})</span>}
                    </span>
                    <input
                      {...field}
                      ref={(el) => { field.ref(el); fieldRefs.current[id] = el }}
                      type="number"
                      min={min}
                      max={max}
                      className={twMerge(
                        'h-9 rounded-xl border px-3 text-[13px] font-mono transition-[background-color,border-color,color,box-shadow] duration-200',
                        'outline-hidden focus:border-ct-brand focus:ring-4 focus:ring-ct-brand/15',
                        err
                          ? 'border-ct-danger bg-ct-danger-soft text-ct-content-primary'
                          : 'border-ct-border-input bg-ct-surface-input text-ct-content-primary',
                      )}
                    />
                  </label>
                )
              })}
            </div>
            <div className="mt-3">
              <CustomerCodeInput
                agentValue={String(agentId ?? '')}
                customerValue={String(customerId ?? '')}
                onAgentChange={(v) => setValue('agentId', Number(v), { shouldValidate: true })}
                onCustomerChange={(v) => setValue('customerId', Number(v), { shouldValidate: true })}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="ghost" size="md" onClick={handleReset} className="flex-1 justify-center">恢复默认</Button>
              <Button variant="primary" size="md" onClick={handleGenerate} className="flex-[2] justify-center">
                <ZapIcon /> 生成编码
              </Button>
            </div>
          </div>

          <div className="flex-1" />

          <div>
            <div className="mb-4 h-px w-full bg-ct-border" />
            <p className="mb-3 text-[11px] font-semibold tracking-widest uppercase text-ct-content-muted">输出结果</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <OutputField label="长码 ASCII"     value={result?.encodedAscii ?? ''} />
              <OutputField label="短码 ASCII"     value={result?.shortAscii ?? ''} />
              <OutputField label="Payload hex"    value={result?.payloadHex ?? ''} />
              <OutputField label="加密前 16 字节" value={result?.plainHex ?? ''} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="lg:w-[440px] xl:w-[480px] flex flex-col min-h-0 min-w-0">
        <CardHeader tag={{ label: 'BARCODE', color: 'amber' }} title="条码预览" />
        <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">
          <BarcodeSection
            title="长码"
            ascii={result?.encodedAscii ?? ''}
            svg={result ? createBarcodeSvg(result.encodedAscii, { moduleWidth: 1.4, height: 80, caption: false }) : null}
          />
          <div className="h-px w-full bg-ct-border" />
          <BarcodeSection
            title="短码"
            ascii={result?.shortAscii ?? ''}
            svg={result ? createBarcodeSvg(result.shortAscii, { moduleWidth: 2, height: 80, caption: false }) : null}
          />
          <div className="flex-1" />
          <div className="flex items-center gap-2 rounded-xl bg-ct-surface-input px-3 py-2.5 text-[12px] text-ct-content-muted">
            <InfoIcon className="w-3.5 h-3.5 shrink-0" />
            点击生成编码后条码自动更新
          </div>
        </div>
      </Card>
    </div>
  )
}

function OutputField({ label, value }: { label: string; value: string }) {
  const { copied, copy } = useCopy()
  const clickable = Boolean(value)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-ct-content-muted">{label}</span>
        {clickable && (
          <span className={copied ? 'text-[10px] text-ct-success-foreground' : 'text-[10px] text-ct-content-faint'}>
            {copied ? '已复制' : '点击复制'}
          </span>
        )}
      </div>
      <div
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : -1}
        onClick={() => clickable && copy(value)}
        onKeyDown={(e) => {
          if (!clickable) return
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          copy(value)
        }}
        className={twMerge(
          'flex h-9 items-center overflow-hidden rounded-xl border px-3 font-mono text-[11px] transition-[background-color,border-color,color,box-shadow] duration-200',
          'outline-hidden',
          copied
            ? 'cursor-pointer border-ct-success-border bg-ct-success-soft text-ct-success-foreground'
            : clickable
              ? 'cursor-pointer border-ct-border bg-ct-surface-input text-ct-content-secondary hover:border-ct-brand hover:bg-ct-brand-soft hover:text-ct-brand-foreground'
              : 'cursor-default border-ct-border bg-ct-surface-input text-ct-content-secondary',
        )}
      >
        <span className="truncate">{value || '—'}</span>
      </div>
    </div>
  )
}

function BarcodeSection({ title, svg, ascii }: { title: string; svg: string | null; ascii: string }) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()
  const platform = usePlatformOps()
  const pdfBarcodeScale = usePdfSettingsStore((s) => s.pdfBarcodeScale)
  const { copied: copiedAscii, copy: copyAscii } = useCopy()

  const handleCopyImage = async () => {
    if (!ascii) return
    setCopying(true)
    try {
      await platform.copyBarcodeAsPng(ascii, title === '短码')
      setCopied(true)
      showToast('复制成功')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      await platform.downloadBarcodePng(ascii, `reagent-${title === '短码' ? 'short' : 'long'}.png`)
    } finally {
      setCopying(false)
    }
  }

  const handleExportPdf = async () => {
    if (!ascii) return
    const isShort = title === '短码'
    await platform.exportSingleBarcodePdf(
      ascii,
      ascii,
      '',
      isShort ? 'short' : 'long',
      pdfBarcodeScale,
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-ct-content-primary">{title}</span>
        <div className="flex gap-1.5 items-center">
          <button
            type="button"
            onClick={handleCopyImage} disabled={!svg || copying}
            className={twMerge(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] transition-[background-color,border-color,color] duration-200',
              'disabled:cursor-not-allowed disabled:opacity-40',
              copied
                ? 'border-ct-success-border bg-ct-success-soft text-ct-success-foreground'
                : 'border-ct-border bg-ct-surface-input text-ct-content-muted hover:border-ct-brand hover:bg-ct-brand-soft hover:text-ct-brand-foreground',
            )}
          >
            {copied ? <CheckIcon /> : <CopyImgIcon className="w-3 h-3" />}
            {copied ? '已复制' : copying ? '复制中…' : '复制图片'}
          </button>
          <Button variant="ghost" size="sm" onClick={() => platform.downloadBarcodePng(ascii, `reagent-${title === '短码' ? 'short' : 'long'}.png`)}>PNG</Button>
          <Button variant="primary" size="sm" onClick={handleExportPdf} disabled={!svg}>PDF</Button>
        </div>
      </div>
      <div className="flex min-h-[110px] flex-col items-center rounded-xl border border-ct-border bg-ct-surface-input p-3">
        {svg
          ? <>
              <div dangerouslySetInnerHTML={{ __html: svg }} className="max-w-full w-full overflow-hidden [&>svg]:w-full [&>svg]:h-auto" />
              <button
                type="button"
                onClick={() => ascii && copyAscii(ascii)}
                disabled={!ascii}
                title="复制 ASCII"
                className={twMerge(
                  'mt-1.5 w-full rounded-md px-2 py-1 text-center font-mono text-[12px] leading-tight break-all tracking-[0.05em] transition-[background-color,color] duration-200',
                  'disabled:cursor-default',
                  copiedAscii
                    ? 'bg-ct-success-soft text-ct-success-foreground'
                    : 'text-[var(--barcode-text)] hover:bg-ct-brand-soft hover:text-ct-brand-foreground',
                )}
              >
                {ascii}
              </button>
            </>
          : <span className="m-auto text-[12px] text-ct-content-muted">生成编码后显示</span>
        }
      </div>
    </div>
  )
}
