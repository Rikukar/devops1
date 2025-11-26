let token = null;

async function login(){
  const username = document.getElementById('user').value.trim();
  const password = document.getElementById('pass').value;
  const r = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
  if(!r.ok){ document.getElementById('loginError').textContent = 'Login failed'; return; }
  token = (await r.json()).token;
  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  refreshAll();
  setInterval(refreshAll,5000);
}

function logout(){ token=null; location.reload(); }

async function switchVersion(){ await authedPost('/api/switch'); setTimeout(refreshAll,800); }
async function discardOld(){ await authedPost('/api/discard'); setTimeout(refreshAll,800); }
async function resetLog(){ await authedPost('/api/reset-log'); setTimeout(refreshAll,400); }

async function authedPost(url){
  if(!token) return; return fetch(url,{method:'POST',headers:{'Authorization':'Bearer '+token}});
}

function renderMetrics(data){
  const body = document.getElementById('metricsBody');
  body.innerHTML = '';
  const rows = [
    ['CPU Used %', data.cpu?.used],
    ['CPU Idle %', data.cpu?.idle],
    ['Log Size (bytes)', data.logSize],
    ['Active Version', data.active],
    ['Timestamp', data.timestamp],
    ['Service1_v1 status', shorten(data.service1_v1)],
    ['Service1_v2 status', shorten(data.service1_v2)]
  ];
  rows.forEach(([k,v])=>{
    const tr=document.createElement('tr');
    const td1=document.createElement('td'); td1.textContent=k; tr.appendChild(td1);
    const td2=document.createElement('td'); td2.textContent=(v===undefined||v===null)?'—':v; tr.appendChild(td2);
    body.appendChild(tr);
  });
  document.getElementById('metricsRaw').textContent = JSON.stringify(data,null,2);
  document.getElementById('activeBanner').textContent = 'Active: '+data.active;
  // Button states
  const discardBtn = document.getElementById('discardBtn');
  discardBtn.disabled = data.service1_v1==='ERR' || data.service1_v2==='ERR'; // simple heuristic
}

function shorten(txt){
  if(!txt) return '—';
  if(txt.length>90) return txt.slice(0,90)+'…';
  return txt;
}

async function refreshAll(){
  if(!token) return;
  try {
    const m = await fetch('/api/metrics',{headers:{'Authorization':'Bearer '+token}});
    if(m.ok){ const data = await m.json(); renderMetrics(data); }
  } catch(e){ console.error('metrics error',e); }
  try {
    const l = await fetch('/api/log',{headers:{'Authorization':'Bearer '+token}});
    if(l.ok){ const txt = await l.text(); const lines = txt.trim().split(/\n/); document.getElementById('log').textContent = lines.slice(-50).join('\n'); }
  } catch(e){ console.error('log error',e); }
}
