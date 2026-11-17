// .github/indexnow.mjs — avisa a los buscadores que usan IndexNow (Bing, Yandex, Seznam, Naver, Yep)
// de las páginas publicadas o cambiadas en un deploy. Solo envía URLs que están en sitemap.xml.
//
// Uso:
//   node .github/indexnow.mjs changed <sha-antes> <sha-después>   páginas tocadas en el push
//   node .github/indexnow.mjs all                                 todo el sitemap
//   añadir --dry-run para imprimir sin enviar
//
// La clave es pública por diseño: vive en /<clave>.txt en la raíz del sitio.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const HOST = 'quelion.ai';
const ORIGIN = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [mode, before, after] = args.filter((a) => a !== '--dry-run');

const keyFile = readdirSync('.').find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('no hay archivo de clave <32 hex>.txt en la raíz');
const key = readFileSync(keyFile, 'utf8').trim();
if (`${key}.txt` !== keyFile) throw new Error('el contenido del archivo de clave no coincide con su nombre');

// Normalizada (sin barra final) → tal como está en el sitemap, que es la que se envía.
const sitemap = new Map(
    [...readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => [normalize(m[1]), m[1]])
);

function normalize(url) {
    return url.length > ORIGIN.length + 1 && url.endsWith('/') ? url.slice(0, -1) : url;
}

// Archivo del repo → URL pública, como la sirve nginx (try_files $uri $uri/ $uri.html).
export function fileToUrl(file) {
    if (!file.endsWith('.html')) return null;
    const path = file.replace(/\.html$/, '').replace(/(^|\/)index$/, '$1');
    return normalize(`${ORIGIN}/${path}`);
}

function exists(sha) {
    try { execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { stdio: 'ignore' }); return true; } catch { return false; }
}

function changedFiles(from, to) {
    // Primer push o historia reescrita (force-push): sin un «antes» válido no se adivina y no se envía nada.
    if (!from || /^0+$/.test(from) || !exists(from)) {
        console.log(`IndexNow: no hay un commit anterior válido (${from || 'vacío'}); no se envía nada.`);
        return [];
    }
    // --no-renames: un archivo renombrado cuenta como nuevo, y su URL nueva se envía.
    const out = execFileSync('git', ['diff', '--name-only', '--no-renames', '--diff-filter=AM', from, to], { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
}

// En GitHub Actions, una línea ::warning:: aparece en el resumen del run aunque el paso no lo tumbe.
function warn(msg) {
    console.log(process.env.GITHUB_ACTIONS ? `::warning title=IndexNow::${msg}` : `IndexNow: ${msg}`);
}

let urls;
if (mode === 'all') {
    urls = [...sitemap.values()];
} else if (mode === 'changed') {
    urls = [...new Set(changedFiles(before, after).map(fileToUrl).filter((u) => u && sitemap.has(u)).map((u) => sitemap.get(u)))];
} else {
    throw new Error('modo desconocido: usa «changed <antes> <después>» o «all»');
}

if (urls.length === 0) {
    console.log('IndexNow: ninguna página pública cambió; no se envía nada.');
    process.exit(0);
}

const body = { host: HOST, key, keyLocation: `${ORIGIN}/${keyFile}`, urlList: urls };
console.log(`IndexNow: ${urls.length} URL(s)\n${urls.join('\n')}`);
if (dryRun) process.exit(0);

// La clave tiene que estar ya servida; si no, IndexNow responde 403 y no hay nada que hacer.
const served = await fetch(body.keyLocation).then((r) => (r.ok ? r.text() : null)).catch(() => null);
if (served?.trim() !== key) {
    warn(`${body.keyLocation} no devuelve la clave; no se envió nada.`);
    process.exit(1);
}

const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
});
console.log(`IndexNow: respuesta ${res.status}`);
// 200 y 202 son aceptación; cualquier otra cosa se marca como fallo del paso (no del deploy).
if (res.status !== 200 && res.status !== 202) {
    warn(`api.indexnow.org respondió ${res.status}; las URLs no se aceptaron.`);
    process.exit(1);
}
