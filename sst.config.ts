import { SSTConfig } from "sst"
import { Api, NextjsSite, StaticSite, WebSocketApi } from "sst/constructs"

const DATABENTO_API_KEY = process.env.DATABENTO_API_KEY ?? "db-key-error"

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
              handler: "websocket/src/main.rs",
              runtime: "rust",
              environment: {
                DATABENTO_API_KEY: DATABENTO_API_KEY,
              },
            },
          },
          $default: {
            function: {
              handler: "websocket/src/main.rs",
              runtime: "rust",
              timeout: 310,
              environment: {
                DATABENTO_API_KEY: DATABENTO_API_KEY,
              },
            },
          },
          $disconnect: {
            function: {
              handler: "websocket/src/main.rs",
              runtime: "rust",
            },
            environment: {
              DATABENTO_API_KEY: DATABENTO_API_KEY,
            },
          },
        },
      })

      const api = new Api(stack, "restApi", {
        routes: {
          "GET /definitions": {
            function: {
              handler: "api/src/main.rs",
              runtime: "rust",
            },
            environment: {
              DATABENTO_API_KEY: DATABENTO_API_KEY,
            },
          },
        },
      });

      const nextjs = new NextjsSite(stack, "nextjs", {
        path: "nextjs",
        environment: {
          NEXT_PUBLIC_WS_URL: websocketApi.url,
          NEXT_PUBLIC_API_URL: api.url,
        },
      })

      stack.addOutputs({
        Nextjs: nextjs.url,
        api: api.url,
      })
    })
  },
} satisfies SSTConfig
