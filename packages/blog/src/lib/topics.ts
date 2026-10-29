export function topicPath(topic: string) {
  return `/topics/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, "-"))}/`
}
