<template>
  <h2 class="text-left font-bold">Save to LocalStorage</h2>
  <div class="mb-1 space-y-1">
    <button @click="save" class="w-full cursor-pointer items-center rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
      Save Graph
    </button>
    <button @click="load" class="w-full cursor-pointer items-center rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
      Load Graph
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "../store";
import { useCustomAgentStore } from "../store/customAgents";

export default defineComponent({
  components: {},
  setup() {
    const store = useStore();
    const customAgentStore = useCustomAgentStore();

    const save = () => {
      const dataStr = JSON.stringify(store.graphData);
      window.localStorage.setItem("GRAPHAIGUI", dataStr);
    };

    const load = () => {
      const data = window.localStorage.getItem("GRAPHAIGUI");
      try {
        if (data) {
          const graphData = JSON.parse(data);
          customAgentStore.applyBundle(graphData?.metadata?.customAgents);
          store.loadData(graphData.metadata.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    return {
      save,
      load,
    };
  },
});
</script>
