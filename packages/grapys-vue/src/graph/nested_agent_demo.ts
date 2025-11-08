import { GraphData } from "graphai";

import { graphNestedConversation } from "./nested/conversation";

const { version: nestedVersion, nodes: nestedNodes, loop: nestedLoop } = graphNestedConversation;
const nestedOutputs = graphNestedConversation.metadata?.forNested?.output ?? {};

export const graphNestedAgentDemo: GraphData = {
  version: 0.5,
  nodes: {
    system_message: {
      value: {
        role: "system",
        content: "You are a nested GraphAI assistant.",
      },
    },
    user_message: {
      value: {
        role: "user",
        content: "Explain how nested graphs prepare messages.",
      },
    },
    chat_history: {
      agent: "nestedAgent",
      inputs: {
        system: ":system_message",
        user: ":user_message",
      },
      params: {},
      graph: {
        version: nestedVersion,
        nodes: nestedNodes,
        loop: nestedLoop,
      },
      output: nestedOutputs,
    },
    result: {
      agent: "copyAgent",
      params: {
        isResult: true,
      },
      inputs: {
        message: ":chat_history.response_message",
      },
      isResult: true,
    },
  },
  metadata: {
    data: {
      nodes: [
        {
          data: {
            value: {
              role: "system",
              content: "You are a nested GraphAI assistant.",
            },
            staticNodeType: "data",
          },
          nodeId: "system_message",
          type: "static",
          position: {
            x: 120.12,
            y: 260.25,
            width: 143.99,
            height: 240,
            inputCenters: [55.95],
            outputCenters: [35.97],
          },
        },
        {
          data: {
            value: {
              role: "user",
              content: "Explain how nested graphs prepare messages.",
            },
            staticNodeType: "data",
          },
          nodeId: "user_message",
          type: "static",
          position: {
            x: 120.12,
            y: 540.25,
            width: 143.99,
            height: 240,
            inputCenters: [55.95],
            outputCenters: [35.97],
          },
        },
        {
          data: {
            agent: "nestedAgent",
            guiAgentId: "nestedAgent",
            params: {},
            nestedGraphIndex: 1,
            nestedGraphId: "Nw9H7Kc4pQx32bLa",
          },
          nodeId: "chat_history",
          type: "computed",
          position: {
            x: 400.34,
            y: 400.32,
            width: 160,
            height: 200,
            inputCenters: [75.94, 123.91],
            outputCenters: [65.95, 125.95],
          },
        },
        {
          data: {
            agent: "copyAgent",
            guiAgentId: "resultAgent",
            params: {
              isResult: true,
            },
          },
          nodeId: "result",
          type: "computed",
          position: {
            x: 680.31,
            y: 420.32,
            width: 143.99,
            height: 167.89,
            inputCenters: [75.94],
            outputCenters: [55.95],
          },
        },
      ],
      edges: [
        {
          type: "edge",
          source: {
            nodeId: "system_message",
            index: 0,
          },
          target: {
            nodeId: "chat_history",
            index: 0,
            direction: "outbound",
          },
        },
        {
          type: "edge",
          source: {
            nodeId: "user_message",
            index: 0,
          },
          target: {
            nodeId: "chat_history",
            index: 1,
            direction: "outbound",
          },
        },
        {
          type: "edge",
          source: {
            nodeId: "chat_history",
            index: 1,
          },
          target: {
            nodeId: "result",
            index: 0,
            direction: "outbound",
          },
        },
      ],
      loop: {
        loopType: "none",
      },
    },
  },
};
