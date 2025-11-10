import { GraphData } from "graphai";

export const graphSimple: GraphData = {
  version: 0.5,
  nodes: {
    "1": {
      value: "hello",
    },
    "2": {
      value: {
        aa: "test",
      },
    },
    "123": {
      agent: "copyAgent",
      params: {},
      inputs: {
        array: [":1", ":2"],
      },
      isResult: false,
    },
    res: {
      agent: "copyAgent",
      params: {
        isResult: true,
      },
      inputs: {
        message: ":123.array",
      },
      isResult: true,
    },
  },
  metadata: {
    data: {
      nodes: [
        {
          data: {
            agent: "copyAgent",
            guiAgentId: "itemToArrayAgent",
            params: {},
          },
          nodeId: "123",
          type: "computed",
          position: {
            x: 400.3422230298068,
            y: 414.1024727768313,
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
          nodeId: "res",
          type: "computed",
          position: {
            x: 660.3175205245986,
            y: 444.9294702327013,
            width: 143.99,
            height: 167.89,
            inputCenters: [75.94],
            outputCenters: [55.95],
          },
        },
        {
          data: {
            value: "hello\n",
            staticNodeType: "text",
          },
          nodeId: "1",
          type: "static",
          position: {
            x: 181.78860826091238,
            y: 260.2719695563403,
            width: 143.99,
            height: 240,
            inputCenters: [55.95],
            outputCenters: [35.97],
          },
        },
        {
          data: {
            value: {
              aa: "vv",
            },
            staticNodeType: "data",
          },
          nodeId: "2",
          type: "static",
          position: {
            x: 143.70689162823248,
            y: 545.167381573542,
            width: 143.99,
            height: 240,
            inputCenters: [55.95],
            outputCenters: [35.97],
          },
        },
      ],
      edges: [
        {
          type: "edge",
          source: {
            nodeId: "123",
            index: 0,
          },
          target: {
            nodeId: "res",
            index: 0,
            direction: "outbound",
          },
        },
        {
          type: "edge",
          source: {
            nodeId: "1",
            index: 0,
          },
          target: {
            nodeId: "123",
            index: 0,
            direction: "outbound",
          },
        },
        {
          type: "edge",
          source: {
            nodeId: "2",
            index: 0,
          },
          target: {
            nodeId: "123",
            index: 1,
            direction: "outbound",
          },
        },
      ],
      loop: {
        loopType: "none",
      },
    },
    forNested: {
      description: "Collects text and data values into a single array output.",
      output: {
        result_message: ".res.message",
      },
      outputs: [
        {
          name: "result_message",
        },
      ],
    },
  },
};
