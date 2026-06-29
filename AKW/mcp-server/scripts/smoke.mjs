import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const apiBase = process.env.DEVATLAS_API_BASE ?? 'http://127.0.0.1:8000'

const transport = new StdioClientTransport({
  command: 'node',
  args: ['./dist/index.js'],
  env: {
    DEVATLAS_API_BASE: apiBase,
    ...(process.env.DEVATLAS_API_TOKEN ? { DEVATLAS_API_TOKEN: process.env.DEVATLAS_API_TOKEN } : {}),
  },
  cwd: process.cwd(),
  stderr: 'inherit',
})

const client = new Client({ name: 'devatlas-smoke', version: '0.0.0' })

await client.connect(transport)

const tools = await client.listTools()
console.log('tools:', tools.tools.length)

const res = await client.callTool({ name: 'list_projects', arguments: {} })
console.log('list_projects isError:', !!res.isError)
console.log('list_projects content[0]:', res.content?.[0]?.type === 'text' ? res.content[0].text.slice(0, 400) : res.content?.[0])

// also verify resources
const templates = await client.listResourceTemplates()
console.log('resourceTemplates:', templates.resourceTemplates.map(t => t.uriTemplate))

await client.close()
