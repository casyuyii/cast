export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const key = body.key
  if (!key) {
    throw createError({
      statusCode: 400,
      statusText: "Bad Request(Missing key in body)",
    })
  }

  const value = await useStorage("redis").getItem(key)

  return {
    key,
    value,
  }
})
