<script setup lang="ts">
import type { KnowledgePage } from '~/types/page';

const route = useRoute();
const router = useRouter();
const { request } = useApi();

const pageId = computed(() => String(route.params.id));
const isNewPage = computed(() => pageId.value === 'new');
const token = ref('');
const title = ref('');
const content = ref('# 新知识页面\n\n- 在这里记录要沉淀的内容\n- 右侧会实时预览 Markdown\n\n```ts\nconsole.log("FlowNote");\n```');
const isLoading = ref(false);
const isSaving = ref(false);
const statusMessage = ref('');
const errorMessage = ref('');

onMounted(async () => {
  token.value = localStorage.getItem('flownote_token') ?? '';

  if (!isNewPage.value) {
    await loadPage();
  }
});

const loadPage = async () => {
  errorMessage.value = '';

  if (!token.value.trim()) {
    errorMessage.value = '请先填入登录后获得的 JWT Token。';
    return;
  }

  isLoading.value = true;

  try {
    const page = await request<KnowledgePage>(`/api/v1/pages/${pageId.value}`, {
      token: token.value.trim(),
    });
    title.value = page.title;
    content.value = page.content;
    localStorage.setItem('flownote_token', token.value.trim());
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载知识页面失败';
  } finally {
    isLoading.value = false;
  }
};

const savePage = async () => {
  errorMessage.value = '';
  statusMessage.value = '';

  if (!token.value.trim()) {
    errorMessage.value = '请先填入登录后获得的 JWT Token。';
    return;
  }

  if (!title.value.trim()) {
    errorMessage.value = '标题不能为空。';
    return;
  }

  isSaving.value = true;
  localStorage.setItem('flownote_token', token.value.trim());

  try {
    const payload = JSON.stringify({
      title: title.value.trim(),
      content: content.value,
    });

    const page = isNewPage.value
      ? await request<KnowledgePage>('/api/v1/pages', {
          method: 'POST',
          body: payload,
          token: token.value.trim(),
        })
      : await request<KnowledgePage>(`/api/v1/pages/${pageId.value}`, {
          method: 'PATCH',
          body: payload,
          token: token.value.trim(),
        });

    statusMessage.value = '已保存。';

    if (isNewPage.value) {
      await router.replace(`/pages/${page.id}`);
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存失败';
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <main class="page-frame">
    <header class="topbar">
      <NuxtLink class="brand" to="/">FlowNote</NuxtLink>
      <nav class="nav-links">
        <NuxtLink to="/pages">知识页面</NuxtLink>
        <NuxtLink to="/pages/new">新建</NuxtLink>
      </nav>
    </header>

    <section class="workspace-band editor-band">
      <div class="section-header compact">
        <p class="eyebrow">MVP-005</p>
        <h1>{{ isNewPage ? '新建知识页面' : '编辑知识页面' }}</h1>
      </div>

      <div class="toolbar-row">
        <input v-model="token" class="token-input" placeholder="Authorization Token">
        <button v-if="!isNewPage" class="secondary-action" :disabled="isLoading" @click="loadPage">
          {{ isLoading ? '加载中' : '重新加载' }}
        </button>
        <button class="primary-action" :disabled="isSaving" @click="savePage">
          {{ isSaving ? '保存中' : '保存' }}
        </button>
      </div>

      <p v-if="statusMessage" class="status success">{{ statusMessage }}</p>
      <p v-if="errorMessage" class="status error">{{ errorMessage }}</p>

      <MarkdownEditor v-model:title="title" v-model:content="content" />
    </section>
  </main>
</template>
