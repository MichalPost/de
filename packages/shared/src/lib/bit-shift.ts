/**
 * 进制位移计算器算法
 * 支持 2/10/16 进制输入，左移/右移，可指定补位值
 */

export type BaseType = '2' | '10' | '16'
export type ShiftMethod = '<<' | '>>'

export interface ShiftInput {
  number: string
  base: BaseType
  shift: number
  method: ShiftMethod
  padding: 0 | 1
}

export interface ShiftResult {
  binOriginal: string
  binResult: string
  hexOriginal: string
  hexResult: string
  decOriginal: number
  decResult: number
}

/**
 * 执行位移计算
 */
export function calculateShift(input: ShiftInput): ShiftResult {
  const { number, base, shift, method, padding } = input

  // 解析输入为十进制
  const originalValue = parseInt(number, parseInt(base))
  
  if (isNaN(originalValue) || originalValue < 0) {
    throw new Error('请输入有效的非负整数')
  }

  // 保存原始值的各进制表示
  const decOriginal = originalValue
  const binOriginal = originalValue.toString(2).padStart(8, '0')
  const hexOriginal = originalValue.toString(16).toUpperCase()

  // 执行位移运算
  let result: number
  if (method === '>>') {
    result = rightShift(originalValue, shift, padding)
  } else {
    result = leftShift(originalValue, shift, padding)
  }

  // 结果的各进制表示
  const decResult = result
  const binResult = result.toString(2).padStart(8, '0')
  const hexResult = result.toString(16).toUpperCase()

  return {
    binOriginal,
    binResult,
    hexOriginal,
    hexResult,
    decOriginal,
    decResult,
  }
}

/**
 * 左移运算：低位补指定值
 */
function leftShift(value: number, shift: number, padding: 0 | 1): number {
  const binaryString = value.toString(2).padStart(8, '0')
  const shifted = binaryString.slice(shift) + ''.padEnd(shift, padding === 0 ? '0' : '1')
  return parseInt(shifted, 2)
}

/**
 * 右移运算：高位补指定值
 */
function rightShift(value: number, shift: number, padding: 0 | 1): number {
  const binaryString = value.toString(2).padStart(8, '0')
  const shifted = ''.padStart(shift, padding === 0 ? '0' : '1') + binaryString.slice(0, binaryString.length - shift)
  return parseInt(shifted, 2)
}
