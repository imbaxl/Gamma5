import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { localDay, dayPath } from '../lib.js';

test('project chat writes local files; website only reads records and edits notes', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'question-garden-test-'));
  const probe = http.createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r));
  const port = probe.address().port; await new Promise(r => probe.close(r));
  const env = { ...process.env, PORT: String(port), DATA_DIR: dir };
  const child = spawn(process.execPath, ['server.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => {
    const done = new Promise(r => child.once('exit', r)); child.kill(); await done;
    await fs.rm(dir, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => { child.stdout.once('data', resolve); child.once('error', reject); child.once('exit', code => reject(new Error(`server exit ${code}`))); });
  const request = async (url, method = 'GET', body) => {
    const res = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    return { status: res.status, data: await res.json() };
  };
  const day = localDay();
  assert.equal((await request('/api/info')).data.today, day);
  assert.deepEqual((await request('/api/days')).data, []);
  for (const [url, method] of [['/api/chat', 'POST'], ['/api/settings', 'GET'], ['/api/settings', 'PUT'], ['/api/questions', 'POST'], [`/api/days/${day}/review`, 'POST'], [`/api/days/${day}/questions/any/analyze`, 'POST']]) {
    assert.equal((await request(url, method, method === 'GET' ? undefined : {})).status, 404);
  }
  const note = (await request(`/api/days/${day}/notes`, 'POST', { content: '$$x^2$$' })).data;
  const input = path.join(dir, 'input.json');
  const payload = { title: '条件分析测试', category: '数学分析', subcategory: '极限与连续函数', analysis: { problem: '$x > 0$', summary: '测试记录', score: 4, scoreReason: '测试依据' }, messages: [{ role: 'user', content: '测试摘录：改变条件', image: 'data:image/png;base64,test' }] };
  await fs.writeFile(input, JSON.stringify(payload));
  const denied = spawnSync(process.execPath, ['scripts/record.js', 'question', input], { env, encoding: 'utf8' });
  assert.notEqual(denied.status, 0);
  assert.equal((await request(`/api/days/${day}`)).data.questions.length, 0);
  function record(kind) {
    const result = spawnSync(process.execPath, ['scripts/record.js', kind, input, '--confirmed'], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  for (const invalid of [{ ...payload, subcategory: undefined }, { ...payload, subcategory: '矩阵' }]) {
    await fs.writeFile(input, JSON.stringify(invalid));
    const rejected = spawnSync(process.execPath, ['scripts/record.js', 'question', input, '--confirmed'], { env, encoding: 'utf8' });
    assert.notEqual(rejected.status, 0);
    assert.equal((await request(`/api/days/${day}`)).data.questions.length, 0);
  }
  await fs.writeFile(input, JSON.stringify(payload));
  record('question');
  const loaded = (await request(`/api/days/${day}`)).data;
  assert.equal(loaded.questions.length, 1);
  assert.equal(loaded.questions[0].source, 'project-chat');
  assert.equal(loaded.questions[0].category, '数学分析');
  assert.equal(loaded.questions[0].subcategory, '极限与连续函数');
  const counts = (await request('/api/days')).data[0];
  assert.equal(counts.categories['数学分析'], 1);
  assert.equal(counts.subcategories['数学分析']['极限与连续函数'], 1);
  assert.equal(counts.subcategories['高等代数']['矩阵'], 0);
  assert.equal(loaded.questions[0].analysis.score, 4);
  assert.equal(loaded.notes[0].id, note.id);
  assert.equal(loaded.notes[0].noteDate, day);
  const questionsByDay = (await request(`/api/questions?scope=day&value=${day}`)).data;
  assert.equal(questionsByDay.length, 1);
  assert.equal(questionsByDay[0].recordDate, day);
  assert.equal(questionsByDay[0].messages[0].image, payload.messages[0].image);
  const compact = (await request(`/api/questions?scope=day&value=${day}&compact=1`)).data;
  assert.equal(compact[0].subcategory, '极限与连续函数');
  assert.equal(Object.hasOwn(compact[0].messages[0], 'image'), false);
  assert.equal((await request(`/api/questions?scope=month&value=${day.slice(0, 7)}`)).data.length, 1);
  assert.equal((await request('/api/questions?scope=all')).data.length, 1);
  const linked = (await request(`/api/days/${day}/notes`, 'POST', { content: '关联题目的补充', questionId: loaded.questions[0].id, questionTitle: payload.title, category: payload.category, subcategory: payload.subcategory })).data;
  assert.equal(linked.subcategory, '极限与连续函数');
  await fs.writeFile(input, JSON.stringify({ content: '## 回顾\n本项目聊天中整理的回顾。' }));
  record('review');
  await request(`/api/days/${day}/notes/${note.id}`, 'PUT', { content: '修改后的笔记' });
  const updated = (await request(`/api/days/${day}`)).data;
  assert.match(updated.review.content, /本项目聊天/);
  assert.equal(updated.review.stale, true);
  assert.equal(updated.notes[0].content, '修改后的笔记');
  assert.equal(updated.questions.length, 1);
  await fs.writeFile(input, JSON.stringify({ ...payload, title: '第二条记录' }));
  record('question');
  const persisted = JSON.parse(await fs.readFile(dayPath(dir, day), 'utf8'));
  assert.equal(persisted.questions.length, 2);
  assert.equal(persisted.notes.length, 2);
  assert.match(persisted.review.content, /本项目聊天/);
  const html = await (await fetch(`http://127.0.0.1:${port}`)).text();
  assert.doesNotMatch(html, /id="chat-input"|id="api-key"|id="generate-review"/);
  assert.match(html, /本项目聊天窗口/);
});
