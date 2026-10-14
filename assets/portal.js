(function(){
'use strict';
const SB=window.supabase.createClient('https://awvcorswnzbxsrrzepto.supabase.co','sb_publishable_6GqdbyBWEX7cIkTzcp9yvw_WYNp5GJh',{auth:{storageKey:'hr-auth-awvcorsw'}});
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=(m,t,i)=>window.showToast?window.showToast(m,t||'info',i||'ℹ️'):alert(m);
const SQL=`create table if not exists public.site_content(k text primary key, v jsonb not null, updated_at timestamptz default now());
alter table public.site_content enable row level security;
drop policy if exists sc_read on public.site_content;
create policy sc_read on public.site_content for select using (k in ('brand','notice','event') or k like 'person:%' or k like 'res:%' or k like 'resdata:%' or auth.uid() is not null);
drop policy if exists sc_write on public.site_content;
create policy sc_write on public.site_content for all using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='Admin')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='Admin'));`;
let U=null,C={},dbOk=true,flag=false,cur='dashboard';
const lsGet=()=>{try{return JSON.parse(localStorage.getItem('ptc')||'{}')}catch(e){return {}}};
async function loadC(all){
  C=lsGet();
  let q=SB.from('site_content').select('k,v').not('k','like','resdata:%');
  if(!all)q=q.or('k.eq.brand,k.eq.notice,k.eq.event,k.like.person:%,k.like.res:%');
  const {data,error}=await q;
  if(error){dbOk=false;return}
  dbOk=true;data.forEach(r=>C[r.k]=r.v);
}
async function put(k,v){
  const {error}=await SB.from('site_content').upsert({k,v,updated_at:new Date().toISOString()});
  if(error){dbOk=false;const l=lsGet();l[k]=v;try{localStorage.setItem('ptc',JSON.stringify(l))}catch(e){toast('File too large for local fallback','warn','⚠️')}C[k]=v;toast('Saved on this device only — run the SQL setup (Site Content page)','warn','⚠️');return false}
  C[k]=v;return true;
}
async function del(k){await SB.from('site_content').delete().eq('k',k);delete C[k];const l=lsGet();delete l[k];localStorage.setItem('ptc',JSON.stringify(l))}
const list=p=>Object.keys(C).filter(k=>k.startsWith(p)).map(k=>({k,...C[k]}));
function readFile(f,max){return new Promise((res,rej)=>{if(!f)return rej('No file');if(f.size>max)return rej('File too large (max '+Math.round(max/1048576)+' MB)');const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
function shrink(f,px){return readFile(f,8e6).then(d=>new Promise(res=>{const i=new Image();i.onload=()=>{const s=Math.min(1,px/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL(f.type==='image/png'?'image/png':'image/jpeg',.85))};i.src=d}))}
function openData(d,name,dl){const b=atob(d.split(',')[1]),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);const u=URL.createObjectURL(new Blob([a],{type:d.slice(5,d.indexOf(';'))}));const l=document.createElement('a');l.href=u;l.target='_blank';if(dl)l.download=name;l.click();setTimeout(()=>URL.revokeObjectURL(u),6e4)}
function csv(t){return t.trim().split(/\r?\n/).map(l=>{const o=[];l.replace(/("([^"]|"")*"|[^,]*)(,|$)/g,(m,a)=>{o.push(a.replace(/^"|"$/g,'').replace(/""/g,'"'));return ''});o.length&&o.pop&&0;return o.slice(0,6)})}
async function parseQuiz(f){
  const t=await f.text();let qs=[];
  if(/\.json$/i.test(f.name)){qs=JSON.parse(t).map(x=>({q:x.q||x.question,o:x.o||x.options,a:typeof x.a==='number'?x.a:'ABCD'.indexOf(String(x.a||x.answer).toUpperCase())}))}
  else csv(t).filter(r=>r[0]&&!/^question$/i.test(r[0])).forEach(r=>qs.push({q:r[0],o:r.slice(1,5),a:'ABCD'.indexOf((r[5]||'').trim().toUpperCase())}));
  qs=qs.filter(x=>x.q&&x.o&&x.o.length>=2&&x.a>=0);if(!qs.length)throw 'No valid questions found. Format: question,A,B,C,D,answer(A-D)';return qs;
}
/* ---------- public site: brand + team ---------- */
function applyBrand(){
  if(window.__hrApplyEvent&&C.event)window.__hrApplyEvent(C.event);
  const b=C.brand||{};
  $$('.logo').forEach(a=>{if(a.closest('#portal'))return;a.innerHTML=(b.logo?`<img src="${b.logo}" alt="logo">`:'<span class="logo-mark">HR</span>')+' '+h(b.name||'Hackathon Rivals')});
  if(b.logo){let l=$('link[rel=icon]');if(l)l.href=b.logo}
  if(b.name)document.title=b.name+' — Hackathon Arena';
  let nb=$('#siteNotice');const n=C.notice;
  if(n&&n.on&&n.text){if(!nb){nb=document.createElement('div');nb.id='siteNotice';document.body.prepend(nb)}nb.textContent='📢 '+n.text}else if(nb)nb.remove();
  const pl=$('.pt-side .logo');if(pl)pl.innerHTML=(b.logo?`<img src="${b.logo}" alt="" loading="lazy" decoding="async">`:'<span class="logo-mark">HR</span>')+' '+h(b.name||'Hackathon Rivals');
  RES.forEach(([id,,label])=>$$('a').forEach(a=>{if(a.closest('#portal')||a.textContent.trim().replace(/\s*→$/,'')!==label)return;
    const r=C['res:'+id];a.style.display=r?'':'none';
    if(r){a.href='#';a.onclick=async e=>{e.preventDefault();const {data,error}=await SB.from('site_content').select('v').eq('k','resdata:'+id).maybeSingle();if(error||!data)return toast('File not available','warn','⚠️');openData(data.v.data,r.name,1)}}}));
  const ppl=list('person:');let s=$('#team');
  if(!ppl.length){if(s)s.remove();$('#navTeam')?.remove();return}
  if(!s){s=document.createElement('section');s.className='sec team-sec';s.id='team';$('#contact').before(s);
    const n=document.createElement('a');n.href='#team';n.id='navTeam';n.textContent='Team';$('#navLinks a[href="#contact"]')?.before(n)}
  const grp=(t,l)=>{const a=ppl.filter(p=>String(p.type||'').toLowerCase()===String(t).toLowerCase());return a.length?`<h3>${l}</h3><div class="pt-grid">${a.sort((x,y)=>(x.ord||0)-(y.ord||0)).map(p=>`<div class="team-card">${p.photo?`<img src="${p.photo}" alt="">`:`<div class="ph">${h((p.name||'?')[0])}</div>`}<h4>${h(p.name)}</h4><div class="r">${h(p.role)}</div><p>${h(p.bio)}</p>${p.link?`<a href="${h(p.link)}" target="_blank" rel="noopener" style="color:var(--violet);font-size:13px">Profile →</a>`:''}</div>`).join('')}</div>`:''};
  const ex=new Map();ppl.forEach(p=>{const t=String(p.type||'').trim(),k=t.toLowerCase();if(t&&k!=='founder'&&k!=='organiser'&&!ex.has(k))ex.set(k,t)});
  s.innerHTML=`<div class="wrap"><div class="sec-head"><span class="eyebrow">Our Team</span><h2>${ex.size?'Meet the Team':'Founders &amp; Organisers'}</h2></div>${grp('founder','Founders')}${grp('organiser','Organisers')}${[...ex.values()].map(t=>grp(t,h(t))).join('')}</div>`;
}
/* ---------- portal shell ---------- */
const RES=[['guidelines','Guidelines','Guidelines'],['ppt','PPT Template','PPT Template'],['brochure','Brochure','Download brochure']];
const PAGES=[['dashboard','📊','Dashboard'],['practice','🗂️','Practice Bank'],['profile','👤','My Profile'],['arena','⚔️','Code Arena'],['register','📝','Registrations'],['papers','📄','Question Papers'],['admin','🛡️','Admin Console',1],['hack','🚀','Hackathon & Quizzes',1],['content','🎛️','Site Content',1]];
function build(){
  const p=document.createElement('div');p.id='portal';
  p.innerHTML=`<aside class="pt-side"><a class="logo" href="#"></a>${PAGES.map(([id,i,l,a])=>`<button class="pt-nav" data-p="${id}" ${a?'data-admin="1"':''}><span>${i}</span>${l}</button>`).join('')}<div class="pt-sep"></div><button class="pt-nav" id="ptHome"><span>🏠</span>Back to website</button><button class="pt-nav" id="ptTheme"><span>🌗</span>Switch theme</button><button class="pt-nav" id="ptOut"><span>🚪</span>Log out</button><div class="pt-me" id="ptMe"></div></aside><div class="pt-main"><div class="pt-wrap" id="ptPanes"></div></div>`;
  document.body.appendChild(p);
  const P=$('#ptPanes');
  PAGES.forEach(([id])=>{const d=document.createElement('div');d.className='pp';d.dataset.page=id;P.appendChild(d)});
  ['arena','register','admin'].forEach(id=>{const s=$('#'+id);if(s)$(`.pp[data-page=${id}]`).appendChild(s)});
  $$('.pt-nav[data-p]').forEach(b=>b.onclick=()=>go(b.dataset.p));
  $('#ptHome').onclick=()=>{location.hash=''};
  $('#ptTheme').onclick=()=>$('#themeToggle')?.click();
  $('#ptOut').onclick=()=>{const b=$('#ddLogout');b?b.click():SB.auth.signOut()};
  const adm=$$('.admin-hidden');
  const tabs=$('#admin .tabs');if(tabs){const b=document.createElement('button');b.className='tab';b.textContent='🎛️ Site Content';b.onclick=()=>go('content');tabs.appendChild(b);const c=document.createElement('button');c.className='tab';c.textContent='🚀 Hackathon & Quizzes';c.onclick=()=>go('hack');tabs.appendChild(c)}
}
const go=p=>{if(p==='practice'&&U){try{localStorage.setItem('hrp:lastTab','"exam"')}catch(e){}$('#hrpHubBtn')?.click();return}if(!U){toast('Please log in first','info','🔐');$('#loginBtn')?.click();return}location.hash='#/app/'+p};
async function show(p){
  const admin=U.role==='Admin';
  if(!PAGES.some(x=>x[0]===p)||((p==='admin'||p==='content'||p==='hack')&&!admin))p='dashboard';
  cur=p;document.body.classList.add('in-portal');window.scrollTo(0,0);
  $$('.pt-nav[data-admin]').forEach(b=>b.style.display=admin?'':'none');
  $$('.pt-nav[data-p]').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
  $$('.pp').forEach(e=>e.classList.toggle('on',e.dataset.page===p));
  $('#ptMe').innerHTML=`<b>${h(U.name)}</b>${h(U.email)}<br>${h(U.role)}`;
  const pane=$(`.pp[data-page=${p}]`);$$('.reveal',pane).forEach(e=>{e.style.opacity=1;e.style.transform='none'});
  if(p==='admin'){const a=$('#admin');a.style.display='';}
  if(['papers','content','dashboard','hack','profile'].includes(p)){await loadC(true);applyBrand();({dashboard,papers,content,hack,profile}[p])(pane)}
  if(p==='admin'&&window.__hrLoadAdmin)window.__hrLoadAdmin();
  $('.pt-main').scrollTop=0;
}
function hide(){document.body.classList.remove('in-portal')}
function route(){const m=location.hash.match(/^#\/app(?:\/(\w+))?/);if(m&&U)show(m[1]||'dashboard');else{if(m)history.replaceState(null,'',location.pathname+location.search);hide()}}
/* ---------- pages ---------- */
async function cnt(t){const {count}=await SB.from(t).select('*',{count:'exact',head:true});return count??'—'}
async function dashboard(el){
  el.innerHTML=`${C.notice&&C.notice.on&&C.notice.text?`<div class="pt-warn">📢 ${h(C.notice.text)}</div>`:''}<h2 class="pt-h">Welcome, ${h(U.name.split(' ')[0])} 👋</h2><p class="pt-sub">Role: ${h(U.role)} · ${h(U.email)}</p><div class="pt-grid">${PAGES.filter(x=>x[0]!=='dashboard'&&(!x[3]||U.role==='Admin')).map(([id,i,l])=>`<div class="pt-card"><h4>${i} ${l}</h4><button class="btn btn-ghost" data-g="${id}">Open →</button></div>`).join('')}<div class="pt-card"><h4>📈 My stats &amp; profile</h4><button class="btn btn-primary" id="ptFull">Open full dashboard</button></div></div>`;
  $$('[data-g]',el).forEach(b=>b.onclick=()=>go(b.dataset.g));
  if(U.role==='Admin'){const [t,s]=await Promise.all([cnt('team_registrations'),cnt('arena_submissions')]);
    el.querySelector('.pt-grid').insertAdjacentHTML('afterbegin',[['👥 Teams registered',t],['⚔️ Arena submissions',s],['📄 Question papers',list('paper:').length],['🧑‍🤝‍🧑 Team members listed',list('person:').length]].map(([l,v])=>`<div class="pt-card"><h4>${l}</h4><div style="font:700 30px 'Space Grotesk'">${v}</div></div>`).join(''))}
  $('#ptFull',el).onclick=()=>$('#ddDashboard')?.click();
}
function papers(el){
  const a=list('paper:').sort((x,y)=>(y.t||0)-(x.t||0));
  el.innerHTML=`<h2 class="pt-h">📄 Question Papers</h2><p class="pt-sub">Uploaded by the admin team.</p>${a.length?'<div class="pt-card"><input type="text" id="pqS" placeholder="🔍 Search papers by title, subject or year" style="width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px 12px"></div>':''}${a.length?a.map(p=>`<div class="pt-card pq"><div class="pt-item" style="border:0;padding:0"><div class="g"><b>${h(p.title)}</b><small>${h(p.subject||'')} ${h(p.year||'')}</small></div><button class="btn btn-ghost" data-v="${p.k}">View</button><button class="btn btn-primary" data-d="${p.k}">Download</button></div></div>`).join(''):'<div class="pt-card">No question papers uploaded yet.</div>'}`;
  const sI=$('#pqS',el);if(sI)sI.oninput=()=>{const q=sI.value.toLowerCase();$$('.pq',el).forEach(c=>c.style.display=c.textContent.toLowerCase().includes(q)?'':'none')};
  $$('[data-v]',el).forEach(b=>b.onclick=()=>{const p=C[b.dataset.v];openData(p.data,p.name)});
  $$('[data-d]',el).forEach(b=>b.onclick=()=>{const p=C[b.dataset.d];openData(p.data,p.name,1)});
}
async function profile(el){
  const {data:{user}}=await SB.auth.getUser();const {data:p}=await SB.from('profiles').select('*').eq('id',user.id).maybeSingle();
  el.innerHTML=`<h2 class="pt-h">👤 My Profile</h2><p class="pt-sub">${h(U.email)} · Role: ${h(U.role)}</p>
  <div class="pt-card"><h4>Details</h4><div class="row"><input type="text" id="pfName" placeholder="Full name" value="${h(p?.full_name||U.name)}"><input type="text" id="pfCol" placeholder="College / Institute" value="${h(p?.college||'')}"></div><div class="row"><button class="btn btn-primary" id="pfSave">Save changes</button></div></div>
  <div class="pt-card"><h4>Change password</h4><div class="row"><input type="password" id="pfP1" placeholder="New password (min 8 chars)" style="background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px 12px;flex:1"><input type="password" id="pfP2" placeholder="Confirm password" style="background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:10px 12px;flex:1"></div><div class="row"><button class="btn btn-ghost" id="pfPw">Update password</button></div></div>`;
  $('#pfSave',el).onclick=async()=>{const n=$('#pfName',el).value.trim(),c=$('#pfCol',el).value.trim();if(!n)return toast('Name required','warn','⚠️');
    const {error}=await SB.from('profiles').update({full_name:n,college:c}).eq('id',user.id);
    if(error){await SB.auth.updateUser({data:{full_name:n,college:c}});toast('Saved to your account','success','✅')}else toast('Profile updated','success','✅');U.name=n;$('#ptMe').innerHTML=`<b>${h(n)}</b>${h(U.email)}<br>${h(U.role)}`};
  $('#pfPw',el).onclick=async()=>{const a=$('#pfP1',el).value;if(window.__hrWeakPw(a,(HB.me&&HB.me.email)||''))return toast('Use 8+ characters with letters and numbers — not a common password','warn','⚠️');if(a!==$('#pfP2',el).value)return toast('Passwords do not match','warn','⚠️');
    const {error}=await SB.auth.updateUser({password:a});error?toast(error.message,'warn','⚠️'):(toast('Password updated','success','🔒'),$('#pfP1',el).value=$('#pfP2',el).value='')};
}
function hack(el){
  el.innerHTML='<h2 class="pt-h">🚀 Hackathon &amp; Quizzes</h2><p class="pt-sub">Edit hackathon timing, registrations, upload / edit and the question bank.</p><div class="pt-card" id="hkMount"></div>';
  if(window.__hrMountAdmin)window.__hrMountAdmin($('#hkMount',el));else $('#hkMount',el).textContent='Loading… refresh the page if this stays empty.';
}
function content(el){
  const b=C.brand||{},ppl=list('person:'),pp=list('paper:');const EV=C.event||(window.__hrGetHackTimes&&window.__hrGetHackTimes())||{};
  const row=(k,t,s,img)=>`<div class="pt-item">${img?`<img src="${img}" alt="" loading="lazy" decoding="async">`:''}<div class="g"><b>${h(t)}</b><small>${h(s)}</small></div>${k.startsWith('person:')?`<button class="btn btn-ghost" data-mv="${k}:-1">↑</button><button class="btn btn-ghost" data-mv="${k}:1">↓</button>`:''}<button class="btn btn-ghost" data-x="${k}">🗑 Delete</button></div>`;
  el.innerHTML=`<h2 class="pt-h">🎛️ Site Content</h2><p class="pt-sub">Logo, founders, organisers, question papers — manage everything here, no code changes needed.</p>
  ${dbOk?'':`<div class="pt-warn">⚠️ One-time setup: run this SQL in Supabase → SQL Editor so uploads are saved for everyone. <button class="btn btn-ghost" id="cpSql">Copy SQL</button></div>`}
  <div class="pt-card"><h4>🏆 Event dates (Grand Finale &amp; deadline)</h4><p class="pt-sub" style="margin:0 0 8px;font-size:12.5px">One place for everything: banner, countdown timer, registration lock and deadline text. Registration closes at 11:59 PM IST on the deadline date (leave it empty to close when the countdown ends).</p><div class="row"><label>Finale start <input type="date" id="evStart" value="${h(EV.start||'')}"></label><label>Finale end <input type="date" id="evEnd" value="${h(EV.end||'')}"></label><label>Start time (IST) <input type="time" id="evTime" value="${h(EV.time||'09:00')}"></label></div><div class="row"><input type="text" id="evVenue" placeholder="Venue / city" value="${h(EV.venue||'New Delhi')}"><label>Registration deadline <input type="date" id="evDeadline" value="${h(EV.deadline||'')}"></label><button class="btn btn-primary" id="evSave">Save</button></div></div>\r\n  <div class="pt-card"><h4>📢 Announcement bar</h4><div class="row"><input type="text" id="nTxt" placeholder="e.g. Registrations close on 30 April!" value="${h((C.notice||{}).text||'')}"><label><input type="checkbox" id="nOn" ${(C.notice||{}).on?'checked':''}> Show</label><button class="btn btn-primary" id="nSave">Save</button></div></div>
<div class="pt-card"><h4>📎 Downloads (footer links &amp; brochure button)</h4><p class="pt-sub" style="margin:0 0 6px;font-size:12.5px">A link shows on the website only after you upload its file. Max 4 MB.</p>${RES.map(([id,l])=>{const r=C['res:'+id];return `<div class="pt-item"><div class="g"><b>${l}</b><small>${r?'✅ '+h(r.name):'Not uploaded — hidden on website'}</small></div><input type="file" id="rf_${id}"><button class="btn btn-primary" data-ru="${id}">Upload</button>${r?`<button class="btn btn-ghost" data-rd="${id}">Remove</button>`:''}</div>`}).join('')}</div>
  <div class="pt-card"><h4>🖼️ Logo &amp; site name</h4>${b.logo?`<img src="${b.logo}" alt="" loading="lazy" decoding="async" style="height:50px;margin-bottom:8px">`:''}<div class="row"><input type="text" id="bName" placeholder="Site name" value="${h(b.name||'Hackathon Rivals')}"><input type="file" id="bLogo" accept="image/*"></div><div class="row"><button class="btn btn-primary" id="bSave">Save</button>${b.logo?'<button class="btn btn-ghost" id="bRm">Remove logo</button>':''}</div></div>
  <div class="pt-card"><h4>👤 Founders &amp; Organisers</h4><div class="row"><select id="pType"><option value="founder">Founder</option><option value="organiser">Organiser</option><option value="__other">✏️ Other — type your own</option></select><input type="text" id="pTypeText" maxlength="40" placeholder="Group name (e.g. Mentor, Advisor, Volunteer)" style="display:none"><input type="text" id="pName" placeholder="Name"><input type="text" id="pRole" placeholder="Title / role"></div><div class="row"><input type="text" id="pBio" placeholder="Short bio"><input type="text" id="pLink" placeholder="LinkedIn / website (optional)"><input type="file" id="pPhoto" accept="image/*"></div><div class="row"><button class="btn btn-primary" id="pAdd">+ Add</button></div>${ppl.map(p=>row(p.k,p.name,p.type+' · '+(p.role||''),p.photo)).join('')}</div>
  <div class="pt-card"><h4>📄 Question papers</h4><div class="row"><input type="text" id="qpTitle" placeholder="Title"><input type="text" id="qpSub" placeholder="Subject"><input type="text" id="qpYear" placeholder="Year"></div><div class="row"><input type="file" id="qpFile" accept=".pdf,image/*,.doc,.docx"><button class="btn btn-primary" id="qpAdd">Upload</button></div>${pp.map(p=>row(p.k,p.title,(p.subject||'')+' '+(p.year||''))).join('')}</div>`;
  const re=()=>{content(el);applyBrand()},on=(id,fn)=>{const n=$('#'+id,el);if(n)n.onclick=async()=>{try{await fn()}catch(e){toast(String(e.message||e),'warn','⚠️')}}};
  on('cpSql',()=>navigator.clipboard.writeText(SQL).then(()=>toast('SQL copied','success','📋')));
  on('bSave',async()=>{const f=$('#bLogo',el).files[0];await put('brand',{name:$('#bName',el).value.trim(),logo:f?await shrink(f,400):b.logo});re();toast('Branding saved','success','✅')});
  on('evSave',async()=>{const st=$('#evStart',el).value,en=$('#evEnd',el).value;if(!st)throw 'Finale start date is required';if(en&&en<st)throw 'End date cannot be before start date';const dl=$('#evDeadline',el).value,tm=$('#evTime',el).value||'09:00',ok=await put('event',{start:st,end:en||st,time:tm,venue:$('#evVenue',el).value.trim(),deadline:dl});let hk=true;if(window.__hrSetHackTimes){try{const iso=x=>new Date(x).toISOString(),s0=iso(st+'T'+tm+':00+05:30');await window.__hrSetHackTimes({starts_at:s0,reg_closes_at:dl?iso(dl+'T23:59:00+05:30'):s0,ends_at:en?iso(en+'T23:59:00+05:30'):null})}catch(e){hk=false;toast('Dates saved, but live countdown not updated: '+(e.message||e),'warn','⚠️')}}re();if(ok&&hk)toast('Event dates saved — live on the website','success','✅')});
  on('nSave',async()=>{await put('notice',{text:$('#nTxt',el).value.trim(),on:$('#nOn',el).checked});re();toast('Announcement saved','success','✅')});
  $$('[data-mv]',el).forEach(x=>x.onclick=async()=>{const [k,d]=[x.dataset.mv.slice(0,x.dataset.mv.lastIndexOf(':')),+x.dataset.mv.split(':').pop()];const s=ppl.filter(p=>p.type===C[k].type).sort((a,b)=>(a.ord||0)-(b.ord||0)),i=s.findIndex(p=>p.k===k),o=s[i+d];if(!o)return;const a=C[k].ord||0,b=C[o.k].ord||0;await put(k,{...C[k],ord:b});await put(o.k,{...C[o.k],ord:a});re()});
  $$('[data-ru]',el).forEach(x=>x.onclick=async()=>{try{const id=x.dataset.ru,f=$('#rf_'+id,el).files[0];if(!f)throw 'Choose a file first';const d=await readFile(f,4e6);if(!(await put('resdata:'+id,{data:d})))return;await put('res:'+id,{name:f.name,t:Date.now()});re();toast('Uploaded','success','✅')}catch(e){toast(String(e.message||e),'warn','⚠️')}});
  $$('[data-rd]',el).forEach(x=>x.onclick=async()=>{await del('res:'+x.dataset.rd);await del('resdata:'+x.dataset.rd);re()});
  on('bRm',async()=>{await put('brand',{name:b.name});re()});
  on('pAdd',async()=>{const n=$('#pName',el).value.trim();if(!n)throw 'Name required';const f=$('#pPhoto',el).files[0];await put('person:'+Date.now(),{type:(()=>{const v=$('#pType',el).value;if(v!=='__other')return v;const t=$('#pTypeText',el).value.trim();if(!t)throw 'Type the group name (e.g. Mentor)';return t.slice(0,40)})(),name:n,role:$('#pRole',el).value,bio:$('#pBio',el).value,link:$('#pLink',el).value,photo:f?await shrink(f,360):'',ord:Date.now()});re()});
  {const pt=$('#pType',el);if(pt)pt.onchange=()=>{$('#pTypeText',el).style.display=pt.value==='__other'?'':'none'}}
  on('qpAdd',async()=>{const f=$('#qpFile',el).files[0],t=$('#qpTitle',el).value.trim();if(!t)throw 'Title required';await put('paper:'+Date.now(),{title:t,subject:$('#qpSub',el).value,year:$('#qpYear',el).value,name:f.name,data:await readFile(f,4e6),t:Date.now()});re();toast('Uploaded','success','✅')});
  $$('[data-x]',el).forEach(x=>x.onclick=async()=>{if(confirm('Delete this item?')){await del(x.dataset.x);re()}});
}
/* ---------- auth wiring ---------- */
async function loadUser(){
  const {data:{user}}=await SB.auth.getUser();
  if(!user){U=null;return}
  const {data:p}=await SB.from('profiles').select('role,full_name').eq('id',user.id).maybeSingle();
  U={email:user.email,name:p?.full_name||user.user_metadata?.full_name||user.email.split('@')[0],role:p?.role||'Student'};
}
function addPortalBtn(){
  const cta=$('.nav-cta');if(!cta)return;let b=$('#ptOpen');
  if(U&&!b){b=document.createElement('button');b.id='ptOpen';b.className='btn btn-primary';b.textContent='Open Portal →';b.onclick=()=>go('dashboard');cta.insertAdjacentElement('afterbegin',b)}
  if(!U&&b)b.remove();
}
document.addEventListener('click',e=>{
  if(e.target.closest('#loginSubmit'))flag=true,setTimeout(()=>flag=false,20000);
  const a=e.target.closest('a[href="#arena"],a[href="#register"],a[href="#admin"]');
  if(a&&!a.closest('#portal')){e.preventDefault();go(a.getAttribute('href').slice(1))}
},true);
const osi=Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView=function(o){const p=this.closest&&this.closest('.pp');if(p&&p.dataset.page!==cur||(p&&!document.body.classList.contains('in-portal'))){go(p.dataset.page);return}return osi.call(this,o)};
(async function init(){
  build();
  await loadUser();await loadC(!!U);applyBrand();addPortalBtn();route();
  window.addEventListener('hashchange',route);
  SB.auth.onAuthStateChange(async(ev)=>{
    if(ev==='TOKEN_REFRESHED')return;
    await loadUser();addPortalBtn();
    if(ev==='SIGNED_OUT'||!U){location.hash='';hide();return}
    if(ev==='SIGNED_IN'&&flag){flag=false;location.hash=U.role==='Admin'?'#/app/admin':'#/app/dashboard'}
  });
})();
})();
