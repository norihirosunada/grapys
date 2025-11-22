<template>
  <div class="mb-2">
    <button
      class="w-full cursor-pointer items-center rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
      @click="toggle"
    >
      {{ isOpen ? "Close Custom Node" : "New Custom Node" }}
    </button>
    <div v-if="isOpen" class="mt-2 space-y-2 rounded-md border-2 border-amber-300 bg-white p-3 text-left text-sm text-black">
      <h2 class="text-left text-base font-bold">Custom Node</h2>
      <p class="text-xs text-gray-600">Define a reusable node profile that will appear in the Add Node list.</p>

      <div class="space-y-1">
        <label class="block text-xs text-gray-600">Node ID</label>
        <input v-model="form.agentId" class="w-full rounded-md border-2 border-gray-300 px-2 py-1" placeholder="unique-node-id" />
      </div>

      <div class="space-y-1">
        <label class="block text-xs text-gray-600">Category</label>
        <input v-model="form.category" class="w-full rounded-md border-2 border-gray-300 px-2 py-1" placeholder="custom" />
      </div>

      <div class="space-y-1">
        <label class="block text-xs text-gray-600">Agent implementation reference</label>
        <input
          v-model="form.agent"
          class="w-full rounded-md border-2 border-gray-300 px-2 py-1"
          placeholder="openAIAgent"
        />
      </div>

      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <label class="block text-xs text-gray-600">Inputs</label>
          <button class="text-xs text-amber-600" @click="addInput">+ Add</button>
        </div>
        <div v-if="form.inputs.length === 0" class="text-xs text-gray-500">No inputs</div>
        <div v-for="(input, index) in form.inputs" :key="`input-${index}`" class="rounded-md border border-gray-200 p-2">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs text-gray-600">Input {{ index + 1 }}</span>
            <button class="text-xs text-red-600" @click="removeInput(index)">Remove</button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input v-model="input.name" class="rounded-md border-2 border-gray-300 px-2 py-1" placeholder="name" />
            <select v-model="input.type" class="rounded-md border-2 border-gray-300 px-2 py-1 text-black">
              <option value="text">text</option>
              <option value="array">array</option>
              <option value="message">message</option>
              <option value="data">data</option>
              <option value="wait">wait</option>
              <option value="boolean">boolean</option>
            </select>
          </div>
        </div>
      </div>

      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <label class="block text-xs text-gray-600">Outputs</label>
          <button class="text-xs text-amber-600" @click="addOutput">+ Add</button>
        </div>
        <div v-if="form.outputs.length === 0" class="text-xs text-gray-500">No outputs</div>
        <div v-for="(output, index) in form.outputs" :key="`output-${index}`" class="rounded-md border border-gray-200 p-2">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs text-gray-600">Output {{ index + 1 }}</span>
            <button class="text-xs text-red-600" @click="removeOutput(index)">Remove</button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input v-model="output.name" class="rounded-md border-2 border-gray-300 px-2 py-1" placeholder="name" />
            <select v-model="output.type" class="rounded-md border-2 border-gray-300 px-2 py-1 text-black">
              <option value="text">text</option>
              <option value="array">array</option>
              <option value="message">message</option>
              <option value="data">data</option>
              <option value="wait">wait</option>
              <option value="boolean">boolean</option>
            </select>
          </div>
        </div>
      </div>

      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <label class="block text-xs text-gray-600">Params</label>
          <button class="text-xs text-amber-600" @click="addParam">+ Add</button>
        </div>
        <div v-if="form.params.length === 0" class="text-xs text-gray-500">No params</div>
        <div v-for="(param, index) in form.params" :key="`param-${index}`" class="rounded-md border border-gray-200 p-2">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs text-gray-600">Param {{ index + 1 }}</span>
            <button class="text-xs text-red-600" @click="removeParam(index)">Remove</button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input v-model="param.name" class="rounded-md border-2 border-gray-300 px-2 py-1" placeholder="name" />
            <select v-model="param.type" class="rounded-md border-2 border-gray-300 px-2 py-1 text-black">
              <option value="string">string</option>
              <option value="text">text</option>
              <option value="data">data</option>
              <option value="boolean">boolean</option>
              <option value="float">float</option>
              <option value="int">int</option>
              <option value="enum">enum</option>
            </select>
            <input
              v-model="param.defaultValue"
              class="rounded-md border-2 border-gray-300 px-2 py-1"
              placeholder="default value (optional)"
            />
            <input
              v-model="param.valuesInput"
              class="rounded-md border-2 border-gray-300 px-2 py-1"
              placeholder="enum values (comma separated)"
              :disabled="param.type !== 'enum'"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <button
          class="mr-2 w-full rounded-full bg-amber-500 px-4 py-2 text-white hover:bg-amber-700"
          @click="handleSave"
        >
          Save Custom Node
        </button>
        <button class="w-full rounded-full bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300" @click="reset">
          Reset
        </button>
      </div>

      <div v-if="errorMessage" class="rounded-md bg-red-50 p-2 text-xs text-red-600">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from "vue";
