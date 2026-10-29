/* ===== CHUNK 6: CLIENT CORE (state, API, helpers, router) ===== */
// sessionStorage = per-tab login, so two logins on one PC/browser never overwrite each other
let mem={};try{localStorage.removeItem('pt')}catch(e){}
const lsGet=k=>{try{return sessionStorage.getItem(k)||''}catch(e){return mem[k]||''}};
const lsSet=(k,v)=>{try{v?sessionStorage.setItem(k,v):sessionStorage.removeItem(k)}catch(e){mem[k]=v}};
const S={token:lsGet('pt'),user:null,folders:[],pay:{},url:'',optin:false,next:'',f:{}};
const $=s=>document.querySelector(s), v=id=>document.getElementById(id).value;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const V={};
const START=(()=>{const m=/^C\d{1,6}$/.exec(new URLSearchParams(location.search).get('p')||'');return m?m[0]:''})(); // direct link ?p=C0002
const api=(a,p={})=>fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},   // text/plain = no CORS preflight
  body:JSON.stringify({action:a,payload:Object.assign({token:S.token},p)})})
  .then(r=>r.json(),()=>{throw new Error('Network error - please check your connection')})
  .then(r=>{if(!r.ok)throw new Error(r.error);return r.data},e=>{throw new Error(e instanceof SyntaxError?'Server error - please try again':e.message)});
function toast(m,bad){const t=$('#toast');t.textContent=m;t.className=bad?'bad':'';t.style.display='block';clearTimeout(t._t);t._t=setTimeout(()=>t.style.display='none',3500)}
const html=h=>$('#main').innerHTML=h;
const photoUrl=id=>'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1000';
async function act(fn,ok){try{await fn();if(ok)toast(ok)}catch(e){toast(e.message,1)}}
function nav(){
  const u=S.user, h=`<a onclick="home()">Home</a><a onclick="go('shop')">Plans</a>`, aa=`<a onclick="togglePrefs()" title="Theme and font">Aa</a>`;
  $('#nav').innerHTML=u?h+`<a onclick="go('library')">My Library</a><a onclick="go('mine')">My Requests</a>`+(u.role==='Admin'?`<a onclick="go('admin','requests')">Admin</a>`:'')+
    `<span class="who">${esc(u.name)} · ${esc(u.id)}</span><button class="sm" onclick="logout()">Logout</button>`+aa
    :h+`<a onclick="go('auth','login')">Login</a><a onclick="go('auth','register')">Register</a>`+aa;
}
async function boot(){
  applyPrefs();
  try{const r=await api('me');S.user=r.user;S.pay=r.pay;S.url=r.url;S.optin=r.optin;if(!r.user){S.token='';lsSet('pt','')}}catch(e){}
  try{S.folders=await api('folders')}catch(e){}
  nav();START?go('post',START):go('home');
}
async function go(view,arg){
  html('<p class="muted">Loading…</p>');
  try{await V[view](arg)}catch(e){html('<div class="card">'+esc(e.message)+'</div>')}
  window.scrollTo(0,0);
}
async function logout(){await api('logout').catch(()=>{});S.token='';S.user=null;lsSet('pt','');nav();home()}

/* ---- reader preferences (per device): theme, font, size ---- */
const FONTS={'Default':[['Default (current)','']],'বাংলা':[['SolaimanLipi',"'SolaimanLipi',Georgia,serif"],['Kalpurush',"'Kalpurush',Georgia,serif"],['Nikosh',"'Nikosh',Georgia,serif"]],
 'English':[['Times New Roman',"'Times New Roman',Times,serif"],['Arial','Arial,Helvetica,sans-serif'],['Verdana','Verdana,sans-serif'],['Georgia','Georgia,serif'],['Merriweather',"'Merriweather',serif"],['Lora',"'Lora',serif"],['Open Sans',"'Open Sans',sans-serif"]]};
const prefs=()=>{try{return JSON.parse(localStorage.getItem('ppref'))||{}}catch(e){return {}}};
function applyPrefs(){const p=prefs(),r=document.documentElement;
  r.setAttribute('data-theme',p.th||'light');r.style.setProperty('--fs',(p.fs||18)+'px');
  r.style.setProperty('--ff',p.ff||"Georgia,'Segoe UI',serif")}
function setPref(){const p={th:v('pf_th'),ff:v('pf_ff'),fs:v('pf_fs')};
  try{localStorage.setItem('ppref',JSON.stringify(p))}catch(e){}applyPrefs();$('#pf_v').textContent=p.fs+'px'}
function togglePrefs(){const b=$('#prefs');if(b.style.display!=='none'){b.style.display='none';return}
  const p=prefs();$('#pf_ff').innerHTML=Object.keys(FONTS).map(g=>`<optgroup label="${g}">`+FONTS[g].map(f=>`<option value="${esc(f[1])}">${f[0]}</option>`).join('')+'</optgroup>').join('');
  $('#pf_th').value=p.th||'light';$('#pf_ff').value=p.ff||'';$('#pf_fs').value=p.fs||18;$('#pf_v').textContent=(p.fs||18)+'px';b.style.display='block'}
