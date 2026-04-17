/**
 * 数字加密解密算法
 * 步骤一：逐位加密 — 每位数字 + 逐位密钥 (mod 10)
 * 步骤二：整体加密 — 整体数字 + 整体密钥
 */

export interface CryptoInput {
  number: string
  digitKey: number
  globalKey: number
  operation: 'encrypt' | 'decrypt'
}

export interface CryptoResult {
  originalNumber: string
  /** 逐位操作后的中间结果 */
  digitStepResult: string
  /** 整体偏移后的最终结果（加密）或整体偏移前的中间结果（解密） */
  globalStepResult: string
  finalResult: string
  decryptedResult: string
}

export function processDigitCrypto(input: CryptoInput): CryptoResult {
  const { number, digitKey, globalKey, operation } = input

  if (!number || !/^\d+$/.test(number)) {
    throw new Error('请输入有效的数字（只能包含 0-9）')
  }

  return operation === 'encrypt'
    ? encrypt(number, digitKey, globalKey)
    : decrypt(number, digitKey, globalKey)
}

function encrypt(number: string, digitKey: number, globalKey: number): CryptoResult {
  // Step 1: digit-wise encrypt
  const digitStepResult = digitWiseEncrypt(number, digitKey)
  // Step 2: global offset
  const globalStepResult = (parseInt(digitStepResult) + globalKey).toString()
  const finalResult = globalStepResult
  // Verify round-trip
  const decryptedResult = decryptNumber(finalResult, number.length, digitKey, globalKey)

  return { originalNumber: number, digitStepResult, globalStepResult, finalResult, decryptedResult }
}

function decrypt(number: string, digitKey: number, globalKey: number): CryptoResult {
  const finalResult = number
  // Step 1 (reverse): undo global offset
  const globalDecrypted = parseInt(number) - globalKey
  if (globalDecrypted < 0) {
    throw new Error('解密失败：整体偏移后数字为负，请检查密钥')
  }
  const globalStepResult = globalDecrypted.toString()
  // Step 2 (reverse): undo digit-wise encrypt — pad to original length
  const padded = globalStepResult.padStart(number.length, '0')
  const digitStepResult = digitWiseDecrypt(padded, digitKey)
  const decryptedResult = digitStepResult

  return {
    originalNumber: decryptedResult,
    digitStepResult,
    globalStepResult,
    finalResult,
    decryptedResult,
  }
}

/** 逐位加密：每位 + key (mod 10) */
function digitWiseEncrypt(number: string, key: number): string {
  return number.split('').map(d => ((parseInt(d) + key) % 10).toString()).join('')
}

/** 逐位解密：每位 - key，负数加 10 */
function digitWiseDecrypt(number: string, key: number): string {
  return number.split('').map(d => {
    let v = parseInt(d) - key
    if (v < 0) v += 10
    return v.toString()
  }).join('')
}

/** 完整解密流程（用于加密时的验证） */
function decryptNumber(encrypted: string, originalLength: number, digitKey: number, globalKey: number): string {
  const globalDecrypted = parseInt(encrypted) - globalKey
  if (globalDecrypted < 0) return '解密失败：数字过小'
  const padded = globalDecrypted.toString().padStart(originalLength, '0')
  return digitWiseDecrypt(padded, digitKey)
}
