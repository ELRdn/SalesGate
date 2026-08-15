// MCPサーバーのHTTPエンドポイント（Streamable HTTP トランスポート）
// DSH / OpenClaw / Claude Code などのMCPクライアントが接続する
// セッション管理: シングルプロセス前提のインメモリMap
import {
  WebStandardStreamableHTTPServerTransport,
  type WebStandardStreamableHTTPServerTransportOptions,
} from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createSalesServer } from "@/lib/mcp-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Transport = WebStandardStreamableHTTPServerTransport;

const transports = new Map<string, Transport>();

async function handleMcpRequest(request: Request): Promise<Response> {
  const sessionId = request.headers.get("mcp-session-id") ?? crypto.randomUUID();
  let transport = transports.get(sessionId);

  if (!transport) {
    // McpServer は1つのトランスポートにしか接続できないため、
    // セッションごとに新しいサーバーインスタンスを生成する
    // （ツールハンドラは prisma シングルトンを共有するのでコストは軽微）
    const server = createSalesServer();
    transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
      onsessioninitialized: (id: string) => {
        transports.set(id, transport!);
      },
    } satisfies WebStandardStreamableHTTPServerTransportOptions);
    transports.set(sessionId, transport);
    await server.connect(transport);
  }

  return transport.handleRequest(request);
}

export async function GET(request: Request) {
  return handleMcpRequest(request);
}

export async function POST(request: Request) {
  return handleMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request);
}
