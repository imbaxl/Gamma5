import { prepareMath } from './math.js';
import { categories } from './categories.js';
const $ = selector => document.querySelector(selector);
const state = { view: 'home', today: '', day: '', data: null, recordQuestions: [], days: [], category: '高等代数', subcategory: 'all', question: null, memory: { cards: [], index: 0, revealed: false } };
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function markdown(value, inline = false) {
  const token = `MATH${Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')}`;
  const { text, formulas } = prepareMath(value || '', (formula, options) => katex.renderToString(formula, options), token);
  const doc = new DOMParser().parseFromString((inline ? marked.parseInline(text) : marked.parse(text)), 'text/html');
  const allowed = new Set(['P','BR','STRONG','EM','DEL','H1','H2','H3','H4','H5','H6','UL','OL','LI','BLOCKQUOTE','PRE','CODE','HR','TABLE','THEAD','TBODY','TR','TH','TD','A']);
  for (const el of [...doc.body.querySelectorAll('*')]) {
    if (!allowed.has(el.tagName)) { el.replaceWith(document.createTextNode(el.textContent)); continue; }
    const href = el.getAttribute('href');
    for (const attr of [...el.attributes]) el.removeAttribute(attr.name);
    if (el.tagName === 'A' && /^https?:\/\//i.test(href || '')) { el.setAttribute('href', href); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
  }
  return doc.body.innerHTML.replace(new RegExp(`${token}(\\d+)END`, 'g'), (_, n) => formulas[Number(n)]);
}
async function api(url, method = 'GET', data) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data) });
  const result = await res.json(); if (!res.ok) throw new Error(result.error || '操作失败'); return result;
}
let toastTimer;
function toast(text) { $('#toast').textContent = text; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 6500); }
async function task(button, work, label = '处理中…') {
  if (button.disabled) return;
  const old = button.textContent; button.disabled = true; button.textContent = label;
  try { await work(); } catch (e) { toast(e.message); } finally { button.disabled = false; button.textContent = old; }
}
const views = {
  home: ['学习总览', '好奇心，正在生长。', '从分类出发，看见每一次记录。'],
  records: ['题目分类', '把问题放进它生长的脉络。', '从题目和当时的提问出发，再进入完整推理。'],
  memory: ['记忆卡片', '先回忆，再翻开答案。', '把完整推理收起来，只留下一个值得重新回答的问题。'],
  review: ['每日回顾', '回望，是为了走得更深。', '看见已有的进展，也为下一次探索留下一个入口。']
};
async function showView(view) {
  state.view = view; state.data = null; document.body.dataset.view = view; $('.record-help').hidden = view === 'home';
  document.querySelectorAll('.view').forEach(el => el.hidden = el.id !== `view-${view}`);
  document.querySelectorAll('.nav').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  const [label, title, description] = views[view]; $('#view-label').textContent = view === 'records' ? `${label} · ${categoryLabel()}` : label; $('#page-title').textContent = title; $('#page-description').textContent = description;
  renderCategoryNav();
  if (view === 'memory') await loadMemory(); else await loadCurrent();
}
document.querySelectorAll('.nav').forEach(el => el.onclick = () => showView(el.dataset.view).catch(e => toast(e.message)));
function renderHome() {
  const total = state.days.reduce((sum, day) => sum + day.questions, 0);
  $('#home-total').textContent = `学习档案 · 已收录 ${total} 道题`;
  const subjectCount = category => state.days.reduce((sum, day) => sum + (day.categories?.[category] || 0), 0);
  const topicCount = (category, topic) => state.days.reduce((sum, day) => sum + (day.subcategories?.[category]?.[topic] || 0), 0);
  $('#home-subjects').innerHTML = Object.keys(categories).map((category, index) => `<button class="home-subject ${index ? 'algebra' : 'analysis'}" data-home-category="${escape(category)}"><span class="subject-symbol" aria-hidden="true">${index ? 'λ' : '∫'}</span><div class="subject-heading"><h2>${escape(category)}</h2><span>↗</span></div><div class="subject-number"><strong>${String(subjectCount(category)).padStart(2, '0')}</strong><span>道题</span></div><p>${index ? '结构、映射与空间' : '极限、微积分与级数'}</p></button>`).join('');
  const today = new Date(`${state.today}T00:00:00Z`);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today); date.setUTCDate(today.getUTCDate() - 6 + i);
    const key = date.toISOString().slice(0, 10);
    return { key, label: `${date.getUTCMonth() + 1}/${date.getUTCDate()}`, weekday: date.toLocaleDateString('zh-CN', { weekday: 'short', timeZone: 'UTC' }), count: state.days.find(day => day.date === key)?.questions || 0 };
  });
  const weekTotal = week.reduce((sum, day) => sum + day.count, 0); const maximum = Math.max(1, ...week.map(day => day.count));
  $('#week-total').textContent = String(weekTotal).padStart(2, '0');
  $('#week-period').textContent = `${week[0].label} — ${week[6].label}`;
  $('#week-chart').innerHTML = week.map(day => `<div class="week-column ${day.key === state.today ? 'today' : ''}" title="${day.key}：${day.count} 道题"><div class="week-bar-track"><span class="week-value">${day.count}</span><i class="week-bar ${day.count ? '' : 'zero'}" style="height:${day.count ? (day.count / maximum) * 140 : 5}px"></i></div><span class="week-day">${day.key === state.today ? '今天' : day.weekday}</span><span class="week-date">${day.label}</span></div>`).join('');
  $('#week-chart').setAttribute('role', 'img'); $('#week-chart').setAttribute('aria-label', `近七天共 ${weekTotal} 道题；${week.map(day => `${day.key} ${day.count} 道`).join('，')}`);
  $('#home-topics').innerHTML = Object.entries(categories).map(([category, topics]) => {
    const allTopics = [...topics, ...(topicCount(category, '未分类') ? ['未分类'] : [])];
    return `<section class="home-topic-group"><h3>${escape(category)}<span>${subjectCount(category)} 道题</span></h3><div class="home-topic-grid">${allTopics.map(topic => `<button class="home-topic" data-home-category="${escape(category)}" data-home-topic="${escape(topic)}"><strong>${String(topicCount(category, topic)).padStart(2, '0')}</strong><span>${escape(topic)}</span><i aria-hidden="true">↗</i></button>`).join('')}</div></section>`;
  }).join('');
}
function openHomeCategory(e) {
  const button = e.target.closest('[data-home-category]'); if (!button) return;
  $('#records-range').value = 'all'; $('#records-date').hidden = true; $('#records-month').hidden = true; $('#records-range').closest('.section-toolbar').classList.add('all-range'); $('#search').value = '';
  selectCategory(button.dataset.homeCategory, button.dataset.homeTopic || 'all');
}
$('#home-subjects').onclick = openHomeCategory; $('#home-topics').onclick = openHomeCategory;
function setSidebarHidden(hidden) {
  document.body.classList.toggle('sidebar-hidden', hidden); $('#sidebar').inert = hidden;
  $('#sidebar-toggle').setAttribute('aria-expanded', String(!hidden));
  $('#sidebar-toggle').ariaLabel = hidden ? '显示侧边栏' : '隐藏侧边栏'; $('#sidebar-toggle').title = $('#sidebar-toggle').ariaLabel;
  localStorage.setItem('sidebar-hidden', String(hidden));
}
$('#sidebar-toggle').onclick = () => setSidebarHidden(!document.body.classList.contains('sidebar-hidden'));
function categoryLabel() {
  return state.category + (state.subcategory === 'all' ? '' : ' · ' + state.subcategory);
}
function renderCategoryNav() {
  $('#category-nav').innerHTML = Object.entries(categories).map(([category, topics]) => {
    const count = state.days.reduce((sum, day) => sum + (day.categories?.[category] || 0), 0);
    const topicCount = topic => state.days.reduce((sum, day) => sum + (day.subcategories?.[category]?.[topic] || 0), 0);
    const children = [...topics, ...(topicCount('未分类') ? ['未分类'] : [])];
    return `<button class="subject-button ${category === state.category && state.view === 'records' ? 'active' : ''}" data-category="${escape(category)}" aria-expanded="${category === state.category && state.view === 'records'}">${escape(category)}<b>${count}</b></button>${category === state.category && state.view === 'records' ? `<div class="topic-nav"><button class="${state.subcategory === 'all' ? 'active' : ''}" data-category="${escape(category)}" data-subcategory="all">全部章节<b>${count}</b></button>${children.map(topic => `<button class="${state.subcategory === topic ? 'active' : ''}" data-category="${escape(category)}" data-subcategory="${escape(topic)}">${escape(topic)}<b>${topicCount(topic)}</b></button>`).join('')}</div>` : ''}`;
  }).join('');
}
function topicOptions(category, includeUnclassified = false) {
  const topics = categories[category] || [];
  return '<option value="all">全部章节</option>' + topics.map(topic => `<option value="${escape(topic)}">${escape(topic)}</option>`).join('') + (includeUnclassified ? '<option value="未分类">未分类</option>' : '');
}
function syncCategoryControls() {
  $('#category-select').value = state.category;
  const hasUnclassified = state.days.some(day => day.subcategories?.[state.category]?.['未分类']);
  const key = `${state.category}|${hasUnclassified}`;
  if ($('#subcategory-select').dataset.categoryKey !== key) {
    $('#subcategory-select').innerHTML = topicOptions(state.category, hasUnclassified);
    $('#subcategory-select').dataset.categoryKey = key;
  }
  $('#subcategory-select').value = state.subcategory;
  renderCategoryNav();
}
function selectCategory(category, subcategory = 'all') {
  state.category = category; state.subcategory = subcategory; syncCategoryControls();
  if (state.view !== 'records') showView('records').catch(e => toast(e.message));
  else { $('#view-label').textContent = `题目分类 · ${categoryLabel()}`; renderRecords(); }
}
$('#category-nav').onclick = e => {
  const button = e.target.closest('[data-category]');
  if (button) selectCategory(button.dataset.category, button.dataset.subcategory || 'all');
};
$('#category-select').onchange = e => selectCategory(e.target.value);
$('#subcategory-select').onchange = e => selectCategory(state.category, e.target.value);

