import { defineTool } from '@mastra/core'

export default defineTool({
  name: 'search_documents',
  async run(query, context) {
    return context.vectorStore.query(query)
  }
})
