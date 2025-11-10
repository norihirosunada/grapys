<template>
  <li class="leading-relaxed">
    <div>
      <span class="font-medium">{{ node.name }}</span>
      <span v-if="node.type === 'nested'" class="text-xs text-sky-600"> (Nested template)</span>
      <span v-else-if="node.type === 'template'" class="text-xs text-gray-500"> (Template)</span>
      <span v-else class="text-xs text-gray-400"> (Inline)</span>
    </div>
    <ul v-if="node.children.length" class="ml-4 list-disc">
      <NestedGraphTreeNode v-for="child in node.children" :key="child.id" :node="child" />
    </ul>
  </li>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export type NestedTreeNode = {
  id: string;
  name: string;
  type: "template" | "nested" | "unknown";
  children: NestedTreeNode[];
};

export default defineComponent({
  name: "NestedGraphTreeNode",
  props: {
    node: {
      type: Object as PropType<NestedTreeNode>,
      required: true,
    },
  },
});
</script>
