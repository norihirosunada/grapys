import type { GraphData } from "graphai";

import { graphSimple } from "./nested/simple";

const nestedGraphId = "uoA47vRchYNhVnES";

const nestedGraph: GraphData = {
  version: graphSimple.version,
  nodes: graphSimple.nodes,
  loop: graphSimple.loop,
};

const nestedOutput = graphSimple.metadata?.forNested?.output ?? {};

export const graphNestedTemplate: GraphData = {
  version: 0.5,
  nodes: {
    nested: {
      agent: "nestedAgent",
      params: {},
      inputs: {},
      isResult: false,
      graph: nestedGraph,
      output: nestedOutput,
    },
    result: {
      agent: "copyAgent",
      params: {
        isResult: true,
      },
      inputs: {
        message: ":nested.result_message",
      },
      isResult: true,
    },
  },
  metadata: {
    data: {
      nodes: [
        {
          data: {
            agent: "nestedAgent",
            guiAgentId: "nestedAgent",
            params: {},
            nestedGraphIndex: 0,
            nestedGraphId,
          },
          nodeId: "nested",
          type: "computed",
          position: {
            x: 320.0,
            y: 320.0,
            width: 143.99,
            height: 167.89,
            inputCenters: [75.94],
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
          nodeId: "result",
          type: "computed",
          position: {
            x: 540.0,
            y: 340.0,
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
            nodeId: "nested",
            index: 0,
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

