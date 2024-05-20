import { SSTConfig } from "sst"
import { StaticSite, WebSocketApi } from "sst/constructs"

export default {
  config(_input) {
    return {
      name: "trading-demo",
      region: "us-east-1",
    }
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const websocketApi = new WebSocketApi(stack, "websocketApi", {
        routes: {
          $connect: {
            function: {
              handler: "websocket/connect/src/main.rs",
              runtime: "rust",
            },
          },
          $default: {
            function: {
              handler: "websocket/default/src/main.rs",
              runtime: "rust",
              timeout: 300,
              environment: {
                DATABENTO_API_KEY: process.env.DATABENTO_API_KEY ?? "",
              },
            },
          },
          $disconnect: {
            function: {
              handler: "websocket/disconnect/src/main.rs",
              runtime: "rust",
            },
          },
        },
      })

      new StaticSite(stack, "Site", {
        path: "dom-frontend",
        environment: {
          VITE_WS_URL: websocketApi.url,
        },
      })

      stack.addOutputs({
        websocketApi: websocketApi.url,
      })
    })
  },
} satisfies SSTConfig
