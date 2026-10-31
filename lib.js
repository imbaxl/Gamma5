import fs from 'node:fs/promises';
import path from 'node:path';

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayPath(root, day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('日期格式不正确');
  return path.join(root, 'days', `${day}.json`);
}
export async function readDay(root, day) {
  try { return JSON.parse(await fs.readFile(dayPath(root, day), 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; return { date: day, questions: [], notes: [], review: null }; }
}
export async function writeDay(root, day, value) {
  const file = dayPath(root, day);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(`${file}.tmp`, JSON.stringify(value, null, 2));
  await fs.rename(`${file}.tmp`, file);
}
