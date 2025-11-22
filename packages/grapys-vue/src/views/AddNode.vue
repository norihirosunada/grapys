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

      <optgroup :label="category" v-for="(category, categoryKey) in Object.keys(agentProfilesCategory)" :key="categoryKey">
        <option v-for="(agentName, agentKey) in Object.keys(agentProfilesCategory[category])" :key="agentKey">
          {{ agentName }}
        </option>
      </optgroup>
    </select>
  </div>
  <div class="mt-3 rounded-md border border-gray-200 p-3 text-left">
    <h3 class="mb-2 text-sm font-semibold text-gray-700">Create Custom Node</h3>
    <label class="mb-0.5 block text-xs text-gray-600">Custom node ID:</label>
    <input
      type="text"
      v-model="customId"
      class="mb-2 w-full rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
      placeholder="Unique node ID"
    />
    <label class="mb-0.5 block text-xs text-gray-600">Inputs (one per line, name:type):</label>
    <textarea
      class="mb-2 w-full resize-none rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
      rows="3"
      v-model="customInputs"
    ></textarea>
    <label class="mb-0.5 block text-xs text-gray-600">Outputs (one per line, name:type):</label>
    <textarea
      class="mb-2 w-full resize-none rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
      rows="3"
      v-model="customOutputs"
    ></textarea>
    <label class="mb-0.5 block text-xs text-gray-600">Parameters (optional, one per line, name:type):</label>
    <textarea
      class="mb-2 w-full resize-none rounded-md border-2 border-gray-300 px-2 py-1 text-sm text-black"
      rows="2"
      v-model="customParams"
    ></textarea>
    <div class="mb-2 text-xs text-gray-600">Types are optional; default is text.</div>
    <div v-if="customError" class="mb-2 text-xs text-red-600">{{ customError }}</div>
    <SideMenuButton @click="registerCustomAgent">Save custom node</SideMenuButton>
  </div>
  <div>
    <SideMenuButton @click="addNode"> Add node </SideMenuButton>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";
import { useStore } from "../store";
import type { AgentProfile, InputOutputType, ParamData } from "../utils/gui/type";
import { getDefaultParams } from "../utils/gui/utils";
import SideMenuButton from "../components/SideMenuButton.vue";
// import { graphs } from "../graph";

export default defineComponent({
  components: { SideMenuButton },
  setup() {
    const nodeId = ref("");
    const agent = ref("");
    const isError = ref(false);
    const customError = ref("");
    const customId = ref("");
    const customInputs = ref("input:text");
    const customOutputs = ref("output:text");
    const customParams = ref("");

    const store = useStore();

    const agentProfilesCategory = computed(() => store.agentProfilesCategory);
    const availableAgents = computed(() => store.agentProfiles);
    const nodesKey = computed(() => Object.keys(availableAgents.value));

    watch(
      nodesKey,
      (keys) => {
        if (!agent.value && keys.length) {
          agent.value = keys[0];
        }
      },
      { immediate: true },
    );

    watch(nodeId, () => {
      isError.value = false;
    });

    const parseIOList = (raw: string) => {
      return raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)
        .map((line) => {
          const [name, type] = line.split(":").map((item) => item.trim());
          return type ? { name, type: type as InputOutputType } : { name };
        });
    };

    const parseParams = (raw: string) => {
      return raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)
        .map((line) => {
          const [name, type] = line.split(":").map((item) => item.trim());
          return (type ? { name, type: type as ParamData["type"] } : { name }) as ParamData;
        });
    };

    const registerCustomAgent = () => {
      customError.value = "";
      const id = customId.value.trim();
      if (!id) {
        customError.value = "Custom node ID is required.";
        return;
      }
      if (availableAgents.value[id]) {
        customError.value = "Node ID already exists.";
        return;
      }
      const inputs = parseIOList(customInputs.value);
      const outputs = parseIOList(customOutputs.value);
      if (!inputs.length || !outputs.length) {
        customError.value = "At least one input and output are required.";
        return;
      }
      const params = parseParams(customParams.value);
      const profile: AgentProfile = {
        agent: id,
        inputs,
        outputs,
        params,
      };
      store.registerAgentProfile(id, profile);
      agent.value = id;
      customId.value = "";
    };

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
      const targetAgent = availableAgents.value[agent.value] ?? ({} as AgentProfile);
      const params = getDefaultParams(targetAgent.params ?? []);

      const data = isStatic
        ? {}
        : {
            agent: targetAgent.agents ? targetAgent.agents[0] : targetAgent.agent,
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
    return {
      addNode,
      agentProfilesCategory,
      nodesKey,
      nodeId,
      agent,

      isError,
      customError,
      customId,
      customInputs,
      customOutputs,
      customParams,
      registerCustomAgent,
    };
  },
});
</script>
