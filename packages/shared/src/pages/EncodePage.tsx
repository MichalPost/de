import { useState, useCallback, useRef, type KeyboardEvent } from 'react'
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

export function EncodePage() {
  const [result, setResult] = useState<Result | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
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
  }, [reset])

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
            ? <StatusBar color="indigo"><span style={{ color: 'var(--error-text)' }}>{submitError}</span></StatusBar>
            : hasErrors
              ? <StatusBar color="indigo"><span style={{ color: 'var(--error-text)' }}>请修正红色字段后再生成</span></StatusBar>
              : <StatusBar color="indigo">录入参数后点击生成编码，长码、短码和条码预览将同步刷新。</StatusBar>
          }

          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>参数输入</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {FIELD_DEFS.map(({ id, label, min, max }) => {
                const err = errors[id]
                const field = register(id)
                return (
                  <label key={id} className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium" style={{ color: err ? 'var(--error-text)' : 'var(--text-muted)' }}>
                      {label}
                      {err && <span className="ml-1 text-[10px]">({err.message})</span>}
                    </span>
                    <input
                      {...field}
                      ref={(el) => { field.ref(el); fieldRefs.current[id] = el }}
                      type="number"
                      min={min}
                      max={max}
                      className="h-9 px-3 rounded-xl border text-[13px] font-mono outline-none transition-colors focus:ring-2"
                      style={err ? {
                        borderColor: 'var(--error)',
                        backgroundColor: 'var(--error-light)',
                        color: 'var(--text-primary)',
                      } : {
                        borderColor: 'var(--border-input)',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                      }}
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
            <div className="w-full h-px mb-4" style={{ backgroundColor: 'var(--border)' }} />
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>输出结果</p>
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
          <div className="w-full h-px" style={{ backgroundColor: 'var(--border)' }} />
          <BarcodeSection
            title="短码"
            ascii={result?.shortAscii ?? ''}
            svg={result ? createBarcodeSvg(result.shortAscii, { moduleWidth: 2, height: 80, caption: false }) : null}
          />
          <div className="flex-1" />
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px]"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
          >
            <InfoIcon className="w-3.5 h-3.5 shrink-0" />
            点击生成编码后条码自动更新
          </div>
        </div>
      </Card>
    </div>
  )
}

function OutputField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div
        className="h-9 px-3 flex items-center rounded-xl border font-mono text-[11px] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
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
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <div className="flex gap-1.5 items-center">
          <button
            onClick={handleCopyImage} disabled={!svg || copying}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={copied ? {
              backgroundColor: 'var(--success-light)',
              color: 'var(--success-text)',
              borderColor: 'var(--success-border)',
            } : {
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-muted)',
              borderColor: 'var(--border)',
            }}
            onMouseEnter={e => { if (!copied) {
              const el = e.currentTarget
              el.style.color = 'var(--accent-text)'
              el.style.borderColor = 'var(--accent)'
              el.style.backgroundColor = 'var(--accent-light)'
            }}}
            onMouseLeave={e => { if (!copied) {
              const el = e.currentTarget
              el.style.color = 'var(--text-muted)'
              el.style.borderColor = 'var(--border)'
              el.style.backgroundColor = 'var(--bg-input)'
            }}}
          >
            {copied ? <CheckIcon /> : <CopyImgIcon className="w-3 h-3" />}
            {copied ? '已复制' : copying ? '复制中…' : '复制图片'}
          </button>
          <Button variant="ghost" size="sm" onClick={() => platform.downloadBarcodePng(ascii, `reagent-${title === '短码' ? 'short' : 'long'}.png`)}>PNG</Button>
          <Button variant="primary" size="sm" onClick={handleExportPdf} disabled={!svg}>PDF</Button>
        </div>
      </div>
      <div
        className="flex flex-col items-center rounded-xl border p-3"
        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', minHeight: 110 }}
      >
        {svg
          ? <>
              <div dangerouslySetInnerHTML={{ __html: svg }} className="max-w-full w-full overflow-hidden [&>svg]:w-full [&>svg]:h-auto" />
              <p className="mt-1.5 text-[12px] font-mono text-center break-all leading-tight" style={{ color: 'var(--barcode-text)', letterSpacing: '0.05em' }}>{ascii}</p>
            </>
          : <span className="text-[12px] m-auto" style={{ color: 'var(--text-muted)' }}>生成编码后显示</span>
        }
      </div>
    </div>
  )
}