async function loadDays() {
  const days = await api('/api/days'); $('#count').textContent = days.reduce((sum, d) => sum + d.questions, 0);
  state.days = days; syncCategoryControls(); if (state.view === 'home') renderHome();
  return days;
}
function recordRange() {
  const scope = $('#records-range').value;
  return { scope, value: scope === 'day' ? $('#records-date').value : scope === 'month' ? $('#records-month').value : '' };
}
async function loadRecords() {
  const { scope, value } = recordRange();
  state.recordQuestions = await api(`/api/questions?scope=${scope}&value=${encodeURIComponent(value)}&compact=1`);
  renderRecords();
}
async function loadCurrent(force = false) {
  const view = state.view;
  if (view === 'home') { renderHome(); return; }
  if (view === 'records') { await loadRecords(); return; }
  const day = $(`#${view}-date`).value; if (!day) return;
  const data = await api(`/api/days/${day}`);
  if (state.view !== view || $(`#${view}-date`).value !== day) return;
  if (!force && state.day === day && JSON.stringify(state.data) === JSON.stringify(data)) return;
  state.day = day; state.data = data;
  if (view === 'review') renderReview();
}
$('#review-date').onchange = () => loadCurrent(true).catch(e => toast(e.message));
$('#records-date').onchange = () => loadRecords().catch(e => toast(e.message));
$('#records-month').onchange = () => loadRecords().catch(e => toast(e.message));
$('#records-range').onchange = () => {
  const scope = $('#records-range').value; $('#records-range').closest('.section-toolbar').classList.toggle('all-range', scope === 'all'); $('#records-date').hidden = scope !== 'day'; $('#records-month').hidden = scope !== 'month';
  loadRecords().catch(e => toast(e.message));
};
$('#search').oninput = renderRecords;

