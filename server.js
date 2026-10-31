import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { localDay, readDay, writeDay } from './lib.js';
import { categories } from './public/categories.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataRoot = process.env.DATA_DIR || path.join(root, 'data');
await fs.mkdir(path.join(dataRoot, 'days'), { recursive: true });
const app = express();
app.use((req, res, next) => {
  if (!process.env.AUTH_PASSWORD) return next();
  const expected = `Basic ${Buffer.from(`${process.env.AUTH_USER || 'wenya'}:${process.env.AUTH_PASSWORD}`).toString('base64')}`;
  if (req.headers.authorization === expected) return next();
  res.set('WWW-Authenticate', 'Basic realm="Wenya"').status(401).send('需要登录');
});
app.use((req, res, next) => {
  if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({ error: '仅允许当前网页访问' });
  next();
});
app.use(express.json({ limit: '30mb' }));
app.use('/vendor/katex', express.static(path.join(root, 'node_modules/katex/dist')));
app.use('/vendor/marked', express.static(path.join(root, 'node_modules/marked/lib')));
app.use(express.static(path.join(root, 'public')));
let queue = Promise.resolve();
function changeDay(day, fn) {
  const job = queue.then(async () => { const data = await readDay(dataRoot, day); fn(data); await writeDay(dataRoot, day, data); return data; });
  queue = job.catch(() => {}); return job;
}
app.get('/api/info', (req, res) => res.json({ today: localDay(), dataPath: dataRoot }));
app.get('/api/days', async (req, res) => {
  const files = (await fs.readdir(path.join(dataRoot, 'days'))).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
  res.json(await Promise.all(files.map(async file => {
    const d = await readDay(dataRoot, file.slice(0, 10));
    return { date: d.date, questions: d.questions.length, notes: d.notes.length,
      categories: Object.fromEntries(Object.keys(categories).map(category => [category, d.questions.filter(q => (q.category || '高等代数') === category).length])),
      subcategories: Object.fromEntries(Object.keys(categories).map(category => [category, Object.fromEntries([...categories[category], '未分类'].map(subcategory => [subcategory, d.questions.filter(q => (q.category || '高等代数') === category && (q.subcategory || '未分类') === subcategory).length]))]))
    };
  })));
});
app.get('/api/questions', async (req, res) => {
  const scope = req.query.scope || 'all'; const value = String(req.query.value || '');
  if (!['day', 'month', 'all'].includes(scope)) throw new Error('显示范围不正确');
  if (scope === 'day' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('日期格式不正确');
  if (scope === 'month' && !/^\d{4}-\d{2}$/.test(value)) throw new Error('月份格式不正确');
  const files = (await fs.readdir(path.join(dataRoot, 'days'))).filter(file => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)).filter(file => scope === 'all' || (scope === 'month' ? file.startsWith(value) : file === `${value}.json`)).sort().reverse();
  const days = await Promise.all(files.map(file => readDay(dataRoot, file.slice(0, 10))));
  const compact = req.query.compact === '1';
  res.json(days.flatMap(day => day.questions.map(question => ({ ...question, recordDate: day.date, messages: compact ? question.messages.map(({ image, ...message }) => message) : question.messages }))));
});
app.get('/api/days/:day', async (req, res) => res.json(await readDay(dataRoot, req.params.day)));
app.post('/api/days/:day/notes', async (req, res) => {
  if (!req.body.content?.trim()) throw new Error('笔记内容不能为空');
  const note = { id: randomUUID(), content: req.body.content, noteDate: req.params.day, createdAt: new Date().toISOString() };
  if (req.body.questionId) Object.assign(note, { questionId: req.body.questionId, questionTitle: req.body.questionTitle, category: req.body.category, subcategory: req.body.subcategory });
  await changeDay(req.params.day, d => { d.notes.push(note); if (d.review) d.review.stale = true; });
  res.json(note);
});
app.put('/api/days/:day/notes/:id', async (req, res) => {
  if (!req.body.content?.trim()) throw new Error('笔记内容不能为空');
  await changeDay(req.params.day, d => {
    const n = d.notes.find(n => n.id === req.params.id);
    if (!n) throw new Error('未找到笔记');
    n.content = req.body.content; n.noteDate = req.params.day; n.updatedAt = new Date().toISOString();
    if (d.review) d.review.stale = true;
  });
  res.json({ ok: true });
});
app.use('/api', (req, res) => res.status(404).json({ error: '不存在此操作。提问、整理与录入请在本项目聊天窗口进行。' }));
app.use((error, req, res, next) => res.status(400).json({ error: error.message }));
const port = Number(process.env.PORT || 3210);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => console.log(`问芽已启动：http://${host}:${port}\n数据目录：${dataRoot}`));
