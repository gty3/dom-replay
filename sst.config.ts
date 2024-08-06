import { SSTConfig } from "sst"
import { Api, NextjsSite, use, WebSocketApi } from "sst/constructs"

const DATABENTO_API_KEY = process.env.DATABENTO_API_KEY ?? "db-key-error"

import {
  ViewerProtocolPolicy,
  OriginRequestPolicy,
  AllowedMethods,
  OriginProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins"
import { WebsocketStack } from "./websocketStack"

export default {
  config(_input) {
    return {
      name: "trading-demo",
      region: "us-east-1",
    }
  },
  
  stacks(app) {
    app.stack(WebsocketStack)
    app.stack(function Site({ stack }) {
      const { websocket } = use(WebsocketStack)

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
          NEXT_PUBLIC_WS_URL: websocket.url,
        },
        customDomain: app.stage === "prod" ? {
          domainName: "orderflowreplay.com",
          domainAlias: "www.orderflowreplay.com",
        }: undefined,
        
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
