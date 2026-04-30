// ── View Toggle ────────────────────────────────────────────────────
let currentView = 'tracker';

function switchView(view) {
  currentView = view;
  const header = document.querySelector('header');
  const controls = document.querySelector('.controls');
  const grid = document.getElementById('subs-grid');
  const empty = document.getElementById('empty-state');
  const stats = document.querySelector('.stats');
  const badgeSection = document.getElementById('badge-section');
  const insightsRow = document.getElementById('insights-row');
  const dueStrip = document.getElementById('due-strip');
  const budgetSection = document.querySelector('.budget-section');
  const aboutSection = document.getElementById('about-section');
  const footer = document.querySelector('footer');
  const navButtons = document.querySelectorAll('.nav-btn');
  
  if (view === 'tracker') {
    if (header) header.style.display = 'block';
    if (stats) stats.style.display = 'grid';
    if (controls) controls.style.display = 'flex';
    if (grid) grid.style.display = 'grid';
    if (badgeSection) badgeSection.style.display = badgeSection.style.display === 'none' ? 'none' : 'flex';
    if (insightsRow) insightsRow.style.display = insightsRow.style.display === 'none' ? 'none' : 'grid';
    if (dueStrip) dueStrip.style.display = dueStrip.style.display === 'none' ? 'none' : 'flex';
    if (budgetSection) budgetSection.style.display = 'flex';
    if (aboutSection) aboutSection.classList.remove('active');
    if (footer) footer.style.display = 'block';
    navButtons[0].classList.add('active');
    navButtons[1].classList.remove('active');
  } else {
    if (header) header.style.display = 'none';
    if (stats) stats.style.display = 'none';
    if (controls) controls.style.display = 'none';
    if (grid) grid.style.display = 'none';
    if (empty) empty.style.display = 'none';
    if (badgeSection) badgeSection.style.display = 'none';
    if (insightsRow) insightsRow.style.display = 'none';
    if (dueStrip) dueStrip.style.display = 'none';
    if (budgetSection) budgetSection.style.display = 'none';
    if (aboutSection) aboutSection.classList.add('active');
    if (footer) footer.style.display = 'none';
    navButtons[0].classList.remove('active');
    navButtons[1].classList.add('active');
  }
}

// ── Data ─────────────────────────────────────────────────────────
const DEFAULT_SUBS = [
  {id:1,name:'Netflix',       price:649, cycle:'monthly',category:'streaming',  icon:'🎬',date:daysFromNow(3), isTrial:false,trialEnd:''},
  {id:2,name:'Spotify',       price:119, cycle:'monthly',category:'music',      icon:'🎵',date:daysFromNow(12),isTrial:false,trialEnd:''},
  {id:3,name:'ChatGPT Plus',  price:1700,cycle:'monthly',category:'productivity',icon:'🤖',date:daysFromNow(1),isTrial:false,trialEnd:''},
  {id:4,name:'iCloud+',       price:75,  cycle:'monthly',category:'software',   icon:'☁️',date:daysFromNow(20),isTrial:false,trialEnd:''},
  {id:5,name:'GitHub Copilot',price:833, cycle:'monthly',category:'software',   icon:'💻',date:daysFromNow(7), isTrial:true, trialEnd:daysFromNow(5)},
];

function daysFromNow(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; }

let subs          = JSON.parse(localStorage.getItem('subtracker_subs')||'null') || DEFAULT_SUBS;
let editingId     = null;
let isTrial       = false;
let currentFilter = 'all';
let budget        = parseFloat(localStorage.getItem('subtracker_budget')||'0');
let isDark        = localStorage.getItem('subtracker_theme') !== 'light';

function save()         { localStorage.setItem('subtracker_subs', JSON.stringify(subs)); }
function saveBudget(v)  { budget=parseFloat(v)||0; localStorage.setItem('subtracker_budget',budget); updateBudgetBar(); }

// ── Theme ──────────────────────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark?'dark':'light');
  document.getElementById('theme-btn').textContent = isDark?'🌙':'☀️';
}
function toggleTheme() {
  isDark=!isDark;
  localStorage.setItem('subtracker_theme',isDark?'dark':'light');
  applyTheme();
}

