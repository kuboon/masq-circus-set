/**
 * Builds the page people look at, from the roster the room reads.
 *
 * The two used to be written out separately, which meant a character could be
 * renamed in one and not the other and nothing would say so. Here the page is
 * generated from `set.json`, so the only way for them to disagree is for this
 * file to be wrong about both at once.
 *
 * `BASE_URL` is where the built site will actually live. On main that is the
 * Pages root; on a pull request it is a subpath of it, and the preview has to
 * link to *its own* set.json rather than the published one — otherwise the
 * preview shows the new roster and then hands masq the old one, which is the
 * one thing a preview must not do.
 */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'

const dist = 'dist'
const base = (process.env.BASE_URL ?? '').replace(/\/$/, '')

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

const set = JSON.parse(await readFile('set.json', 'utf8'))
const setUrl = encodeURIComponent(`${base}/set.json`)
const esc = (s) =>
	String(s).replace(
		/[&<>"]/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
	)

const cards = set.characters
	.map(
		(c) => `			<li>
				<img src="${esc(c.image)}" alt="" width="138" height="138" />
				<p><strong>${esc(c.emoji)} ${esc(c.name)}</strong><br />${esc(c.tagline)}</p>
			</li>`
	)
	.join('\n')

await writeFile(
	`${dist}/index.html`,
	`<!doctype html>
<html lang="ja">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${esc(set.name)} — マスカレードのキャラクターセット</title>
		<meta name="description" content="${esc(set.tagline)}" />
		<style>
			:root {
				color-scheme: light dark;
			}
			body {
				font-family: system-ui, sans-serif;
				margin: 0 auto;
				max-width: 46rem;
				padding: 2rem 1rem;
				line-height: 1.7;
			}
			ul {
				display: grid;
				gap: 1rem;
				grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
				list-style: none;
				padding: 0;
			}
			img {
				width: 100%;
				height: auto;
				border-radius: 0.5rem;
			}
			p {
				margin: 0.4rem 0 0;
				font-size: 0.85rem;
			}
			a.go {
				display: inline-block;
				background: #ea580c;
				color: #fff;
				text-decoration: none;
				padding: 0.7em 1.4em;
				border-radius: 0.4rem;
				font-weight: 700;
			}
		</style>
	</head>
	<body>
		<h1>${esc(set.name)}</h1>
		<p>${esc(set.tagline)}</p>

		<p>
			<a class="go" href="https://masq.kbn.one/new?set=${setUrl}">
				この一座でマスカレードする
			</a>
		</p>

		<p>
			${set.characters.length}人ちょうどの一座です。マスカレードのルームは一座の人数ぶんだけ席が
			あるので、このセットで開いた会議には${set.characters.length}人まで入れます。
		</p>

		<ul>
${cards}
		</ul>

		<p>
			絵は
			<a href="https://github.com/kuboon/masq-circus-set">kuboon/masq-circus-set</a>
			に置いてあります（MIT）。声の作りかたは
			<a href="https://masq.kbn.one/character-set?url=${setUrl}">キャラセットを確かめる</a>
			で聴けます。
		</p>
	</body>
</html>
`
)

for (const path of ['set.json', 'banner.png', 'characters']) {
	await cp(path, `${dist}/${path}`, { recursive: true })
}
console.log(`built ${set.characters.length} characters for ${base || '(no BASE_URL)'}`)
