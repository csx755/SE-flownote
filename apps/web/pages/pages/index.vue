<script setup lang="ts">
import type { KnowledgePage } from '~/types/page';

const { request } = useApi();
const token = ref('');
const pages = ref<KnowledgePage[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');

onMounted(() => {
  token.value = localStorage.getItem('flownote_token') ?? '';
});

const loadPages = async () => {
  errorMessage.value = '';

  if (!token.value.trim()) {
    errorMessage.value = '请先填入登录后获得的 JWT Token。';
    return;
  }

  isLoading.value = true;
  localStorage.setItem('flownote_token', token.value.trim());

  try {
    pages.value = await request<KnowledgePage[]>('/api/v1/pages', {
      token: token.value.trim(),
    });
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载知识页面失败';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <main class="page-frame">
    <header class="topbar">
      <NuxtLink class="brand" to="/">FlowNote</NuxtLink>
      <nav class="nav-links">
        <NuxtLink to="/pages/new">新建</NuxtLink>
      </nav>
    </header>

    <section class="workspace-band">
      <div class="section-header compact">
        <p class="eyebrow">知识页面</p>
        <h1>页面列表</h1>
      </div>

      <div class="token-row">
        <input v-model="token" class="token-input" placeholder="Authorization Token">
        <button class="secondary-action" :disabled="isLoading" @click="loadPages">
          {{ isLoading ? '加载中' : '加载页面' }}
        </button>
      </div>

      <p v-if="errorMessage" class="status error">{{ errorMessage }}</p>

      <div v-if="pages.length" class="page-grid">
        <NuxtLink v-for="page in pages" :key="page.id" class="page-card" :to="`/pages/${page.id}`">
          <strong>{{ page.title }}</strong>
          <span>{{ new Date(page.updatedAt).toLocaleString() }}</span>
        </NuxtLink>
      </div>

      <p v-else class="empty-state">暂无页面。填写 Token 后加载，或直接新建知识页面。</p>
    </section>
  </main>
</template>
