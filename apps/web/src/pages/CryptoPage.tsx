import { useState, type KeyboardEvent } from 'react'
import { Card, CardHeader, StatusBar } from '@chemtools/shared/ui/Card'
import { TextareaField } from '@chemtools/shared/ui/Field'
import { encrypt3DESHex, decrypt3DESHex } from '@chemtools/shared/lib/des'
import { LEGACY_FIXTURES } from '@chemtools/shared/lib/custom-algorithm'
import { LockIcon, UnlockIcon, ArrowDownIcon } from '@chemtools/shared/ui/icons'
import { Button } from '@chemtools/shared/ui/Button'

export function CryptoPage() {
  const [plain, setPlain] = useState<string>(LEGACY_FIXTURES.tripleDesDecrypted)
  const [key, setKey] = useState<string>('11223344556677888877665544332211')
  const [cipher, setCipher] = useState<string>(LEGACY_FIXTURES.tripleDesEncrypted)
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)

  const encrypt = () => {
    try {
      setCipher(encrypt3DESHex(plain, key))
      setStatus({ msg: '3DES 加密完成。', ok: true })
    } catch (e) {
      setStatus({ msg: (e as Error).message, ok: false })
    }
  }

  const decrypt = () => {
    try {
      setPlain(decrypt3DESHex(cipher, key))
      setStatus({ msg: '3DES 解密完成。', ok: true })
    } catch (e) {
      setStatus({ msg: (e as Error).message, ok: false })
    }
  }

  const handleEncryptKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return
    e.preventDefault()
    encrypt()
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 p-3 md:p-5 min-h-full">
      <Card className="flex-1 flex flex-col min-h-0 min-w-0">
        <CardHeader tag={{ label: '3DES', color: 'purple' }} title="16 字节加密工具" />
        <div className="flex-1 p-5 flex flex-col gap-4 overflow-auto">
          <StatusBar color="purple">
            {status
              ? <span style={{ color: status.ok ? 'var(--text-primary)' : 'var(--error-text)' }}>{status.msg}</span>
              : '默认载入旧版 3DES 样例，可直接加解密验证。'
            }
          </StatusBar>

          <TextareaField label="16 字节明文 hex" id="plain" value={plain} onChange={setPlain} onKeyDown={handleEncryptKeyDown} mono rows={2} />
          <TextareaField label="16 字节密钥 hex" id="key"   value={key}   onChange={setKey} onKeyDown={handleEncryptKeyDown} mono rows={2} />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[11px] font-medium"
              style={{ backgroundColor: 'var(--purple)' }}
            >
              <ArrowDownIcon className="w-3 h-3" /> 3DES 加密
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          </div>

          <TextareaField label="16 字节密文 hex" id="cipher" value={cipher} onChange={setCipher} onKeyDown={handleEncryptKeyDown} mono rows={2} />

          <div className="flex gap-2">
            <Button variant="purple" size="md" onClick={encrypt} className="flex-1 justify-center">
              <LockIcon /> 加密
            </Button>
            <Button variant="ghost" size="md" onClick={decrypt} className="flex-1 justify-center">
              <UnlockIcon /> 解密
            </Button>
          </div>
        </div>
      </Card>

      <Card className="lg:w-[300px] xl:w-[360px] flex flex-col min-h-0 min-w-0">
        <CardHeader tag={{ label: 'INFO', color: 'indigo' }} title="算法说明" />
        <div className="p-5 flex flex-col gap-3">
          {[
            { label: '算法',        value: 'Triple DES (3DES)' },
            { label: '密钥长度',    value: '16 字节 (128-bit)' },
            { label: '输入 / 输出', value: '16 字节 hex 字符串' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 p-3.5 rounded-xl border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
