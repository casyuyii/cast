export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log(`get post ${body}`)

  await useStorage("redis").setItem("t1", body.text ?? "test string")

  return { boay: body }
})
