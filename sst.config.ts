import { SSTConfig } from "sst"
import { StaticSite, WebSocketApi } from "sst/constructs"

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
      // const websocketApi = new WebSocketApi(stack, "websocketApi", {
      //   routes: {
      //     $connect: {
      //       function: {
      //         handler: "websocket/src/main.rs",
      //         runtime: "rust",
      //         environment: {
      //           DATABENTO_API_KEY: DATABENTO_API_KEY,
      //         },
      //       },
      //     },
      //     $default: {
      //       function: {
      //         handler: "websocket/src/main.rs",
      //         runtime: "rust",
      //         timeout: 310,
      //         environment: {
      //           DATABENTO_API_KEY: DATABENTO_API_KEY,
      //         },
      //       },
      //     },
      //     $disconnect: {
      //       function: {
      //         handler: "websocket/src/main.rs",
      //         runtime: "rust",
      //       },
      //       environment: {
      //         DATABENTO_API_KEY: DATABENTO_API_KEY,
      //       },
      //     },
      //   },
      // })

      new StaticSite(stack, "react", {
        path: "frontend",
        buildCommand: "npm run build",
        environment: {
          VITE_WS_URL: "shit",
        },
      })
    })
  },
} satisfies SSTConfig
