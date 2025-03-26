import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import { z } from "zod";

const architecture = JSON.parse(fs.readFileSync("/Users/hirubin/dev/HackathonTest/arch.json", "utf8"));

interface BaseService {
    name: string;
    description: string;
}

interface Service extends BaseService {
    connectedServices: string[];
    apis: Api[];
}
  
interface Api {
    endpoint: string;
    method: string;
    description: string;
    dependencies: string[];
    responseExample: Record<string, any>;
}

interface BaseDatabase {
    name: string;
    type: string;
    description: string;
}
interface Database extends BaseDatabase {
    connectedServices: string[];
    tables: Table[];
}
  
export interface Table {
    name: string;
    columns: string[];
}
  
// interface Architecture {
//     services: Service[];
//     database: Database;
// }

interface BasicArchitectureOverview {
    services: BaseService[];
    databases: BaseDatabase[];
}

// Create server instance
const server = new McpServer({
  name: "architecture-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Route to get the entire architecture
async function getArch(): Promise<BasicArchitectureOverview> {
    console.log("getArch");
    const services = architecture.architecture.services.map(
        (s: any) => ({ name: s.name, description: s.description })
    );
    const databases = architecture.architecture.databases.map(
        (d: any) => ({ name: d.name, type: d.type, description: d.description })
    );
    return { services, databases };
}

// Route to get details of a specific service
function getSvcData(serviceName: string): Service | { error: string } {
    const service = architecture.architecture.services.find(
        (s: any) => s.name === serviceName
    );
    if (!service) {
        return { error: "Service not found" };
    }
    return service;
}

// Register arch tools
server.tool(
    "get-architecture",
    "Get all the architecture, and basic details about each service include name and description",
    async () => {
      const architecture = await getArch();
   
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(architecture),
          },
        ],
      };
    },
  );
  
  server.tool(
    "get-service-data",
    "Get data on specific service include name, description, and dependencies",
    {
        serviceName: z.string().describe("The service name to get data for"),
    },
    ({ serviceName }: { serviceName: string }) => {
      const svcData = getSvcData(serviceName);
      if ('error' in svcData) {
        return {
          content: [
            {
              type: "text",
              text: svcData.error,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(svcData),
          },
        ],
      };
    },
  );

  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Arch MCP Server running on stdio");
  }
  
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });