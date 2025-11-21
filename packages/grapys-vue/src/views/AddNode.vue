<template>
  <h2 class="text-left font-bold">Add Node</h2>
  <div class="text-left">
    <label class="mb-0.5 block text-xs text-gray-600">Node Name (custom ID):</label>
    <input
      type="text"
      v-model="nodeId"
      class="mb-1 w-full rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
      :class="isError ? 'border-red-600' : ''"
      placeholder="Enter Node name..."
    />

    <label class="mb-0.5 block text-xs text-gray-600">Select agent type:</label>
    <select class="mb-1 w-full resize-none rounded-md border-2 border-gray-300 px-2 py-1 text-black" v-model="agent">
      <option>StaticNode</option>

      <optgroup :label="category" v-for="(category, categoryKey) in Object.keys(agentProfileCategories)" :key="categoryKey">
        <option v-for="(agentName, agentKey) in Object.keys(agentProfileCategories[category])" :key="agentKey">
          {{ agentName }}
        </option>
      </optgroup>
    </select>
  </div>
  <div>
    <SideMenuButton @click="addNode"> Add node </SideMenuButton>
  </div>

  <div class="mt-4 rounded-md border border-gray-200 bg-white p-3 shadow-sm">
    <details open>
      <summary class="cursor-pointer text-sm font-semibold">Create custom node</summary>
      <div class="mt-2 space-y-2 text-left">
        <div>
          <label class="mb-0.5 block text-xs text-gray-600">Custom node ID (also used as agent name):</label>
          <input
            type="text"
            v-model="customNodeId"
            class="w-full rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
            :class="customError ? 'border-red-600' : ''"
            placeholder="Enter custom node id"
          />
        </div>

        <div>
          <label class="mb-0.5 block text-xs text-gray-600">Inputs</label>
          <div v-for="(input, index) in customInputs" :key="`input-${index}`" class="mb-1 flex gap-2">
            <input
              v-model="input.name"
              class="w-2/3 rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
              placeholder="name"
            />
            <select v-model="input.type" class="w-1/3 rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black">
              <option v-for="type in ioTypes" :key="type">{{ type }}</option>
            </select>
          </div>
          <SideMenuButton class="mt-1" @click="addInput">Add input</SideMenuButton>
        </div>

        <div>
          <label class="mb-0.5 block text-xs text-gray-600">Outputs</label>
          <div v-for="(output, index) in customOutputs" :key="`output-${index}`" class="mb-1 flex gap-2">
            <input
              v-model="output.name"
              class="w-2/3 rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
              placeholder="name"
            />
            <select v-model="output.type" class="w-1/3 rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black">
              <option v-for="type in ioTypes" :key="type">{{ type }}</option>
            </select>
          </div>
          <SideMenuButton class="mt-1" @click="addOutput">Add output</SideMenuButton>
        </div>

        <div>
          <label class="mb-0.5 block text-xs text-gray-600">Parameters</label>
          <div v-for="(param, index) in customParams" :key="`param-${index}`" class="mb-1 flex gap-2">
            <input
              v-model="param.name"
              class="w-1/3 rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
              placeholder="name"
            />
            <select v-model="param.type" class="w-1/3 rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black">
              <option v-for="type in paramTypes" :key="type">{{ type }}</option>
            </select>
            <input
              v-model="param.defaultValue"
              class="w-1/3 rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
              placeholder="default"
            />
          </div>
          <SideMenuButton class="mt-1" @click="addParam">Add param</SideMenuButton>
        </div>

        <div v-if="customError" class="text-xs text-red-600">{{ customError }}</div>
        <SideMenuButton @click="saveCustomNode">Save custom node</SideMenuButton>
      </div>
    </details>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { useStore } from "../store";
import { getDefaultParams } from "../utils/gui/utils";
import SideMenuButton from "../components/SideMenuButton.vue";
import { mergeAgentProfileCatalog } from "../utils/gui/registry";

