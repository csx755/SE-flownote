<script setup lang="ts">
const title = defineModel<string>('title', { required: true });
const content = defineModel<string>('content', { required: true });
</script>

<template>
  <section class="editor-shell">
    <div class="title-row">
      <label class="field-label" for="page-title">标题</label>
      <input
        id="page-title"
        v-model="title"
        class="title-input"
        maxlength="255"
        placeholder="输入知识页面标题"
      >
    </div>

    <div class="split-editor" aria-label="Markdown 编辑与实时预览">
      <section class="editor-pane" aria-labelledby="markdown-editor-label">
        <div class="pane-heading">
          <h2 id="markdown-editor-label">Markdown 编辑</h2>
          <span>{{ content.length }} 字符</span>
        </div>
        <textarea
          v-model="content"
          class="markdown-input"
          spellcheck="false"
          placeholder="# 标题&#10;&#10;- 列表项&#10;- 支持 **加粗** 和 `代码`&#10;&#10;```ts&#10;console.log('FlowNote')&#10;```"
        />
      </section>

      <section class="preview-pane" aria-labelledby="markdown-preview-label">
        <div class="pane-heading">
          <h2 id="markdown-preview-label">实时预览</h2>
          <span>自动刷新</span>
        </div>
        <MarkdownPreview :content="content" />
      </section>
    </div>
  </section>
</template>