function analysisHtml(a) {
  const list = (name, items) => Array.isArray(items) && items.length ? `<h3>${name}</h3><div class="markdown">${markdown(items.map(s => `- ${s}`).join('\n'))}</div>` : '';
  return `<section id="reader-problem"><h3>题目</h3><div class="markdown">${markdown(a.problem)}</div></section><h3>学习摘要</h3><div class="markdown">${markdown(a.summary)}</div><h3>你怎样提问</h3><div class="markdown">${markdown(a.userApproach)}</div>${list('条件与假设', a.conditions)}<section id="reader-reasoning">${list('推理轨迹', a.reasoning) || '<h3>推理轨迹</h3><p class="subtle">这道题还没有整理推理。</p>'}</section>${list('收获与连接', a.insights)}${list('再多问一步', a.openQuestions)}`;
}
function messagesHtml(q) {
  return `<details><summary>查看对话摘录与截图</summary>${q.messages.map(m => `<div class="message ${m.role}"><div class="message-label">${m.role === 'user' ? '你' : '问芽'}</div>${m.image && /^data:image\/(png|jpeg|webp);base64,/.test(m.image) ? `<img src="${escape(m.image)}" alt="原始题目截图" loading="lazy">` : ''}<div class="markdown">${markdown(m.content)}</div></div>`).join('')}</details>`;
}
function markScrollableMath(container) {
  for (const formula of container.querySelectorAll('.katex-display')) {
    if (formula.scrollWidth <= formula.clientWidth + 1) continue;
    formula.insertAdjacentHTML('beforebegin', '<p class="formula-scroll-hint">↔ 左右滑动查看完整公式</p>');
    formula.tabIndex = 0; formula.setAttribute('aria-label', '可左右滚动的公式');
  }
}
function fullRecordHtml(q) {
  const a = q.analysis;
  return `<div class="record-top"><span class="record-meta">${q.recordDate || state.day} · ${new Date(q.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 录入 · ${q.messages.filter(m => m.role === 'user').length} 次提问</span><div class="record-ratings"><span class="score">${a?.score ? `探索评分 ${a.score} / 5` : '评分 · 证据不足'}</span>${difficultyHtml(q)}</div></div>${a ? analysisHtml(a) + `<details class="rating-details"><summary>评分依据与鼓励</summary><h3>提问评分依据</h3><div class="markdown">${markdown(a.scoreReason)}</div><h3>主观难度依据</h3><p class="subtle">参考：211 高校数学专业考研 · 非官方评级</p><div class="markdown">${markdown(a.difficultyReason || '未评')}</div><div class="notice markdown">${markdown(a.encouragement)}</div></details>` : '<p id="reader-problem" class="subtle">可在本项目聊天窗口请求整理这条记录。</p><div id="reader-reasoning"></div>'}${messagesHtml(q)}`;
}

