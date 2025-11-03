<template>
  <div>
    <h2 class="text-left font-bold">Nested Graph Templates</h2>
    <select class="mb-1 w-full rounded-md border-2 border-gray-300 px-2 py-1 text-black" v-model.number="selected">
      <option v-for="(graph, index) in graphs" :key="graph.id" :value="index">
        {{ graph.name }}
      </option>
    </select>
    <p class="mb-2 text-left text-xs text-gray-600">ID: {{ currentGraph?.id }}</p>
    <div class="h-48">
      <JsonViewer v-if="currentGraph" :json-data="currentGraph.graph" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";

import JsonViewer from "./JsonViewer.vue";
import { graphs } from "../graph/nested";

export default defineComponent({
  name: "TemplateNestedGraph",
  components: {
    JsonViewer,
  },
  setup() {
    const selected = ref(0);
    const currentGraph = computed(() => graphs[selected.value] ?? graphs[0]);

    return {
      graphs,
      selected,
      currentGraph,
    };
  },
});
</script>
