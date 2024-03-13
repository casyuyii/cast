import AES from "crypto-js/aes"
import Utf8 from "crypto-js/enc-utf8"

export async function ShareText(opts: { text: string; secretKey?: string }) {
  const encrypted = AES.encrypt(opts.text, opts.secretKey ?? "")
  const encryptedStr = encrypted.toString()

  console.log(encryptedStr)
  console.log(AES.decrypt(encryptedStr, opts.secretKey ?? "").toString(Utf8))

  return "OK"
}

export async function GetSharedText(opts: { shareCode: string }) {
  return opts.shareCode
}
