export async function ShareText(opts: { text: string; secretKey?: string }) {
  console.log(opts)

  return "OK"
}

export async function GetSharedText(opts: { shareCode: string }) {
  return opts.shareCode
}