// ── Helpers ────────────────────────────────────────────────────────
function toMonthly(p,c){ return c==='yearly'?p/12:c==='weekly'?p*4.33:p; }
function daysUntil(ds) {
  if(!ds) return 999;
  const t=new Date(); t.setHours(0,0,0,0);
  const d=new Date(ds); d.setHours(0,0,0,0);
  return Math.round((d-t)/86400000);
}
function fmt(n){ return '₹'+Math.round(n).toLocaleString('en-IN'); }
function billingClass(ds){ const d=daysUntil(ds); return d<=0?'today':d<=3?'soon':''; }
function billingLabel(ds){
  const d=daysUntil(ds);
  if(d<0)  return 'Overdue';
  if(d===0)return 'Due today!';
  if(d===1)return 'Due tomorrow';
  if(d<=7) return `Due in ${d} days`;
  return new Date(ds).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}

// ── Personality Badge ──────────────────────────────────────────────
const BADGES=[
  {test:s=>s.filter(x=>x.category==='streaming').length>=3,  emoji:'🎬',name:'Binge Watcher',   desc:'You love your screens a little too much!'},
  {test:s=>s.filter(x=>x.category==='music').length>=2,      emoji:'🎵',name:'Music Lover',      desc:'Life has a better soundtrack with you.'},
  {test:s=>s.filter(x=>x.category==='software').length>=3,   emoji:'💻',name:'Tech Hoarder',     desc:'More tools than tasks? Classic developer.'},
  {test:s=>s.filter(x=>x.category==='productivity').length>=2,emoji:'🤖',name:'Productivity Junkie',desc:'You optimize everything — including your apps.'},
  {test:s=>s.reduce((a,x)=>a+toMonthly(x.price,x.cycle),0)>5000, emoji:'💸',name:'Big Spender', desc:'Your subscriptions have their own budget!'},
  {test:s=>s.reduce((a,x)=>a+toMonthly(x.price,x.cycle),0)<500&&s.length>0,emoji:'🌿',name:'Balanced Spender',desc:'You keep it minimal and smart. Respect!'},
  {test:s=>s.some(x=>x.isTrial), emoji:'🎁',name:'Trial Hunter',desc:'Always finding the free trials first!'},
  {test:s=>s.length>=5, emoji:'📦',name:'Subscription Collector',desc:'You\'ve got quite the collection going.'},
];
function updateBadge(){
  const b=BADGES.find(b=>b.test(subs));
  const sec=document.getElementById('badge-section');
  if(!b||!subs.length){sec.style.display='none';return;}
  sec.style.display='flex';
  document.getElementById('badge-emoji').textContent=b.emoji;
  document.getElementById('badge-name').textContent=b.name;
  document.getElementById('badge-desc').textContent=b.desc;
}

// ── Budget Bar ─────────────────────────────────────────────────────
function updateBudgetBar(){
  const monthly=subs.reduce((a,s)=>a+toMonthly(s.price,s.cycle),0);
  const inp=document.getElementById('budget-inp');
  if(budget>0&&!inp.value) inp.value=budget;
  const sec=document.getElementById('budget-section');
  const bar=document.getElementById('budget-bar');
  const st =document.getElementById('budget-status');
  if(!budget){bar.style.width='0%';st.textContent='No limit set';st.className='budget-status';sec.classList.remove('over');return;}
  const pct=Math.min((monthly/budget)*100,100);
  bar.style.width=pct+'%';
  const diff=budget-monthly;
  if(monthly>budget){bar.className='budget-bar-fill over';st.textContent=`Over by ${fmt(Math.abs(diff))}`;st.className='budget-status over';sec.classList.add('over');}
  else if(pct>75){bar.className='budget-bar-fill warn';st.textContent=`${fmt(diff)} left`;st.className='budget-status warn';sec.classList.remove('over');}
  else{bar.className='budget-bar-fill';st.textContent=`${fmt(diff)} left`;st.className='budget-status';sec.classList.remove('over');}
}

