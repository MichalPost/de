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
  digitEncrypted: string
  globalEncrypted: string
  finalResult: string
  decryptedResult: string
}

/**
 * 执行加密或解密
 */
export function processDigitCrypto(input: CryptoInput): CryptoResult {
  const { number, digitKey, globalKey, operation } = input

  if (!number || !/^\d+$/.test(number)) {
    throw new Error('请输入有效的数字（只能包含 0-9）')
  }

  if (operation === 'encrypt') {
    return encrypt(number, digitKey, globalKey)
  } else {
    return decrypt(number, digitKey, globalKey)
  }
}

function encrypt(number: string, digitKey: number, globalKey: number): CryptoResult {
  const originalNumber = number

  // 步骤一：逐位加密
  const digitEncrypted = digitWiseEncrypt(number, digitKey)

  // 步骤二：整体加密
  const globalEncrypted = (parseInt(digitEncrypted) + globalKey).toString()
  const finalResult = globalEncrypted

  // 验证：解密结果应等于原始数字
  const decryptedResult = decryptNumber(finalResult, digitKey, globalKey)

  return { originalNumber, digitEncrypted, globalEncrypted, finalResult, decryptedResult }
}

function decrypt(number: string, digitKey: number, globalKey: number): CryptoResult {
  const finalResult = number
  const decryptedResult = decryptNumber(number, digitKey, globalKey)

  // 展示解密步骤
  const globalDecrypted = (parseInt(number) - globalKey).toString()

  return {
    originalNumber: decryptedResult,
    digitEncrypted: globalDecrypted,
    globalEncrypted: globalDecrypted,
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

/** 完整解密流程 */
function decryptNumber(encrypted: string, digitKey: number, globalKey: number): string {
  const globalDecrypted = parseInt(encrypted) - globalKey
  if (globalDecrypted < 0) return '解密失败：数字过小'
  const padded = globalDecrypted.toString().padStart(6, '0')
  return digitWiseDecrypt(padded, digitKey)
}
