<template>
  <div v-if="param.type">
    <label class="text-xs text-gray-300">{{ param.name }}</label>

    <div v-if="param.type === 'string'">
      <input ref="inputRef" type="text" class="w-full rounded-md border border-gray-300 p-1 text-black" v-model="inputValue" @mousedown.stop @touchstart.stop />
    </div>
    <div v-else-if="param.type === 'text'">
      <textarea
        ref="textareaRef"
        :rows="rows"
        class="w-full resize-none rounded-md border border-gray-300 p-1 text-black"
        v-model="textAreaValue"
        @mousedown.stop
        @touchstart.stop
        @wheel.stop
      ></textarea>
    </div>
    <div v-else-if="param.type === 'data'">
      <textarea
        ref="textareaRef"
        :rows="rows"
        class="w-full resize-none rounded-md border border-gray-300 p-1 text-black"
        v-model="textAreaValue"
        @mousedown.stop
        @touchstart.stop
        @wheel.stop
      ></textarea>
    </div>
    <div v-else-if="param.type === 'code'">
      <textarea
        ref="codeAreaRef"
        :rows="codeRows"
        class="w-full resize-none rounded-md border border-gray-300 bg-gray-50 p-2 font-mono text-xs text-black"
        v-model="codeValue"
        @mousedown.stop
        @touchstart.stop
        @wheel.stop
      ></textarea>
      <p v-if="codeError" class="mt-1 whitespace-pre-wrap text-xs text-red-500">{{ codeError }}</p>
      <p v-else class="mt-1 text-[11px] text-gray-500">Code compiles to JavaScript for sandboxed execution.</p>
    </div>
    <div v-else-if="param.type === 'int'">
      <!-- TODO convert int after user input: min, max, defaultValue -->
      <input
        ref="inputRef"
        type="number"
        class="w-full rounded-md border border-gray-300 p-1 text-black"
        step="1"
        pattern="\d*"
        inputmode="numeric"
        v-model="inputValue"
        @mousedown.stop
        @touchstart.stop
      />
    </div>
    <div v-else-if="param.type === 'float'">
      <!-- step can be customized per parameter, defaults to 0.1 for float inputs -->
      <!-- min/max attributes are only set when param.min/max are defined (Vue automatically omits undefined attributes) -->
      <input
        ref="inputRef"
        type="number"
        class="w-full rounded-md border border-gray-300 p-1 text-black"
        :step="param.step ?? 0.1"
        :min="param.min"
        :max="param.max"
        v-model="inputValue"
        @mousedown.stop
        @touchstart.stop
      />
    </div>
    <div v-else-if="param.type === 'boolean'">
      <select v-model="booleanValue" ref="selectFormRef" @change="selectUpdate" class="rounded-md border border-gray-300">
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    </div>
    <div v-else-if="param.type === 'enum'">
      <select v-model="enumValue" @change="enumUpdate">
        <option :value="value" v-for="(value, k) in param.values" :key="k">{{ value }}</option>
      </select>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref, onBeforeUnmount, onMounted, watch } from "vue";
import ts from "typescript";
import type { ParamData, ApplicationData } from "../utils/gui/type";

import { useStore } from "../store";