// ── Donut Chart ────────────────────────────────────────────────────
const CAT_COLORS={streaming:'#c9a96e',music:'#e87fa0',productivity:'#5ecbba',software:'#a78bfa',other:'#7a7880'};
function updateDonut(){
  const row=document.getElementById('insights-row');
  if(!subs.length){row.style.display='none';return;}
  row.style.display='grid';
  const cats={};
  subs.forEach(s=>{const m=toMonthly(s.price,s.cycle);cats[s.category]=(cats[s.category]||0)+m;});
  const total=Object.values(cats).reduce((a,b)=>a+b,0);
  const entries=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const svg=document.getElementById('donut-svg');
  const cx=45,cy=45,r=32,sw=14,circ=2*Math.PI*r;
  let rot=0,paths='';
  entries.forEach(([cat,val])=>{
    const pct=val/total,dl=pct*circ,gl=circ-dl,color=CAT_COLORS[cat]||'#888';
    paths+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-dasharray="${dl.toFixed(2)} ${gl.toFixed(2)}" transform="rotate(${rot-90} ${cx} ${cy})"/>`;
    rot+=pct*360;
  });
  paths+=`<text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="11" font-weight="600" fill="currentColor" font-family="DM Sans,sans-serif">${entries.length}</text>`;
  paths+=`<text x="${cx}" y="${cy+9}" text-anchor="middle" font-size="9" fill="#7a7880" font-family="DM Sans,sans-serif">cats</text>`;
  svg.innerHTML=paths;
  document.getElementById('donut-legend').innerHTML=entries.map(([cat,val])=>`
    <div class="legend-item"><div class="legend-dot" style="background:${CAT_COLORS[cat]||'#888'}"></div><span style="text-transform:capitalize">${cat}</span><span>${fmt(val)}</span></div>`).join('');
  const sorted=[...subs].sort((a,b)=>toMonthly(b.price,b.cycle)-toMonthly(a.price,a.cycle)).slice(0,3);
  const maxV=toMonthly(sorted[0].price,sorted[0].cycle);
  document.getElementById('top-spend-list').innerHTML=sorted.map(s=>{
    const m=toMonthly(s.price,s.cycle),pct=(m/maxV*100).toFixed(0),color=CAT_COLORS[s.category]||'#888';
    return `<div><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:var(--text)">${s.icon} ${s.name}</span><span style="font-size:13px;font-weight:600;color:var(--text)">${fmt(m)}<span style="font-size:11px;color:var(--muted)">/mo</span></span></div><div style="height:4px;background:var(--border2);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width .5s"></div></div></div>`;
  }).join('');
}

// ── Render ─────────────────────────────────────────────────────────
function render(){
  const filtered=currentFilter==='all'?subs:subs.filter(s=>s.category===currentFilter);
  const grid=document.getElementById('subs-grid'),empty=document.getElementById('empty-state');
  if(!filtered.length){grid.innerHTML='';empty.style.display='block';}
  else{
    empty.style.display='none';
    grid.innerHTML=filtered.map(s=>{
      const td=s.isTrial&&s.trialEnd?daysUntil(s.trialEnd):null;
      const trialBadge=s.isTrial?`<span class="trial-badge">🎁 Free Trial</span>`:'';
      const trialCD=td!==null?`<div class="trial-countdown ${td<=2?'urgent':''}">${td<=0?'⚠️ Trial ended — check if charged!':td===1?'⚠️ Trial ends tomorrow — decide now!':'⏳ Trial ends in '+td+' days'}</div>`:'';
      return `<div class="sub-card ${s.isTrial?'trial-card':''}">
        <div class="sub-card-top"><div class="sub-icon" style="background:rgba(255,255,255,0.05)">${s.icon||'📦'}</div>
        <div class="card-actions"><button class="icon-btn edit" onclick="editSub(${s.id})" title="Edit">✎</button><button class="icon-btn delete" onclick="deleteSub(${s.id})" title="Delete">✕</button></div></div>
        <div class="sub-name">${s.name}</div>
        <div><span class="sub-category cat-${s.category}">${s.category}</span>${trialBadge}</div>
        ${trialCD}
        <div class="sub-bottom" style="margin-top:8px">
          <div class="sub-price">${fmt(s.price)} <span>/ ${s.cycle}</span></div>
          <div class="sub-billing"><div class="billing-label">Next billing</div><div class="billing-date ${billingClass(s.date)}">${billingLabel(s.date)}</div></div>
        </div></div>`;
    }).join('');
  }
  updateStats(); updateDueStrip(); updateBadge(); updateBudgetBar(); updateDonut();
}

function updateStats(){
  const m=subs.reduce((a,s)=>a+toMonthly(s.price,s.cycle),0);
  const due=subs.filter(s=>daysUntil(s.date)<=7&&daysUntil(s.date)>=0).length;
  document.getElementById('stat-monthly').textContent=fmt(m);
  document.getElementById('stat-yearly').textContent=fmt(m*12);
  document.getElementById('stat-count').textContent=subs.length;
  document.getElementById('stat-due').textContent=due;
}

