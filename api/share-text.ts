import AES from "crypto-js/aes"
import Utf8 from "crypto-js/enc-utf8"

export interface ShareTextOptions {
  text: string
  secretKey?: string
}

export async function ShareText(opts: ShareTextOptions) {
  const encrypted = AES.encrypt(opts.text, opts.secretKey ?? "")
  const encryptedStr = encrypted.toString()

  console.log(encryptedStr)
  console.log(AES.decrypt(encryptedStr, opts.secretKey ?? "").toString(Utf8))

  return "OK"
}
