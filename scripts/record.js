import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { localDay, readDay, writeDay } from '../lib.js';
import { categories } from '../public/categories.js';

// 由项目聊天助手使用；网站不生成分析，也不触发题目录入。
const [kind, input, ...flags] = process.argv.slice(2);
if (!['question', 'review'].includes(kind) || !input || !flags.includes('--confirmed')) {
  console.error('用法：node scripts/record.js question|review <整理后的 JSON 文件> --confirmed\n仅在用户明确要求录入或保存回顾后执行。');
  process.exit(1);
}
const payload = JSON.parse(await fs.readFile(input, 'utf8'));
const root = process.env.DATA_DIR || fileURLToPath(new URL('../data/', import.meta.url));
const day = payload.date || localDay();
const data = await readDay(root, day);
if (kind === 'question') {
  if (!payload.title?.trim() || !payload.analysis?.problem?.trim()) throw new Error('记录需要标题和题目正文');
  if (!categories[payload.category]?.includes(payload.subcategory)) throw new Error('请填写有效的 category（科目）和 subcategory（章节），分类见 public/categories.js');
  const score = payload.analysis.score;
  const difficulty = payload.analysis.difficulty ?? null;
  if (difficulty !== null && (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5)) throw new Error('主观难度必须是 1–5 的整数或 null');
  payload.analysis.difficulty = difficulty;
  if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5)) throw new Error('评分必须是 1–5 的整数或 null');
  data.questions.push({ id: randomUUID(), title: payload.title, category: payload.category, subcategory: payload.subcategory, createdAt: new Date().toISOString(), source: 'project-chat', messages: payload.messages || [], analysis: payload.analysis });
  if (data.review) data.review.stale = true;
} else {
  if (!payload.content?.trim()) throw new Error('回顾内容不能为空');
  data.review = { content: payload.content, createdAt: new Date().toISOString(), source: 'project-chat', stale: false };
}
await writeDay(root, day, data);
console.log(`已保存：${path.join(root, 'days', `${day}.json`)}`);
