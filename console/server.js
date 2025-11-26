import express from 'express';
import fetch from 'node-fetch';
import os from 'os';
import fs from 'fs';

const PORT = 8198;
const USER = process.env.CONSOLE_USER || 'admin';
const PASS = process.env.CONSOLE_PASS || 'password';
const STORAGE_URL = process.env.STORAGE_URL || 'http://storage:8200';
const SERVICE1_V1_URL = process.env.SERVICE1_V1_URL || 'http://service1_v1:8199/status';
const SERVICE1_V2_URL = process.env.SERVICE1_V2_URL || 'http://service1_v2:8199/status';
const VSTORAGE_PATH = '/vstorage';

const app = express();
app.use(express.json());

let sessions = new Set();
let lastCpu = os.cpus();
let lastTime = Date.now();

function cpuUsage(){
  const cpus = os.cpus();
  let user=0,nice=0,sys=0,idle=0,irq=0; 
  for(let i=0;i<cpus.length;i++){ const t=cpus[i].times; user+=t.user; nice+=t.nice; sys+=t.sys; idle+=t.idle; irq+=t.irq; }
  const total = user+nice+sys+idle+irq;
  const idlePerc = idle/total*100; const usedPerc = 100-idlePerc;
  return {used:parseFloat(usedPerc.toFixed(2)), idle:parseFloat(idlePerc.toFixed(2))};
}

function auth(req,res,next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).end();
  const token = header.replace('Bearer ','');
  if(!sessions.has(token)) return res.status(403).end();
  next();
}

app.post('/api/login',(req,res)=>{
  const {username,password} = req.body || {};
  if(username===USER && password===PASS){
    const token = Math.random().toString(36).slice(2);
    sessions.add(token);
    return res.json({token});
  }
  res.status(401).json({error:'invalid'});
});

app.post('/api/reset-log',auth, async (req,res)=>{
  try {
    await fetch(STORAGE_URL+'/log/reset',{method:'POST'});
    if(fs.existsSync(VSTORAGE_PATH)) fs.writeFileSync(VSTORAGE_PATH,'');
    res.status(204).end();
  } catch(e){ res.status(500).json({error:'reset failed'}); }
});

// stub endpoints for future blue-green logic
import { exec } from 'child_process';

function activeIsV1(){
  try { return fs.readFileSync('/shared/active.conf','utf8').includes('service1_v1'); } catch { return true; }
}

function writeActive(v){
  fs.writeFileSync('/shared/active.conf',`upstream app_active { server service1_${v}:8199; }\n`);
}

function restartGateway(cb){
  exec('docker restart gateway', (e)=> cb(e));
}

app.post('/api/switch',auth,(req,res)=>{
  const target = activeIsV1() ? 'v2' : 'v1';
  try { writeActive(target); } catch(e){ return res.status(500).json({error:'write failed'}); }
  restartGateway(err=>{
    if(err) return res.status(500).json({error:'restart failed'});
    res.json({active: target});
  });
});

app.post('/api/discard',auth,(req,res)=>{
  const inactive = activeIsV1() ? ['service1_v2','service2_v2'] : ['service1_v1','service2_v1'];
  exec(`docker rm -f ${inactive.join(' ')}`, (err)=>{
    if(err) return res.status(500).json({error:'discard failed'});
    res.json({discarded: inactive});
  });
});

app.get('/api/log',auth, async (req,res)=>{
  try {
    const r = await fetch(STORAGE_URL+'/log');
    const txt = await r.text();
    res.type('text/plain').send(txt);
  } catch(e){ res.status(500).send('error fetching log'); }
});

async function fetchStatus(url){
  try { const r = await fetch(url,{timeout:2000}); return (await r.text()).trim(); } catch { return 'ERR'; }
}

app.get('/api/metrics',auth, async (req,res)=>{
  const cpu = cpuUsage();
  const logSize = fs.existsSync(VSTORAGE_PATH)? fs.statSync(VSTORAGE_PATH).size : 0;
  const [s1v1,s1v2] = await Promise.all([fetchStatus(SERVICE1_V1_URL), fetchStatus(SERVICE1_V2_URL)]);
  res.json({cpu, logSize, service1_v1:s1v1, service1_v2:s1v2, active: activeIsV1()? 'v1':'v2', timestamp:new Date().toISOString()});
});

app.use(express.static('public'));

app.listen(PORT,()=> console.log('console listening on',PORT));
