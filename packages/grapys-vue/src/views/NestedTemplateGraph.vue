<template>
  <div>
    <h2 class="text-left font-bold">Nested Templates</h2>
    <select class="mb-1 w-full resize-none rounded-md border-2 border-gray-300 px-2 py-1 text-black" v-model.number="selected">
      <option v-for="(graph, index) in nestedGraphs" :key="graph.id" :value="index">
        {{ graph.name }}
      </option>
    </select>
    <div v-if="currentGraph" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-800">
      <p v-if="description" class="mb-2 whitespace-pre-wrap leading-relaxed">{{ description }}</p>
      <div class="mb-2">
        <h3 class="font-semibold">Inputs</h3>
        <ul class="list-inside list-disc">
          <li v-if="!inputs.length" class="text-gray-500">No static inputs</li>
          <li v-for="input in inputs" :key="input.name">
            <span class="font-medium">{{ input.name }}</span>
            <span v-if="input.type" class="text-gray-500"> ({{ input.type }})</span>
          </li>
        </ul>
      </div>
      <div class="mb-2">
        <h3 class="font-semibold">Outputs</h3>
        <ul class="list-inside list-disc">
          <li v-if="!outputs.length" class="text-gray-500">No outputs</li>
          <li v-for="output in outputs" :key="output.name">
            <span class="font-medium">{{ output.name }}</span>
            <span v-if="output.type" class="text-gray-500"> ({{ output.type }})</span>
          </li>
        </ul>
      </div>
      <div v-if="outputMappings.length">
        <h3 class="font-semibold">Output Mapping</h3>
        <ul class="list-inside list-disc">
          <li v-for="mapping in outputMappings" :key="mapping[0]">
            <span class="font-medium">{{ mapping[0] }}</span>
            <span class="text-gray-500"> ← {{ mapping[1] }}</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="mt-3">
      <h3 class="font-semibold">Nested Usage</h3>
      <p class="mb-1 text-xs text-gray-500">Existing graph templates grouped by their nested graph references.</p>
      <p v-if="!usageTree.length" class="text-sm text-gray-500">No nested relationships detected.</p>
      <ul v-else class="list-inside list-disc">
        <NestedGraphTreeNode v-for="node in usageTree" :key="node.id" :node="node" />
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import type { GraphData } from "graphai";

import { graphs as templateGraphs } from "../graph";
import { graphs as nestedGraphs } from "../graph/nested";
import NestedGraphTreeNode, { NestedTreeNode } from "../components/NestedGraphTreeNode.vue";
import { nestedGraphInputs } from "../utils/gui/utils";
import type { GraphDataMetaData, ApplicationData } from "../utils/gui/type";

type MetadataNode = {
  nodeId: string;
  data?: (ApplicationData & { nestedGraphId?: string }) | undefined;
};

type GraphEntry = {
  id: string;
  name: string;
  graph: GraphData & GraphDataMetaData;
};

export default defineComponent({
  components: {
    NestedGraphTreeNode,
  },
  setup() {
    const selected = ref(0);
    const templateGraphEntries: GraphEntry[] = templateGraphs;
    const nestedGraphEntries: GraphEntry[] = nestedGraphs;
    const nestedGraphMap = new Map(nestedGraphEntries.map((entry) => [entry.id, entry]));
    const templateGraphMap = new Map(templateGraphEntries.map((entry) => [entry.id, entry]));
    const currentGraph = computed(() => nestedGraphs[selected.value] ?? null);
    const inputs = computed(() => {
      const graph = currentGraph.value?.graph;
      if (!graph) {
        return [];
      }
      return nestedGraphInputs(graph);
    });
    const outputs = computed(() => {
      return currentGraph.value?.graph?.metadata?.forNested?.outputs ?? [];
    });
    const description = computed(() => currentGraph.value?.graph?.metadata?.forNested?.description ?? "");
    const outputMappings = computed(() => {
      const mapping = currentGraph.value?.graph?.metadata?.forNested?.output ?? {};
      return Object.entries(mapping);
    });
    const collectNestedChildren = (
      graphData: GraphData & GraphDataMetaData,
      visited: Set<string>,
    ): NestedTreeNode[] => {
      const metadataNodes = ((graphData.metadata?.data?.nodes ?? []) as MetadataNode[]) ?? [];
      const graphNodes = graphData.nodes as Record<string, { graph?: GraphData & GraphDataMetaData }>;
      const seen = new Set<string>();
      const result: NestedTreeNode[] = [];

      metadataNodes.forEach((node) => {
        const nodeData = node.data;
        if (!nodeData) {
          return;
        }

        let nestedId: string | undefined = typeof nodeData.nestedGraphId === "string" ? nodeData.nestedGraphId : undefined;
        let entry: GraphEntry | undefined;

        if (nestedId) {
          entry = nestedGraphMap.get(nestedId) ?? templateGraphMap.get(nestedId);
        }

        if (!nestedId && typeof nodeData.nestedGraphIndex === "number") {
          entry = nestedGraphEntries[nodeData.nestedGraphIndex];
          nestedId = entry?.id;
        }

        const inlineGraph = graphNodes?.[node.nodeId]?.graph;

        if (!nestedId && inlineGraph) {
          nestedId = node.nodeId;
        }

        if (!nestedId || seen.has(nestedId)) {
          return;
        }
        seen.add(nestedId);

        let type: NestedTreeNode["type"] = "unknown";
        let children: NestedTreeNode[] = [];
        const nextVisited = new Set(visited);
        nextVisited.add(nestedId);

        if (entry) {
          type = nestedGraphMap.has(nestedId) ? "nested" : "template";
          if (!visited.has(nestedId)) {
            children = collectNestedChildren(entry.graph, nextVisited);
          }
        } else if (inlineGraph && !visited.has(nestedId)) {
          children = collectNestedChildren(inlineGraph as GraphData & GraphDataMetaData, nextVisited);
        }

        result.push({
          id: nestedId,
          name: entry?.name ?? nestedId,
          type,
          children,
        });
      });

      return result;
    };

    const usageTree = computed<NestedTreeNode[]>(() => {
      return templateGraphEntries
        .map<NestedTreeNode>((entry) => ({
          id: entry.id,
          name: entry.name,
          type: "template",
          children: collectNestedChildren(entry.graph, new Set([entry.id])),
        }))
        .filter((node) => node.children.length > 0);
    });

    return {
      selected,
      nestedGraphs,
      currentGraph,
      inputs,
      outputs,
      description,
      outputMappings,
      usageTree,
    };
  },
});
</script>