export default defineComponent({
  props: {
    param: {
      type: Object as PropType<ParamData>,
      required: true,
    },
    appData: {
      type: Object as PropType<ApplicationData>,
      required: true,
    },
    nodeIndex: {
      type: Number,
      required: true,
    },
  },
  emits: ["focusEvent", "blurEvent", "updateValue"],
  setup(props, ctx) {
    const store = useStore();

    const textareaRef = ref();
    const inputRef = ref();
    const selectFormRef = ref();
    const codeAreaRef = ref();

    const rows = ref(3);
    const codeRows = ref(8);

    const key = props.param.name;
    const value = (props.appData.params ?? {})[key];

    const inputValue = ref(value ?? "");
    const booleanValue = ref(value === true ? "true" : "false");
    const textAreaValue = ref(String(value ?? ""));
    const codeValue = ref(String(value ?? ""));
    const enumValue = ref(value ?? (props.param.type === "enum" ? props.param?.values?.[0] : ""));
    const codeError = ref<string | null>(null);

    watch(
      () => props.appData,
      (updateParams) => {
        const updateValue = (updateParams.params ?? {})[key];

        if (props.param.type === "text" && updateValue !== textAreaValue.value) {
          textAreaValue.value = updateValue;
        }
        if (props.param.type === "data") {
          if (typeof updateValue === "object" || Array.isArray(updateValue)) {
            textAreaValue.value = JSON.stringify(updateValue, null, 2);
          } else {
            textAreaValue.value = updateValue;
          }
        }
        if (props.param.type === "code" && updateValue !== codeValue.value) {
          codeValue.value = typeof updateValue === "string" ? updateValue : String(updateValue ?? "");
        }
        if (props.param.type === "string" && updateValue !== inputValue.value) {
          inputValue.value = updateValue;
        }
        if (props.param.type === "int" || props.param.type === "float") {
          const numberValue = Number(inputValue.value);
          if (numberValue !== updateValue) {
            inputValue.value = updateValue;
          }
        }
        if (props.param.type === "boolean") {
          const booleanText = updateValue ? "true" : "false";
          if (booleanText !== booleanValue.value) {
            booleanValue.value = booleanText;
          }
        }
        if (props.param.type === "enum" && updateValue !== enumValue.value) {
          enumValue.value = updateValue ?? props.param?.values?.[0];
        }
        // inputValue
      },
    );
    const validateCode = (source: string) => {
      try {
        if (/\bimport\s+|\brequire\s*\(/.test(source)) {
          codeError.value = "Module imports are not allowed inside the TypeScript node.";
          return;
        }
        ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
        });
        codeError.value = null;
      } catch (error) {
        codeError.value = error instanceof Error ? error.message : String(error);
      }
    };

    watch(
      () => codeValue.value,
      (value) => {
        if (props.param.type === "code") {
          validateCode(value);
        }
      },
      { immediate: true },
    );

    const focusEvent = (event: FocusEvent) => {
      if (event.target instanceof HTMLTextAreaElement) {
        ctx.emit("focusEvent");
        if (props.param.type === "code") {
          codeRows.value = 12;
        } else {
          rows.value = 10;
        }
      }
    };
    const blurEvent = (event: FocusEvent) => {
      if (event.target instanceof HTMLTextAreaElement) {
        if (props.param.type === "code") {
          codeRows.value = 8;
          ctx.emit("blurEvent");
          store.updateNodeParam(props.nodeIndex, key, codeValue.value);
        } else {
          rows.value = 3;
          ctx.emit("blurEvent");
          store.updateNodeParam(props.nodeIndex, key, textAreaValue.value);
        }
      }
    };
    const blurUpdateEvent = () => {
      store.updateNodeParam(props.nodeIndex, key, inputValue.value);
    };
    /*
    watch([booleanValue], () => {
      if (props.param.type === "boolean") {
        store.updateNodeParam(props.nodeIndex, key, booleanValue.value === "true");
      }
    });
    */
    const selectUpdate = () => {
      store.updateNodeParam(props.nodeIndex, key, booleanValue.value === "true");
    };
    const enumUpdate = () => {
      store.updateNodeParam(props.nodeIndex, key, enumValue.value);
    };

    onMounted(() => {
      if (textareaRef.value) {
        textareaRef.value.addEventListener("focus", focusEvent);
        textareaRef.value.addEventListener("blur", blurEvent);
      }
      if (codeAreaRef.value) {
        codeAreaRef.value.addEventListener("focus", focusEvent);
        codeAreaRef.value.addEventListener("blur", blurEvent);
      }
      if (inputRef.value) {
        inputRef.value.addEventListener("blur", blurUpdateEvent);
      }
    });
    onBeforeUnmount(() => {
      if (textareaRef.value) {
        textareaRef.value.removeEventListener("focus", focusEvent);
        textareaRef.value.removeEventListener("blur", blurEvent);
      }
      if (codeAreaRef.value) {
        codeAreaRef.value.removeEventListener("focus", focusEvent);
        codeAreaRef.value.removeEventListener("blur", blurEvent);
      }
      if (inputRef.value) {
        inputRef.value.removeEventListener("blur", blurUpdateEvent);
      }
    });

    return {
      booleanValue,
      inputValue,
      textAreaValue,
      codeValue,
      enumValue,
      codeError,

      selectUpdate,
      enumUpdate,

      inputRef,
      textareaRef,
      codeAreaRef,
      selectFormRef,

      rows,
      codeRows,
    };
  },
});
</script>
