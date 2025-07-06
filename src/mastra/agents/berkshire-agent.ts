import {
  defineAgent,
  useQuery,
  useMemory,
  useTool,
  useModel
} from '@mastra/core'

export default defineAgent({
  name: 'berkshire-agent',
  type: 'rag',
  setup() {
    const query = useQuery()
    const memory = useMemory()
    const model = useModel('openai:gpt-4o')
    const searchDocuments = useTool('search_documents')

    return async () => {
      const memorySummary = await memory.read()
      const docs = await searchDocuments(query)

      return model.respond({
        system: `You are a financial assistant that answers questions using the official Berkshire Hathaway shareholder letters from Warren Buffett. Use only the context provided.`,
        messages: [
          { role: 'user', content: query },
          { role: 'user', content: memorySummary },
          { role: 'user', content: JSON.stringify(docs) }
        ]
      })
    }
  }
})