function difficultyHtml(q) {
  return `<span class="score">主观难度 ${q.analysis?.difficulty ? `${escape(q.analysis.difficulty)} / 5` : '· 未评'}</span>`;
}
function questionPrompt(q) { return q.analysis?.userApproach || q.messages.find(m => m.role === 'user')?.content || '暂时没有提问摘要。'; }
function visibleRecords() {
  const query = $('#search').value.toLowerCase();
  return state.recordQuestions.filter(q => (q.category || '高等代数') === state.category && (state.subcategory === 'all' || (q.subcategory || '未分类') === state.subcategory)).filter(q => JSON.stringify({ title: q.title, subcategory: q.subcategory, analysis: q.analysis, messages: q.messages.map(m => m.content) }).toLowerCase().includes(query));
}
function renderRecords() {
  const records = visibleRecords(); const query = $('#search').value;
  $('#records-summary').textContent = `${categoryLabel()} · ${records.length} 道题`;
  if (!records.length) { const rangeName = { day: '这一天', month: '这个月', all: '全部记录中' }[recordRange().scope]; $('#records-list').innerHTML = `<div class="empty wide">${query ? '这个分类中没有找到匹配的记录。' : `${escape(categoryLabel())}在${rangeName}还没有题目。<br>在本项目聊天窗口说「录入这道题」，由助手整理保存。`}</div>`; return; }
  $('#records-list').innerHTML = records.map(q => `<button class="question-card" data-question="${q.id}"><div><span class="category-tag">${escape(q.subcategory || '未分类')}</span><span class="record-meta">${q.recordDate}</span></div><h2>${markdown(q.title, true)}</h2>${difficultyHtml(q)}<div class="question-preview markdown">${markdown(questionPrompt(q))}</div><span class="card-enter">阅读题目与推理 →</span></button>`).join('');
}
async function openQuestion(id) {
  const item = state.recordQuestions.find(q => q.id === id); if (!item) return;
  const day = await api(`/api/days/${item.recordDate}`);
  const q = { ...day.questions.find(q => q.id === id), recordDate: item.recordDate };
  state.question = q; $('#question-category').textContent = `${q.category || '高等代数'} · ${q.subcategory || '未分类'}`; $('#question-title').innerHTML = markdown(q.title, true); $('#question-content').innerHTML = fullRecordHtml(q);
  $('#question-note-date').value = q.recordDate; $('#question-note-input').value = ''; $('#question-dialog').showModal(); $('#question-dialog').scrollTop = 0; document.body.classList.add('reading-question'); markScrollableMath($('#question-content'));
}
$('#records-list').onclick = e => { const trigger = e.target.closest('[data-question]'); if (trigger) openQuestion(trigger.dataset.question).catch(e => toast(e.message)); };
$('#question-close').onclick = () => $('#question-dialog').close();
$('#question-dialog').onclick = e => {
  if (e.target === $('#question-dialog')) $('#question-dialog').close();
  const target = e.target.closest('[data-reader-target]');
  if (target) document.getElementById(target.dataset.readerTarget)?.scrollIntoView({ block: 'start' });
};
$('#question-dialog').addEventListener('close', () => document.body.classList.remove('reading-question'));

