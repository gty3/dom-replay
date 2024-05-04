import { SSTConfig } from "sst"
import { WebSocketApi } from "sst/constructs"

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
              handler: "testrust/src/main.rs",
              runtime: "rust",
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