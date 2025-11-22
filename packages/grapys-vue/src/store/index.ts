import { ref, computed } from "vue";
import {
  GUINodeData,
  GUIEdgeData,
  GUINodeDataRecord,
  UpdateStaticValue,
  UpdateNodePositionData,
  HistoryData,
  HistoryPayload,
  GUILoopData,
  AgentProfile,
} from "../utils/gui/type";
import { store2graphData } from "../utils/gui/graph";
import { defineStore } from "pinia";
import { graphs } from "../graph/nested";

import { graphToGUIData } from "../utils/gui/utils";
import type { GraphData } from "graphai";

export const useStore = defineStore("store", () => {
  const histories = ref<HistoryData[]>([]);
  const currentData = ref<HistoryPayload>({
    nodes: [],
    edges: [],
    loop: { loopType: "none" },
  });
  const customAgentProfiles = ref<Record<string, AgentProfile>>({});
  const index = ref(0);

  const graphAIResults = ref<Record<string, unknown>>({});

  const agentProfiles = computed(() => {
    // Lazy import to avoid circular dependencies at module eval time.
    const { builtinAgentProfiles } = require("../utils/gui/data");
    return { ...builtinAgentProfiles, ...customAgentProfiles.value } as Record<string, AgentProfile>;
  });

  const customAgentProfilesCategory = computed(() => {
    return Object.keys(customAgentProfiles.value).reduce((tmp: Record<string, AgentProfile>, key) => {
      tmp[key] = customAgentProfiles.value[key];
      return tmp;
    }, {});
  });

  const agentProfilesCategory = computed(() => {
    const { builtinAgentProfilesCategory } = require("../utils/gui/data");
    const categories: Record<string, Record<string, AgentProfile>> = { ...builtinAgentProfilesCategory };
    if (Object.keys(customAgentProfilesCategory.value).length) {
      categories.custom = customAgentProfilesCategory.value;
    }
    return categories;
  });

  const reset = () => {
    updateData([], [], { loopType: "none" }, "reset", true);
    customAgentProfiles.value = {};
  };

  const nodes = computed(() => {
    return currentData.value.nodes;
  });

  const edges = computed(() => {
    return currentData.value.edges;
  });

  const loop = computed(() => {
    return currentData.value.loop;
  });

  const nodeRecords = computed<GUINodeDataRecord>(() => {
    return nodes.value.reduce((tmp: GUINodeDataRecord, current) => {
      tmp[current.nodeId] = current;
      return tmp;
    }, {});
  });
  const graphData = computed(() => {
    return store2graphData(currentData.value, graphs, agentProfiles.value, customAgentProfiles.value);
  });
  const streamNodes = computed(() => {
    return nodes.value
      .filter((node) => {
        return node.data?.params?.stream ?? false;
      })
      .map((node) => node.nodeId);
  });
  const resultNodes = computed(() => {
    return nodes.value
      .filter((node) => {
        return node.data?.params?.isResult ?? false;
      })
      .map((node) => node.nodeId);
  });
  // end of computed

  const loadData = (data: HistoryPayload) => {
    currentData.value = data;
    pushDataToHistory("load", data);
  };
  const updateData = (nodeData: GUINodeData[], edgeData: GUIEdgeData[], loopData: GUILoopData, name: string, saveHistory: boolean) => {
    const data = { nodes: nodeData, edges: edgeData, loop: loopData };
    currentData.value = data;
    if (saveHistory) {
      pushDataToHistory(name, data);
    }
  };
  const pushDataToHistory = (name: string, data: HistoryPayload) => {
    // don't call directory.
    histories.value.length = index.value;
    histories.value.push({ data, name });
    index.value = index.value + 1;
  };
  const saveNodePositionData = () => {
    // just special case. only use position update.
    pushDataToHistory("position", currentData.value);
  };

  const initData = (nodeData: GUINodeData[], edgeData: GUIEdgeData[], loopData: GUILoopData) => {
    const data = { nodes: nodeData, edges: edgeData, loop: loopData };
    currentData.value = data;
    // this time, node position is not set. save after mounted.
  };

  const initFromGraphData = (graph: GraphData) => {
    const { rawEdge, rawNode, loop: loopData, registry } = graphToGUIData(graph, agentProfiles.value);
    customAgentProfiles.value = registry ?? {};
    initData(rawNode, rawEdge, loopData);
  };

  const registerAgentProfile = (id: string, profile: AgentProfile) => {
    customAgentProfiles.value = { ...customAgentProfiles.value, [id]: profile };
  };

  const setAgentProfiles = (profiles: Record<string, AgentProfile>) => {
    customAgentProfiles.value = { ...profiles };
  };

  // node
  const pushNode = (nodeData: GUINodeData) => {
    updateData([...nodes.value, nodeData], [...edges.value], { ...loop.value }, "addNode", true);
  };

  const updateNodePosition = (positionIndex: number, pos: UpdateNodePositionData) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.position = { ...newNode.position, ...pos };
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], { ...loop.value }, "updatePosition", false);
  };
  const updateNodeParam = (positionIndex: number, key: string, value: unknown) => {
    const oldNode = nodes.value[positionIndex];
    const newNode = {
      ...oldNode,
      data: {
        ...oldNode.data,
        params: oldNode.data.params ? { ...oldNode.data.params } : {},
      },
    };

    if (value === "" || value === undefined || (value === null && newNode.data.params && newNode.data.params[key] !== undefined)) {
      // delete operation
      const { [key]: __, ...updatedParams } = newNode.data.params || {};
      newNode.data.params = updatedParams;
    } else {
      // upsert
      newNode.data.params = { ...(newNode.data.params || {}), [key]: value };
    }
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], { ...loop.value }, "updateParams", true);
  };
  const updateStaticNodeValue = (positionIndex: number, value: UpdateStaticValue, saveHistory: boolean) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.data = { ...newNode.data, ...value };
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(newNodes, [...edges.value], { ...loop.value }, "updateStaticValue", saveHistory);
  };

  const updateNestedGraph = (positionIndex: number, value: UpdateStaticValue) => {
    const newNode = { ...nodes.value[positionIndex] };
    newNode.data = { ...newNode.data, ...value };
    const newNodes = [...nodes.value];
    newNodes[positionIndex] = newNode;
    updateData(
      newNodes,
      [
        ...edges.value.filter((edge) => {
          const { source, target } = edge;
          return source.nodeId !== newNode.nodeId && target.nodeId !== newNode.nodeId;
        }),
      ],
      { ...loop.value },
      "NestedGraph",
      true,
    );
  };

  const updateLoop = (loopData: GUILoopData) => {
    updateData([...nodes.value], [...edges.value], loopData, "loopUpdate", true);
  };
  // edge
  const pushEdge = (edgeData: GUIEdgeData) => {
    updateData([...nodes.value], [...edges.value, edgeData], { ...loop.value }, "addEdge", true);
  };
  const deleteEdge = (edgeIndex: number) => {
    updateData([...nodes.value], [...edges.value.filter((__, idx) => idx !== edgeIndex)], { ...loop.value }, "deleteEdge", true);
  };
  const deleteNode = (nodeIndex: number) => {
    const node = nodes.value[nodeIndex];
    updateData(
      [...nodes.value.filter((__, idx) => idx !== nodeIndex)],
      [
        ...edges.value.filter((edge) => {
          const { source, target } = edge;
          return source.nodeId !== node.nodeId && target.nodeId !== node.nodeId;
        }),
      ],
      { ...loop.value },
      "deleteNode",
      true,
    );
  };

  // history api
  const undoable = computed(() => {
    return index.value > 1;
  });
  const undo = () => {
    if (undoable.value) {
      currentData.value = histories.value[index.value - 2].data;
      index.value = index.value - 1;
    }
  };

  const redoable = computed(() => {
    return index.value < histories.value.length;
  });
  const redo = () => {
    if (redoable.value) {
      currentData.value = histories.value[index.value].data;
      index.value = index.value + 1;
    }
  };

  // graphAIResult
  const setResult = (nodeId: string, result: unknown) => {
    const ret = graphAIResults.value;
    ret[nodeId] = result;
    graphAIResults.value = ret;
  };

  return {
    // variables
    histories,
    currentData,

    // methods
    initData,
    initFromGraphData,
    pushNode,
    pushEdge,
    deleteEdge,
    deleteNode,

    updateNodePosition,
    updateNodeParam,
    // pushDataToHistory,
    saveNodePositionData,

    loadData,

    updateStaticNodeValue,
    updateNestedGraph,
    updateLoop,

    undo,
    redo,

    reset,

    // computed
    nodes,
    edges,
    loop,
    graphData,
    nodeRecords,
    streamNodes,
    resultNodes,

    agentProfiles,
    agentProfilesCategory,
    customAgentProfiles,

    undoable,
    redoable,

    // graphAIResult
    setResult,
    graphAIResults,

    // agent registry
    registerAgentProfile,
    setAgentProfiles,

    // for nested agent
    nestedGraphs: graphs,
  };
});