import { useCustomAgentStore } from "../store/customAgents";
import type { InputOutputData, ParamData, ParamType } from "../utils/gui/type";

export default defineComponent({
  setup() {
    const customAgentStore = useCustomAgentStore();
    const isOpen = ref(false);
    const errorMessage = ref("");

    const form = reactive({
      agentId: "",
      category: "custom",
      agent: "",
      inputs: [] as InputOutputData[],
      outputs: [] as InputOutputData[],
      params: [] as ({ defaultValue?: string } & ParamData & { valuesInput?: string })[],
    });

    const toggle = () => {
      isOpen.value = !isOpen.value;
      errorMessage.value = "";
    };

    const reset = () => {
      form.agentId = "";
      form.category = "custom";
      form.agent = "";
      form.inputs = [];
      form.outputs = [];
      form.params = [];
      errorMessage.value = "";
    };

    const addInput = () => {
      form.inputs.push({ name: "", type: "text" });
    };
    const removeInput = (index: number) => {
      form.inputs.splice(index, 1);
    };

    const addOutput = () => {
      form.outputs.push({ name: "", type: "text" });
    };
    const removeOutput = (index: number) => {
      form.outputs.splice(index, 1);
    };

    const addParam = () => {
      form.params.push({ name: "", type: "string", defaultValue: "", values: [], valuesInput: "" });
    };
    const removeParam = (index: number) => {
      form.params.splice(index, 1);
    };

    const parseDefaultValue = (value: string | undefined, type?: ParamType) => {
      if (value === undefined || value === "") {
        return undefined;
      }
      if (type === "boolean") {
        return value === "true";
      }
      if (type === "float" || type === "int") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
      }
      return value;
    };

    const sanitizeIO = (entries: InputOutputData[]) => {
      return entries
        .filter((entry) => entry.name)
        .map((entry) => ({
          name: entry.name,
          ...(entry.type ? { type: entry.type } : {}),
        }));
    };

    const sanitizeParams = () => {
      return form.params
        .filter((param) => param.name)
        .map((param) => {
          const values =
            param.type === "enum" && param.valuesInput
              ? param.valuesInput
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean)
              : undefined;
          const defaultValue = parseDefaultValue(param.defaultValue, param.type);
          const payload: ParamData = {
            name: param.name,
            ...(param.type ? { type: param.type } : {}),
            ...(defaultValue !== undefined ? { defaultValue } : {}),
            ...(values && values.length > 0 ? { values } : {}),
          };
          return payload;
        });
    };

    const handleSave = () => {
      if (!form.agentId || !form.agent) {
        errorMessage.value = "Node ID and agent implementation are required.";
        return;
      }
      const profile = {
        agent: form.agent,
        inputs: sanitizeIO(form.inputs),
        outputs: sanitizeIO(form.outputs),
        params: sanitizeParams(),
      };
      customAgentStore.upsertAgent(form.category || "custom", form.agentId, profile);
      reset();
      isOpen.value = false;
    };

    return {
      addInput,
      addOutput,
      addParam,
      removeInput,
      removeOutput,
      removeParam,
      form,
      handleSave,
      isOpen,
      toggle,
      reset,
      errorMessage,
    };
  },
});
</script>
