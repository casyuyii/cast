export default defineEventHandler(async (event) => {
  const boay = await readBody(event)
  console.log(`get post ${boay}`)

  // await useStorage("redis").setItem("boay", boay)

  return { boay }
})
