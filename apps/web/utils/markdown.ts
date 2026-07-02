import MarkdownIt from 'markdown-it';
import markdownItMark from 'markdown-it-mark';

export const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
}).use(markdownItMark);  // ==高亮== 支持

export const renderMarkdown = (source: string) => markdown.render(source || '');

/** 去除 Markdown 格式符号，用于列表中的纯文本标题展示 */
export const stripMarkdown = (source: string): string => {
  if (!source) return '';
  return source
    .replace(/^#{1,6}\s+/gm, '')     // 标题 #
    .replace(/\*\*(.+?)\*\*/g, '$1')  // 加粗
    .replace(/\*(.+?)\*/g, '$1')      // 斜体
    .replace(/`(.+?)`/g, '$1')        // 行内代码
    .replace(/~~(.+?)~~/g, '$1')      // 删除线
    .replace(/==(.+?)==/g, '$1')      // 高亮
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 链接
    .replace(/!\[.*?\]\(.+?\)/g, '')  // 图片
    .replace(/^>\s+/gm, '')           // 引用
    .replace(/^[-*+]\s+/gm, '')       // 无序列表
    .replace(/^\d+\.\s+/gm, '')       // 有序列表
    .trim();
};