export default defineComponent({
  components: { SideMenuButton },
  setup() {
    const store = useStore();
    const nodeId = ref("");
    const agent = ref<string>("StaticNode");
    const isError = ref(false);

    const customNodeId = ref("");
    const customInputs = ref([{ name: "input", type: "text" }]);
    const customOutputs = ref([{ name: "output", type: "text" }]);
    const customParams = ref([{ name: "param", type: "string", defaultValue: "" }]);
    const customError = ref("");

    const paramTypes = ["string", "text", "data", "boolean", "float", "int", "enum"];
    const ioTypes = ["text", "array", "message", "data", "wait", "boolean"];

    const catalog = computed(() => mergeAgentProfileCatalog(store.customAgentRegistry));
    const agentProfileCategories = computed(() => catalog.value.categories);
    const mergedAgentProfiles = computed(() => catalog.value.profiles);
    const nodesKey = computed(() => Object.keys(mergedAgentProfiles.value));

    watch(nodeId, () => {
      isError.value = false;
    });

    watch(
      nodesKey,
      (keys) => {
        if (!keys.includes(agent.value) && agent.value !== "StaticNode") {
          agent.value = keys[0] ?? "StaticNode";
        }
      },
      { immediate: true },
    );

    const addNode = () => {
      if (nodeId.value === "") {
        isError.value = true;
        return;
      }
      if (store.nodeRecords[nodeId.value]) {
        isError.value = true;
        return;
      }

      const isStatic = agent.value === "StaticNode";
      const targetAgent = mergedAgentProfiles.value[agent.value] ?? {};
      const params = getDefaultParams(targetAgent.params ?? []);

      const data = isStatic
        ? {}
        : {
            agent: targetAgent.agents ? targetAgent.agents[0] : targetAgent.agent ?? agent.value,
            guiAgentId: agent.value,
            params,
            ...(targetAgent.agents ? { agentIndex: 0 } : {}),
            ...(targetAgent.isNestedGraph || targetAgent.isMap ? { nestedGraphIndex: 0, nestedGraphId: store.nestedGraphs[0].id } : {}),
          };

      store.pushNode({
        data,
        nodeId: nodeId.value,
        type: isStatic ? "static" : "computed",
        position: { x: Math.random() * 200, y: Math.random() * 200 },
      });

      nodeId.value = "";
    };

    const addInput = () => {
      customInputs.value.push({ name: "", type: "text" });
    };

    const addOutput = () => {
      customOutputs.value.push({ name: "", type: "text" });
    };

    const addParam = () => {
      customParams.value.push({ name: "", type: "string", defaultValue: "" });
    };

    const resetCustomForm = () => {
      customNodeId.value = "";
      customInputs.value = [{ name: "input", type: "text" }];
      customOutputs.value = [{ name: "output", type: "text" }];
      customParams.value = [{ name: "param", type: "string", defaultValue: "" }];
      customError.value = "";
    };

    const sanitizeParams = () => {
      return customParams.value
        .filter((param) => param.name.trim())
        .map((param) => {
          const cleaned = { ...param } as { name: string; type: string; defaultValue?: string };
          if (cleaned.defaultValue === "") {
            delete cleaned.defaultValue;
          }
          return cleaned;
        });
    };

    const saveCustomNode = () => {
      if (!customNodeId.value.trim()) {
        customError.value = "Custom node ID is required.";
        return;
      }

      const inputs = customInputs.value.filter((input) => input.name.trim());
      const outputs = customOutputs.value.filter((output) => output.name.trim());
      const params = sanitizeParams();

      if (!inputs.length || !outputs.length) {
        customError.value = "At least one input and one output are required.";
        return;
      }

      store.addCustomAgentProfile(customNodeId.value, {
        agent: customNodeId.value,
        inputs,
        outputs,
        ...(params.length ? { params } : {}),
      });

      agent.value = customNodeId.value;
      customError.value = "";
      resetCustomForm();
    };

    return {
      addNode,
      agentProfileCategories,
      nodesKey,
      nodeId,
      agent,
      isError,
      customNodeId,
      customInputs,
      customOutputs,
      customParams,
      customError,
      paramTypes,
      ioTypes,
      addInput,
      addOutput,
      addParam,
      saveCustomNode,
    };
  },
});
</script>
