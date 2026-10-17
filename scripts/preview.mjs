import {fileURLToPath} from 'node:url';
import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';
const root=path.resolve(process.argv[2]||fileURLToPath(new URL('../dist',import.meta.url))),port=Number(process.env.PORT||5260),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
http.createServer(async(req,res)=>{try{let url=new URL(req.url,'http://localhost');if(url.pathname==='/'){res.writeHead(302,{Location:'/zen-garden/'});return res.end()}if(!url.pathname.startsWith('/zen-garden/')){res.writeHead(404);return res.end('Not found')}let rel=decodeURIComponent(url.pathname.slice('/zen-garden/'.length))||'index.html',file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}let data=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}}).listen(port,'0.0.0.0',()=>console.log(`Zen Garden preview: http://127.0.0.1:${port}/zen-garden/`));


