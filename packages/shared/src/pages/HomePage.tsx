import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'

const modules = [
  { to: '/encode', tag: 'ENCODE', tagClassName: 'bg-ct-brand-soft text-ct-brand-foreground', title: '试剂包生成', desc: '69 进制编码，生成长码、短码，实时条码预览与导出。' },
  { to: '/decode', tag: 'DECODE', tagClassName: 'bg-ct-success-soft text-ct-success-foreground', title: '长码解包', desc: '输入 22 字节 hex，解包并展示所有字段。支持图片识别自动回填。' },
  { to: '/scan', tag: 'SCAN', tagClassName: 'bg-ct-highlight-soft text-ct-highlight-foreground', title: '图片识别', desc: '拖入手机拍照、截图或扫码枪截图，批量识别条码并自动解码。' },
  { to: '/crypto', tag: '3DES', tagClassName: 'bg-ct-warning-soft text-ct-warning-foreground', title: '3DES 加密', desc: '16 字节明文 / 密文互转' },
  { to: '/batch', tag: 'BATCH', tagClassName: 'bg-ct-info-soft text-ct-info-foreground', title: '批量生成器', desc: '模板驱动批量生成，支持导出 PDF / PNG。' },
  { to: '/bit-shift', tag: 'SHIFT', tagClassName: 'bg-ct-brand-soft text-ct-brand-foreground', title: '进制位移计算器', desc: '支持 2/10/16 进制输入，左移/右移，可指定补位值，仪器/试剂包快捷计算。' },
  { to: '/digit-crypto', tag: 'CRYPTO', tagClassName: 'bg-ct-highlight-soft text-ct-highlight-foreground', title: '数字加密解密器', desc: '逐位密钥 + 整体密钥两步加解密，支持加密/解密切换，自动复制结果。' },
]

export function HomePage() {
  const nav = useNavigate()
  return (
    <div className="p-3 md:p-6 lg:p-8 flex flex-col gap-5 md:gap-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-ct-content-primary md:mb-2 md:text-3xl">
          试剂包编码 / 解码工作台
        </h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
        {modules.map(({ to, tag, tagClassName, title, desc }) => (
          <div
            key={to}
            className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-ct-border bg-ct-surface-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-md)] active:scale-[0.99] md:p-5"
            onClick={() => nav(to)}
          >
            <span
              className={`self-start rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${tagClassName}`}
            >
              {tag}
            </span>
            <div>
              <h2 className="mb-1 text-[15px] font-semibold text-ct-content-primary">{title}</h2>
              <p className="text-[13px] leading-relaxed text-ct-content-secondary">{desc}</p>
            </div>
            <Button variant="ghost" size="sm" className="self-start mt-auto">进入 →</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
