
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/probe.cjs');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const errors=[];
await fs.mkdir('tmp/home-preview',{recursive:true});
try {
 const desktop=await browser.newPage({viewport:{width:1440,height:1000}});
 desktop.on('pageerror',e=>errors.push(e.message));
 await desktop.goto('http://127.0.0.1:3210');
 await desktop.waitForFunction(()=>document.querySelector('#home-total').textContent.includes('14 道题'));
 assert.equal(await desktop.locator('body').getAttribute('data-view'),'home');
 assert.equal(await desktop.locator('.nav[data-view="notes"],#view-notes').count(),0);
 assert.deepEqual(await desktop.locator('.subject-number strong').allTextContents(),['07','07']);
 assert.equal(await desktop.locator('#week-total').innerText(),'01');
 assert.equal(await desktop.locator('.week-column').count(),7);
 assert.ok(Number.parseFloat(await desktop.locator('.subject-number strong').first().evaluate(el=>getComputedStyle(el).fontSize))>=90);
 await desktop.screenshot({path:'tmp/home-preview/desktop-home.png',fullPage:true});
 await desktop.locator('#sidebar-toggle').click();
 await desktop.waitForFunction(()=>document.body.classList.contains('sidebar-hidden'));
 assert.equal(await desktop.locator('#sidebar-toggle').getAttribute('aria-expanded'),'false');
 await desktop.reload();
 await desktop.waitForFunction(()=>document.body.classList.contains('sidebar-hidden'));
 assert.ok(await desktop.locator('#sidebar').evaluate(el=>el.inert));
 await desktop.waitForFunction(()=>Number.parseFloat(getComputedStyle(document.querySelector('main')).marginLeft)===0);
 assert.equal(await desktop.locator('main').evaluate(el=>Number.parseFloat(getComputedStyle(el).marginLeft)),0);
 await desktop.locator('#sidebar-toggle').click();
 await desktop.locator('#theme-toggle').click();
 await desktop.screenshot({path:'tmp/home-preview/desktop-home-dark.png',fullPage:true});
 const phone=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto('http://127.0.0.1:3210');
 await phone.waitForFunction(()=>document.querySelector('#week-total').textContent==='01');
 for(const width of [320,375,430]) {
  await phone.setViewportSize({width,height:812});
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'首页横向溢出：'+width);
 }
 await phone.setViewportSize({width:375,height:812});
 await phone.screenshot({path:'tmp/home-preview/mobile-home.png',fullPage:true});
 await phone.locator('#sidebar-toggle').click();
 assert.equal(await phone.locator('#sidebar').isVisible(),false);
 assert.equal(await phone.locator('#sidebar-toggle').getAttribute('aria-label'),'显示侧边栏');
 await phone.screenshot({path:'tmp/home-preview/mobile-home-sidebar-hidden.png'});
 await phone.locator('#sidebar-toggle').click();
 assert.ok(await phone.locator('#sidebar').isVisible());
 await phone.locator('[data-home-topic="Euclidean 空间"]').click();
 await phone.waitForFunction(()=>document.body.dataset.view==='records' && document.querySelectorAll('.question-card').length===1);
 assert.equal(await phone.locator('#records-range').inputValue(),'all');
 assert.equal(await phone.locator('#subcategory-select').inputValue(),'Euclidean 空间');
 await phone.locator('.question-card').click();
 await phone.locator('#question-dialog').waitFor({state:'visible'});
 assert.match(await phone.locator('#question-title').innerText(),/标准正交基与正交投影/);
 assert.equal(await phone.locator('#question-content .katex-error').count(),0);
 assert.ok(await phone.locator('#question-note-input').count());
 assert.ok(await phone.locator('#question-content img').getAttribute('src').then(src=>src.startsWith('data:image/png;base64,')));
 await phone.screenshot({path:'tmp/home-preview/new-question.png'});
 await phone.locator('#question-close').click();
 await phone.locator('.nav[data-view="memory"]').click();
 await phone.waitForFunction(()=>document.querySelector('#memory-progress-text').textContent==='1 / 1');
 await phone.locator('#memory-flip').click();
 assert.ok(await phone.locator('#memory-back').isVisible());

 const mock=await browser.newPage();
 mock.on('pageerror',e=>errors.push(e.message));
 let fixture=[
  {date:'2025-12-26',questions:99},
  {date:'2025-12-27',questions:2},
  {date:'2025-12-29',questions:3},
  {date:'2026-01-02',questions:1},
  {date:'2026-01-03',questions:88}
 ];
 await mock.route('**/api/info',route=>route.fulfill({json:{today:'2026-01-02',dataPath:'UI validation fixture'}}));
 await mock.route('**/api/days',route=>route.fulfill({json:fixture.map(day=>({...day,notes:0,categories:{'数学分析':day.questions,'高等代数':0},subcategories:{'数学分析':{'极限与连续函数':day.questions},'高等代数':{}}}))}));
 await mock.goto('http://127.0.0.1:3210');
 await mock.waitForFunction(()=>document.querySelector('#week-total').textContent==='06');
 assert.deepEqual(await mock.locator('.week-value').allTextContents(),['2','0','3','0','0','0','1']);
 assert.equal(await mock.locator('#week-period').innerText(),'12/27 — 1/2');
 fixture=[];
 await mock.reload();
 await mock.waitForFunction(()=>document.querySelectorAll('.week-column').length===7);
 assert.equal(await mock.locator('#week-total').innerText(),'00');
 assert.deepEqual(await mock.locator('.subject-number strong').allTextContents(),['00','00']);
 assert.deepEqual(errors,[]);
 console.log('验证通过：默认首页、14 道题的分类统计、近七天含今天的题量、跨年和空数据、章节跳转、新题截图与公式、记忆卡片、侧边栏隐藏及持久化、320/375/430px 手机布局；无页面脚本错误。');
} finally {await browser.close();}

