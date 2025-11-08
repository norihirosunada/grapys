import { GraphData } from "graphai";

export const graphNestedConversation: GraphData = {
  version: 0.5,
  nodes: {
    system: {
      value: {
        role: "system",
        content: "You are a helpful assistant that prepares nested chat history.",
      },
    },
    user: {
      value: {
        role: "user",
        content: "Summarize the current topic for a nested graph run.",
      },
    },
    messages: {
      agent: "copyAgent",
      params: {
        isResult: true,
      },
      inputs: {
        array: [":system", ":user"],
      },
      isResult: true,
    },
    response: {
      agent: "copyAgent",
      params: {
        isResult: true,
      },
      inputs: {
        message: ":messages.array",
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
              content: "You are a helpful assistant that prepares nested chat history.",
            },
            staticNodeType: "data",
          },
          nodeId: "system",
          type: "static",
          position: {
            x: 150.32,
            y: 280.12,
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
              content: "Summarize the current topic for a nested graph run.",
            },
            staticNodeType: "data",
          },
          nodeId: "user",
          type: "static",
          position: {
            x: 150.32,
            y: 560.12,
            width: 143.99,
            height: 240,
            inputCenters: [55.95],
            outputCenters: [35.97],
          },
        },
        {
          data: {
            agent: "copyAgent",
            guiAgentId: "itemToArrayAgent",
            params: {
              isResult: true,
            },
          },
          nodeId: "messages",
          type: "computed",
          position: {
            x: 420.34,
            y: 420.92,
            width: 143.99,
            height: 167.87,
            inputCenters: [75.94, 91.93, 107.92, 123.91],
            outputCenters: [55.95],
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
          nodeId: "response",
          type: "computed",
          position: {
            x: 680.31,
            y: 420.92,
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
            nodeId: "system",
            index: 0,
          },
          target: {
            nodeId: "messages",
            index: 0,
            direction: "outbound",
          },
        },
        {
          type: "edge",
          source: {
            nodeId: "user",
            index: 0,
          },
          target: {
            nodeId: "messages",
            index: 1,
            direction: "outbound",
          },
        },
        {
          type: "edge",
          source: {
            nodeId: "messages",
            index: 0,
          },
          target: {
            nodeId: "response",
            index: 0,
            direction: "outbound",
          },
        },
      ],
      loop: {
        loopType: "none",
      },
    },
    forNested: {
      description: "Creates a conversation array from system and user messages and exposes the latest response.",
      output: {
        messages: ".messages.array",
        response_message: ".response.message",
      },
      outputs: [
        {
          name: "messages",
          type: "array",
        },
        {
          name: "response_message",
          type: "message",
        },
      ],
    },
  },
};
