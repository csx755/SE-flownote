<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '~/utils/markdown';

const props = defineProps<{
  content: string;
}>();

const rendered = computed(() => renderMarkdown(props.content));
</script>

<template>
  <article class="markdown-preview" v-html="rendered" />
</template>
