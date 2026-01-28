import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { watch } from 'chokidar';

const xhtmlHeader = {
	'Content-Type': 'application/xhtml+xml'
};
const sseHeader = {
	'Content-Type': 'text/event-stream',
	'Cache-Control': 'no-cache',
	'Connection': 'keep-alive',
	'X-Accel-Buffering': 'no'
};
const prefix = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head>
	<meta charset="utf-8"/>
	<title>Article Draft</title>
	<meta name="author" content="https://orcid.org/0009-0001-0977-2029"/>
	<meta name="color-scheme" content="dark light"/>
	<meta name="format-detection" content="telephone=no"/>
	<meta name="viewport" content="width=device-width"/>
	<link rel="icon" href="https://home.6t.lt/icons/48.svg"/>
	<link rel="stylesheet" href="https://home.6t.lt/style.css"/>
	<script>
		const sse = new EventSource('/sse');
		sse.onmessage = e => (e.data === 'reload' &amp;&amp; window.location.reload());
	</script>
</head><body>`;
const infixPath = `../../articles/${process.argv[2]}.xml`;
const suffix = '</body></html>';
const connected = new Set();
let updates = 0;

createServer(function (req, res) {
	if (req.url === '/sse') {
		res.writeHead(200, sseHeader);
		connected.add(res);
		req.on('close', () => connected.delete(res));
		return;
	}
	readFile(infixPath, 'utf-8').then(function (contents) {
		res.writeHead(200, xhtmlHeader);
		res.end(prefix + contents + suffix);
	});
}).listen(1687, () => console.log("Listening at http://localhost:1687/"));

watch(infixPath).on('change', function (path) {
	connected.forEach(res => res.write('data: reload\n\n'));
	console.log(`Reload event ${++updates} sent (${path} was updated)`);
});
