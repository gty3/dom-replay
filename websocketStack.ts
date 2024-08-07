import { StackContext } from "sst/constructs";
import { Api, NextjsSite, WebSocketApi } from "sst/constructs"

const DATABENTO_API_KEY = process.env.DATABENTO_API_KEY ?? "db-key-error"
export function WebsocketStack({ stack }: StackContext) {
  const websocket = new WebSocketApi(stack, "websocket", {
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
          timeout: 610,
          environment: {
            DATABENTO_API_KEY: DATABENTO_API_KEY,
          },
        },
      },
      $disconnect: {
        function: {
          handler: "websocket/src/main.rs",
          runtime: "rust",
          environment: {
            DATABENTO_API_KEY: DATABENTO_API_KEY,
          },
        },
      },
    },
  })
  return { websocket }
}