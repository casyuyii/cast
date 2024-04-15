function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.text) {
    throw createError({
      statusCode: 400,
      statusText: "Bad Request(Missing text in body)",
    })
  }

  const key = generateUniqueId()
  console.log("key", key)
  await useStorage("redis").setItem(key, body.text, { ttl: 360 })

  return {
    key,
  }
})
