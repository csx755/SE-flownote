<template>
  <main class="page-frame">
    <header class="topbar">
      <NuxtLink class="brand" to="/">FlowNote</NuxtLink>
      <nav class="nav-links">
        <NuxtLink to="/pages">知识页面</NuxtLink>
      </nav>
    </header>

    <section class="workspace-band">
      <div class="section-header">
        <p class="eyebrow">MVP-005</p>
        <h1>Markdown 编辑与预览</h1>
        <p>进入知识页面后，可以在左侧编辑 Markdown，并在右侧实时查看标题、列表、代码块等基础格式。</p>
      </div>
      <NuxtLink class="primary-action" to="/pages/new">新建知识页面</NuxtLink>
    </section>
  </main>
</template>