function updateDueStrip(){
  const strip=document.getElementById('due-strip');
  const ds=subs.filter(s=>daysUntil(s.date)>=0&&daysUntil(s.date)<=3);
  if(!ds.length){strip.style.display='none';return;}
  strip.style.display='flex';
  document.getElementById('due-strip-msg').innerHTML=ds.map(s=>`<strong>${s.name}</strong>`).join(', ')+(ds.length>1?' are':' is')+' renewing within 3 days — heads up!';
}

// ── Filter ─────────────────────────────────────────────────────────
function setFilter(f,e){
  currentFilter=f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  if(e&&e.target)e.target.classList.add('active');
  render();
}

// ── Trial toggle ───────────────────────────────────────────────────
function toggleTrial(){
  isTrial=!isTrial;
  document.getElementById('trial-switch').classList.toggle('on',isTrial);
  document.getElementById('trial-date-row').classList.toggle('show',isTrial);
}

// ── Modal ──────────────────────────────────────────────────────────
function openModal(sub=null){
  editingId=sub?sub.id:null; isTrial=sub?.isTrial||false;
  document.getElementById('modal-title').innerHTML=sub?'Edit <span>Subscription</span>':'Add <span>Subscription</span>';
  document.getElementById('f-name').value=sub?.name||'';
  document.getElementById('f-price').value=sub?.price||'';
  document.getElementById('f-cycle').value=sub?.cycle||'monthly';
  document.getElementById('f-category').value=sub?.category||'streaming';
  document.getElementById('f-icon').value=sub?.icon||'';
  document.getElementById('f-date').value=sub?.date||daysFromNow(30);
  document.getElementById('f-trial-end').value=sub?.trialEnd||'';
  document.getElementById('trial-switch').classList.toggle('on',isTrial);
  document.getElementById('trial-date-row').classList.toggle('show',isTrial);
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');}
function closeModalOutside(e){if(e.target===document.getElementById('modal-overlay'))closeModal();}
function editSub(id){openModal(subs.find(s=>s.id===id));}

function saveSub(){
  const name=document.getElementById('f-name').value.trim();
  const price=parseFloat(document.getElementById('f-price').value);
  if(!name||isNaN(price)||price<0){alert('Please fill in a valid name and price.');return;}
  const sub={
    id:editingId||Date.now(),name,price,
    cycle:document.getElementById('f-cycle').value,
    category:document.getElementById('f-category').value,
    icon:document.getElementById('f-icon').value||'📦',
    date:document.getElementById('f-date').value||daysFromNow(30),
    isTrial,trialEnd:isTrial?document.getElementById('f-trial-end').value:'',
  };
  subs=editingId?subs.map(s=>s.id===editingId?sub:s):[...subs,sub];
  save();closeModal();render();
}

function deleteSub(id){
  const s=subs.find(s=>s.id===id);
  if(confirm(`Remove ${s.name}?`)){subs=subs.filter(s=>s.id!==id);save();render();}
}

// ── Reminder ───────────────────────────────────────────────────────
function showReminder(){
  const today=subs.filter(s=>daysUntil(s.date)===0);
  const tmrw=subs.filter(s=>daysUntil(s.date)===1);
  const trials=subs.filter(s=>s.isTrial&&s.trialEnd&&daysUntil(s.trialEnd)<=2&&daysUntil(s.trialEnd)>=0);
  let msg='';
  if(today.length) msg+=today.map(s=>s.name).join(', ')+' renew today. ';
  if(tmrw.length)  msg+=tmrw.map(s=>s.name).join(', ')+' renew tomorrow. ';
  if(trials.length)msg+='⚠️ '+trials.map(s=>s.name).join(', ')+' trial ending soon!';
  if(!msg)return;
  document.getElementById('reminder-msg').textContent=msg;
  setTimeout(()=>document.getElementById('reminder-banner').classList.add('show'),1000);
  setTimeout(()=>closeReminder(),7000);
}
function closeReminder(){document.getElementById('reminder-banner').classList.remove('show');}

// ── Init ───────────────────────────────────────────────────────────
applyTheme();
if(budget)document.getElementById('budget-inp').value=budget;
document.getElementById('header-date').textContent=new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
render();
showReminder();
