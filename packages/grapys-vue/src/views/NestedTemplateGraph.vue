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
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";

import { graphs as nestedGraphs } from "../graph/nested";
import { nestedGraphInputs } from "../utils/gui/utils";

export default defineComponent({
  setup() {
    const selected = ref(0);
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

    return {
      selected,
      nestedGraphs,
      currentGraph,
      inputs,
      outputs,
      description,
      outputMappings,
    };
  },
});
</script>
