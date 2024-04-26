import { SSTConfig } from "sst"
import { WebSocketApi } from "sst/constructs"
import dotenv from "dotenv"

dotenv.config()

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
              handler: "rust-connect/src/main.rs",
              runtime: "rust",
              environment: {
                DATABENTO_API_KEY: process.env.DATABENTO_API_KEY?? "",
              },
            },
          },
        },
      })
      stack.addOutputs({
        websocketApi: websocketApi.url,
      })
    })
  },
} satisfies SSTConfig
