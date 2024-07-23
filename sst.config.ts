import { SSTConfig } from "sst"
import { Api, NextjsSite, WebSocketApi } from "sst/constructs"

const DATABENTO_API_KEY = process.env.DATABENTO_API_KEY ?? "db-key-error"

import {
  ViewerProtocolPolicy,
  OriginRequestPolicy,
  AllowedMethods,
  OriginProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins"

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
              timeout: 300,
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

      const cfFunction = new cloudfront.Function(stack, "Function", {
        code: cloudfront.FunctionCode.fromInline(
          `function handler(event) {
            var request = event.request;
            var uri = request.uri;
            uri = uri.replace('/plausible/event', '/api/event');
            request.uri = uri;
            return request;
          }`
        ),
      })
      const plausibleOrigin = new HttpOrigin("plausible.io", {
        protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      })
      const nextjs = new NextjsSite(stack, "nextjs", {
        path: "nextjs",
        environment: {
          NEXT_PUBLIC_WS_URL: websocketApi.url,
        },
        customDomain: {
          domainName: "orderflowreplay.com",
          domainAlias: "www.orderflowreplay.com",
        },
        cdk: {
          distribution: {
            additionalBehaviors: {
              "/js/script.tagged-events.js": {
                origin: plausibleOrigin,
                viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
              },
              "/plausible/event": {
                functionAssociations: [
                  {
                    function: cfFunction,
                    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                  },
                ],
                origin: plausibleOrigin,
                originRequestPolicy: new OriginRequestPolicy(
                  stack,
                  "Managed-UserAgentRefererHeaders"
                ),
                allowedMethods: AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
              },
            },
          },
        },
      })

      stack.addOutputs({
        Nextjs: nextjs.url,
      })
    })
  },
} satisfies SSTConfig