$('#question-note-save').onclick = () => task($('#question-note-save'), async () => {
  const day = $('#question-note-date').value; const content = $('#question-note-input').value;
  await api(`/api/days/${day}/notes`, 'POST', { content, questionId: state.question.id, questionTitle: state.question.title, category: state.question.category || '高等代数', subcategory: state.question.subcategory, noteDate: day });
  $('#question-note-input').value = ''; await loadDays(); toast(`笔记已保存，并标注为 ${day}`);
});
$('#export').onclick = () => task($('#export'), async () => {
  const { scope, value } = recordRange(); const selected = visibleRecords();
  const days = new Map(await Promise.all([...new Set(selected.map(q => q.recordDate))].map(async date => [date, await api(`/api/days/${date}`)])));
  const records = selected.map(q => ({ ...days.get(q.recordDate).questions.find(item => item.id === q.id), recordDate: q.recordDate }));
  const url = URL.createObjectURL(new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `问芽-${categoryLabel()}-${scope === 'all' ? '全部题目' : value}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}, '导出中…');

function renderReview() {
  const d = state.data; const scores = d.questions.map(q => q.analysis?.score).filter(s => Number.isInteger(s));
  $('#review-stats').innerHTML = `<div class="stat"><span>留下的问题</span><strong>${d.questions.length}</strong></div><div class="stat"><span>自己的笔记</span><strong>${d.notes.length}</strong></div><div class="stat"><span>探索评分均值 · ${scores.length} 条有效记录</span><strong>${scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—'}<small style="font-size:12px"> / 5</small></strong></div>`;
  $('#review-content').innerHTML = d.review ? (d.review.stale ? '<div class="notice">这份回顾之后有新记录。可在项目聊天中请求更新回顾。</div>' : '') + markdown(d.review.content) : '<div class="empty">这一天还没有已保存的回顾。<br>在本项目聊天中说「回顾这一天的学习并保存」，由助手整理。</div>';
}

const knownCards = new Set(JSON.parse(localStorage.getItem('known-memory-cards') || '[]'));
function memoryAnswer(q) {
  const insights = q.analysis?.insights?.length ? `<h3>关键收获</h3>${markdown(q.analysis.insights.map(item => `- ${item}`).join('\n'))}` : '';
  const reasoning = q.analysis?.reasoning?.length ? `<h3>推理提示</h3>${markdown(q.analysis.reasoning.map(item => `- ${item}`).join('\n'))}` : '';
  return `<span class="memory-side-label">答案与线索</span><div class="markdown">${markdown(q.analysis?.summary || '这张卡片还没有整理答案。')}</div>${insights}${reasoning}`;
}
function syncMemoryTopics() {
  const category = $('#memory-category').value;
  $('#memory-subcategory').innerHTML = category === 'all'
    ? '<option value="all">全部章节</option>' + Object.entries(categories).map(([subject, topics]) => `<optgroup label="${escape(subject)}">${topics.map(topic => `<option value="${escape(topic)}">${escape(topic)}</option>`).join('')}</optgroup>`).join('') + '<option value="未分类">未分类</option>'
    : topicOptions(category, true);
}
async function loadMemory() {
  const scope = $('#memory-range').value; const value = scope === 'month' ? ($('#records-month').value || new Date().toISOString().slice(0, 7)) : '';
  const all = await api(`/api/questions?scope=${scope}&value=${value}&compact=1`); const category = $('#memory-category').value;
  const subcategory = $('#memory-subcategory').value;
  state.memory.cards = all.filter(q => (category === 'all' || (q.category || '高等代数') === category) && (subcategory === 'all' || (q.subcategory || '未分类') === subcategory)); state.memory.index = 0; state.memory.revealed = false; renderMemory();
}
function renderMemory() {
  const { cards, index, revealed } = state.memory; $('#memory-empty').hidden = cards.length > 0; $('#memory-deck').hidden = cards.length === 0;
  $('#memory-summary').textContent = cards.length ? `${cards.filter(q => knownCards.has(q.id)).length} / ${cards.length} 张已标记记住` : '';
  if (!cards.length) return;
  const q = cards[index]; $('#memory-progress-text').textContent = `${index + 1} / ${cards.length}`; $('#memory-progress-bar').style.width = `${((index + 1) / cards.length) * 100}%`;
  $('#memory-front').innerHTML = `<span class="memory-side-label">${escape((q.category || '高等代数') + (q.subcategory ? ' · ' + q.subcategory : ''))} · ${q.recordDate}</span><h2>${markdown(q.title, true)}</h2><div class="markdown memory-problem">${markdown(q.analysis?.problem || questionPrompt(q))}</div>`;
  $('#memory-back').innerHTML = memoryAnswer(q); $('#memory-front').hidden = revealed; $('#memory-back').hidden = !revealed; $('#memory-card').classList.toggle('revealed', revealed);
  $('#memory-flip').textContent = revealed ? '返回题面' : '查看答案'; $('#memory-flip-hint').textContent = revealed ? '点击卡片返回题面' : '点击卡片查看答案';
  $('#memory-known').textContent = knownCards.has(q.id) ? '✓ 已记住' : '标记已记住'; $('#memory-known').classList.toggle('known', knownCards.has(q.id)); $('#memory-prev').disabled = index === 0; $('#memory-next').disabled = index === cards.length - 1; markScrollableMath($('#memory-card'));
}
function flipMemory() { if (!state.memory.cards.length) return; state.memory.revealed = !state.memory.revealed; renderMemory(); }
function moveMemory(step) { state.memory.index = Math.max(0, Math.min(state.memory.cards.length - 1, state.memory.index + step)); state.memory.revealed = false; renderMemory(); }
$('#memory-category').onchange = () => { syncMemoryTopics(); loadMemory().catch(e => toast(e.message)); }; $('#memory-subcategory').onchange = () => loadMemory().catch(e => toast(e.message)); $('#memory-range').onchange = () => loadMemory().catch(e => toast(e.message)); $('#memory-flip').onclick = flipMemory; $('#memory-card').onclick = flipMemory; $('#memory-prev').onclick = () => moveMemory(-1); $('#memory-next').onclick = () => moveMemory(1);
$('#memory-known').onclick = () => { const q = state.memory.cards[state.memory.index]; if (!q) return; if (knownCards.has(q.id)) knownCards.delete(q.id); else knownCards.add(q.id); localStorage.setItem('known-memory-cards', JSON.stringify([...knownCards])); renderMemory(); };
$('#memory-shuffle').onclick = () => { state.memory.cards.sort(() => Math.random() - .5); state.memory.index = 0; state.memory.revealed = false; renderMemory(); };
$('#memory-card').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipMemory(); } };
window.addEventListener('keydown', e => { if (state.view !== 'memory') return; if (e.key === 'ArrowLeft') moveMemory(-1); if (e.key === 'ArrowRight') moveMemory(1); });

function setTheme(theme) { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme); $('#theme-toggle').textContent = theme === 'dark' ? '☀' : '◐'; $('#theme-toggle').ariaLabel = theme === 'dark' ? '切换浅色模式' : '切换暗黑模式'; }
$('#theme-toggle').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
$('#settings-open').onclick = () => $('#settings-dialog').showModal(); $('#header-settings').onclick = () => $('#settings-dialog').showModal(); $('#settings-close').onclick = () => $('#settings-dialog').close();
window.addEventListener('beforeunload', e => { if ($('#question-note-input').value) { e.preventDefault(); e.returnValue = ''; } });
let refreshing = false;
async function refresh() { if (refreshing || document.hidden) return; refreshing = true; try { await loadDays(); if (state.view !== 'memory') await loadCurrent(); } finally { refreshing = false; } }
async function init() {
  setTheme(localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const info = await api('/api/info'); state.day = info.today; state.today = info.today; $('#storage-path').textContent = info.dataPath;
  ['records', 'review'].forEach(view => $(`#${view}-date`).value = info.today); $('#records-month').value = info.today.slice(0, 7); $('#question-note-date').value = info.today;
  $('#today-label').textContent = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  syncCategoryControls(); syncMemoryTopics();
  setSidebarHidden(localStorage.getItem('sidebar-hidden') === 'true');
  const days = await loadDays(); if (days[0]) $('#records-date').value = days[0].date; await showView('home');
  setInterval(() => refresh().catch(() => {}), 5000); window.addEventListener('focus', () => refresh().catch(e => toast(e.message)));
}
init().catch(e => toast(e.message));
