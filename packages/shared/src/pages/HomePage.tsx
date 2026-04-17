import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'

const modules = [
  { to: '/encode',       tag: 'ENCODE', tagVars: { bg: 'var(--accent-light)',  color: 'var(--accent-text)'   }, title: '试剂包生成',   desc: '69 进制编码，生成长码、短码，实时条码预览与导出。' },
  { to: '/decode',       tag: 'DECODE', tagVars: { bg: 'var(--success-light)', color: 'var(--success-text)'  }, title: '长码解包',     desc: '输入 22 字节 hex，解包并展示所有字段。支持图片识别自动回填。' },
  { to: '/scan',         tag: 'SCAN',   tagVars: { bg: 'var(--purple-light)',  color: 'var(--purple-text)'   }, title: '图片识别',     desc: '拖入手机拍照、截图或扫码枪截图，批量识别条码并自动解码。' },
  { to: '/crypto',       tag: '3DES',   tagVars: { bg: 'var(--warning-light)', color: 'var(--warning-text)'  }, title: '3DES 加密',    desc: '16 字节明文 / 密文互转' },
  { to: '/batch',        tag: 'BATCH',  tagVars: { bg: 'var(--cyan-light)',    color: 'var(--cyan-text)'     }, title: '批量生成器',   desc: '模板驱动批量生成，支持导出 PDF / PNG。' },
  { to: '/bit-shift',    tag: 'SHIFT',  tagVars: { bg: 'var(--accent-light)',  color: 'var(--accent-text)'   }, title: '进制位移计算器', desc: '支持 2/10/16 进制输入，左移/右移，可指定补位值，仪器/试剂包快捷计算。' },
  { to: '/digit-crypto', tag: 'CRYPTO', tagVars: { bg: 'var(--purple-light)',  color: 'var(--purple-text)'   }, title: '数字加密解密器', desc: '逐位密钥 + 整体密钥两步加解密，支持加密/解密切换，自动复制结果。' },
]

export function HomePage() {
  const nav = useNavigate()
  return (
    <div className="p-3 md:p-6 lg:p-8 flex flex-col gap-5 md:gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2" style={{ color: 'var(--text-primary)' }}>
          试剂包编码 / 解码工作台
        </h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
        {modules.map(({ to, tag, tagVars, title, desc }) => (
          <div
            key={to}
            className="rounded-2xl border p-4 md:p-5 flex flex-col gap-3 cursor-pointer transition-shadow hover:shadow-md active:scale-[0.99]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
            onClick={() => nav(to)}
          >
            <span
              className="self-start px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
              style={{ backgroundColor: tagVars.bg, color: tagVars.color }}
            >
              {tag}
            </span>
            <div>
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h2>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
            <Button variant="ghost" size="sm" className="self-start mt-auto">进入 →</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
