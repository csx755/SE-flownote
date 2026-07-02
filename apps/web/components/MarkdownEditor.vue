<script setup lang="ts">
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown as cmMarkdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue';

const title = defineModel<string>('title', { required: true });
const content = defineModel<string>('content', { required: true });

const editorEl = ref<HTMLDivElement>();
let editorView: EditorView | null = null;

// 在光标处插入 / 包裹选中的文本
function insertMarkdown(wrapper: string, placeholder: string) {
  if (!editorView) return;
  const sel = editorView.state.selection.main;
  const selected = editorView.state.sliceDoc(sel.from, sel.to);
  const text = selected || placeholder;
  const insert = wrapper.replace('$1', text);
  editorView.dispatch({
    changes: { from: sel.from, to: sel.to, insert },
    selection: { anchor: sel.from + insert.indexOf(text) + text.length },
  });
  editorView.focus();
}

// 在行首插入前缀
function insertLinePrefix(prefix: string, placeholder: string) {
  if (!editorView) return;
  const sel = editorView.state.selection.main;
  const line = editorView.state.doc.lineAt(sel.from);
  const insert = prefix + (sel.from === sel.to ? placeholder : '');
  editorView.dispatch({
    changes: { from: line.from, to: sel.to, insert },
  });
  editorView.focus();
}

onMounted(async () => {
  await nextTick();
  if (!editorEl.value) return;

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      content.value = update.state.doc.toString();
    }
  });

  const state = EditorState.create({
    doc: content.value || '',
    extensions: [
      cmMarkdown(),
      history(),
      updateListener,
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-editor': { height: '100%', fontSize: '15px' },
        '.cm-content': {
          fontFamily: '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
          minHeight: '500px',
          padding: '18px',
          lineHeight: '1.65',
        },
        '.cm-gutters': { display: 'none' },
      }),
    ],
  });

  editorView = new EditorView({
    state,
    parent: editorEl.value,
  });
});

watch(content, (newVal) => {
  if (editorView && newVal !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: newVal || '' },
    });
  }
});

onBeforeUnmount(() => {
  editorView?.destroy();
});

const toolbarButtons = [
  { label: 'B', title: '加粗', action: () => insertMarkdown('**$1**', '加粗文本') },
  { label: 'I', title: '斜体', action: () => insertMarkdown('*$1*', '斜体文本') },
  { label: 'S', title: '删除线', action: () => insertMarkdown('~~$1~~', '删除文本') },
  { label: 'H', title: '高亮', action: () => insertMarkdown('==$1==', '高亮文本') },
  { label: '`', title: '行内代码', action: () => insertMarkdown('`$1`', '代码') },
  { label: 'H1', title: '一级标题', action: () => insertLinePrefix('# ', '标题') },
  { label: 'H2', title: '二级标题', action: () => insertLinePrefix('## ', '标题') },
  { label: 'H3', title: '三级标题', action: () => insertLinePrefix('### ', '标题') },
  { label: '•', title: '无序列表', action: () => insertLinePrefix('- ', '列表项') },
  { label: '1.', title: '有序列表', action: () => insertLinePrefix('1. ', '列表项') },
  { label: '>', title: '引用', action: () => insertLinePrefix('> ', '引用') },
  { label: '```', title: '代码块', action: () => insertMarkdown('```\n$1\n```', '代码块') },
  { label: '🔗', title: '链接', action: () => insertMarkdown('[$1](url)', '链接文本') },
  { label: '☐', title: '任务列表', action: () => insertLinePrefix('- [ ] ', '任务') },
  { label: '—', title: '分割线', action: () => insertMarkdown('\n---\n', '') },
  { label: '⊞', title: '表格', action: () => insertMarkdown(
    '| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |', '') },
];
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
      <section class="editor-pane">
        <div class="pane-heading">
          <h2>Markdown 编辑</h2>
          <span>{{ content.length }} 字符</span>
        </div>
        <!-- 工具栏 -->
        <div class="editor-toolbar">
          <button
            v-for="btn in toolbarButtons"
            :key="btn.label"
            :title="btn.title"
            class="toolbar-btn"
            @click="btn.action()"
          >
            {{ btn.label }}
          </button>
        </div>
        <div ref="editorEl" class="codemirror-host" />
      </section>

      <section class="preview-pane">
        <div class="pane-heading">
          <h2>实时预览</h2>
          <span>自动刷新</span>
        </div>
        <MarkdownPreview :content="content" />
      </section>
    </div>
  </section>
</template>

<style scoped>
.editor-shell {
  display: grid;
  gap: 16px;
}

.title-row {
  display: grid;
  gap: 8px;
}

.field-label {
  color: #3d4843;
  font-size: 14px;
  font-weight: 750;
}

.title-input {
  width: 100%;
  height: 52px;
  padding: 0 14px;
  border: 1px solid #d7d3c7;
  border-radius: 8px;
  color: #17201d;
  background: #ffffff;
  font-size: 22px;
  font-weight: 760;
  outline: none;
}

.title-input:focus {
  border-color: #1f6f5b;
}

.split-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-height: 560px;
  border: 1px solid #d7d3c7;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.editor-pane,
.preview-pane {
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-width: 0;
  overflow: hidden;
}

.editor-pane {
  border-right: 1px solid #d7d3c7;
}

.pane-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 0 16px;
  border-bottom: 1px solid #ebe8df;
  background: #fbfaf7;
}

.pane-heading h2 {
  margin: 0;
  color: #29362f;
  font-size: 14px;
  font-weight: 600;
}

.pane-heading span {
  color: #7a837d;
  font-size: 13px;
}

/* ── 工具栏 ───────────────────────────── */
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 4px 8px;
  border-bottom: 1px solid #ebe8df;
  background: #fafaf7;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #4a5a54;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.toolbar-btn:hover {
  background: #e8efe9;
  border-color: #d0dbd4;
}

/* ── CodeMirror 宿主 ───────────────────── */
.codemirror-host {
  flex: 1;
  overflow: auto;
}

@media (max-width: 860px) {
  .split-editor {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .editor-pane {
    border-right: 0;
    border-bottom: 1px solid #d7d3c7;
  }

  .codemirror-host .cm-content {
    min-height: 300px;
  }
}
</style>
