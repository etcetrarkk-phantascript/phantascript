/* ===== CHUNK 7: CLIENT VIEWS (timeline, post, auth, my requests) ===== */
const tagOf=p=>p.type!=='Paid'?'<span class="tag free">Free</span>':(p.access&&S.user&&S.user.role!=='Admin'?'<span class="tag unl">Unlocked</span>':'<span class="tag">Paid ৳'+esc(p.price)+'</span>');
function flt(c){S.f=Object.assign({},S.f,{page:1},c);go('home')}
const home=()=>{S.f={};go('home')};
const doSearch=()=>flt({q:v('q').trim(),folder:'',tag:'',type:''});
V.home=async function(){
  const f=S.f||{}, r=await api('listPosts',f), on=x=>(f.folder||'')===x?'on':'';
  const opt=(k,a)=>`<select onchange="flt({${k}:this.value})">`+a.map(o=>`<option value="${o[0]}" ${(f[k]||'')===o[0]?'selected':''}>${o[1]}</option>`).join('')+'</select>';
  const chips=`<div class="chips"><a class="${on('')}" onclick="flt({folder:''})">All</a><a class="${on('TOP')}" onclick="flt({folder:'TOP',sort:''})">🔥 Most Requested</a>`+
    S.folders.map(x=>`<a class="${on(x.id)}" onclick="flt({folder:'${esc(x.id)}'})">${esc(x.name)}</a>`).join('')+'</div>';
  const bar=`<div class="filters">${opt('type',[['','All types'],['Free','Free'],['Paid','Paid'],['Unlocked','Unlocked (mine)']])}${opt('sort',[['','Newest'],['old','Oldest'],['pop','Most requested'],['az','Title A–Z']])}</div>`;
  const tg=r.tags.length?'<div class="tags">Tags: '+r.tags.map(t=>`<a onclick="flt({tag:'${esc(t)}'})"${f.tag===t?' style="font-weight:bold"':''}>#${esc(t)}</a>`).join('')+'</div>':'';
  const st=(f.q||f.tag)?`<p class="muted">Showing ${r.total} result(s) for ${f.q?'“'+esc(f.q)+'” ':''}${f.tag?'#'+esc(f.tag):''} · <a class="lnk" onclick="home()">clear</a></p>`:`<p class="muted">${r.total} writing(s)</p>`;
  const cr=(!f.q&&!f.tag&&!f.folder&&r.last)?`<p>📖 Continue reading: <a class="lnk" onclick="go('post','${esc(r.last.id)}')">${esc(r.last.title)}</a></p>`:'';
  const pg=r.pages>1?`<div class="pager"><button class="sm alt" ${r.page<2?'disabled':''} onclick="flt({page:${r.page-1}})">‹ Prev</button> &nbsp;Page ${r.page} of ${r.pages}&nbsp; <button class="sm alt" ${r.page>=r.pages?'disabled':''} onclick="flt({page:${r.page+1}})">Next ›</button></div>`:'';
  html(cr+chips+bar+tg+st+(r.items.length?r.items.map(p=>`
   <div class="card post" onclick="go('post','${esc(p.id)}')">
     ${p.photo?`<img src="${photoUrl(p.photo)}" alt="" loading="lazy">`:''}
     <div><h3>${esc(p.title)}</h3>
     <div class="meta">${tagOf(p)}${f.folder==='TOP'?`<span class="tag">🔥 ${p.count}</span>`:''}${p.status==='Draft'?'<span class="tag">Draft</span>':''}${esc(p.id)} · ${esc(p.date)}</div>
     <p>${esc(p.preview)}</p></div></div>`).join('')+pg:'<p class="muted">Nothing found.</p>'));
};
V.post=async function(id){
  const p=await api('getPost',{id}); let gate='';
  if(!p.access){
    if(!S.user){S.next=id;gate=`<div class="card"><b>Login or register to read this.</b><br><br><button onclick="go('auth','login')">Login</button> <button class="alt" onclick="go('auth','register')">Register</button></div>`}
    else if(p.reqStatus==='Pending') gate='<div class="card">Your payment request is <b>pending</b> verification. You will get an email once approved.</div>';
    else gate=payBox('postId',p.id,p.price)+(p.offers.length?`<div class="card"><h3>Or save with a bundle / plan</h3>`+p.offers.map(o=>`<p><a class="lnk" onclick="go('plan','${esc(o.id)}')"><b>${esc(o.name)}</b></a> · ৳${esc(o.price)} · ${o.days?o.days+' days':'lifetime'} <button class="sm" onclick="go('buy','${esc(o.id)}')">Buy</button></p>`).join('')+'</div>':'');
  }
  const L=x=>`<a class="lnk" onclick="go('post','${esc(x.id)}')">${esc(x.title)}</a>`;
  const nv=(p.prev||p.next)?`<div class="card"><b>Series: ${esc(p.series)}</b><br>${p.prev?'← '+L(p.prev):''}${p.prev&&p.next?' &nbsp;|&nbsp; ':''}${p.next?L(p.next)+' →':''}</div>`:'';
  const rl=p.related.length?`<div class="card"><h3>Related writings</h3>${p.related.map(x=>'<div>'+L(x)+'</div>').join('')}</div>`:'';
  html(`<div class="card"><a class="muted" style="cursor:pointer" onclick="go('home')">← Back</a>
    ${p.photo?`<img class="hero" src="${photoUrl(p.photo)}" alt="">`:''}
    <h2>${esc(p.title)}</h2><div class="meta">${tagOf(p)}${esc(p.id)} · ${esc(p.date)}</div>
    <div class="tags">${p.tags.split(',').filter(Boolean).map(t=>`<a onclick="S.f={tag:'${esc(t)}'};go('home')">#${esc(t)}</a>`).join('')}</div>
    <button class="sm alt" onclick="share('${esc(p.id)}')">🔗 Copy link</button>${S.user?` <button class="sm alt" onclick="bm('${esc(p.id)}')">${p.bookmarked?'★ Saved':'☆ Save'}</button>`:''}<br><br>
    <div class="body">${p.access?fmt(p.body):esc(p.preview)}</div></div>${gate}${nv}${rl}`);
};
V.mine=async function(){
  const r=await api('myRequests');
  html('<h2>My Requests</h2>'+(r.length?'<div style="overflow-x:auto"><table><tr><th>ID</th><th>For</th><th>Method</th><th>Paid ৳</th><th>Trx</th><th>Status</th><th>Requested</th><th>Decided</th><th>Access</th></tr>'+
    r.map(x=>`<tr><td>${esc(x.id)}</td><td>${x.postId?`<a class="lnk" onclick="go('post','${esc(x.postId)}')">${esc(x.postId)} ${esc(x.title)}</a>`:esc(x.productId+' '+x.title)}</td><td>${esc(x.method)}</td><td>${esc(x.amount)}</td><td>${esc(x.trx)}</td><td>${esc(x.status)}</td><td>${esc(x.date)}</td><td>${esc(x.decided||'—')}</td><td>${esc(x.until||'—')}</td></tr>`).join('')+'</table></div>':'<p class="muted">No requests yet.</p>'));
};
V.auth=async function(mode){
  const T={login:'Login',register:'Register',verify:'Verify Email',forgot:'Forgot Password',reset:'Reset Password'};
  const F={email:'<label>Email</label><input id="em" type="email" autocomplete="email">',
    name:'<label>Name</label><input id="nm" maxlength="60">',
    pw:'<label>Password (min 8)</label><input id="pw" type="password" autocomplete="current-password">',
    code:'<label>6-digit code from email</label><input id="cd" maxlength="6" inputmode="numeric">',
    opt:'<label><input type="checkbox" id="op" checked> Email me when new writings are published</label><br><br>'};
  const body={login:F.email+F.pw,register:F.name+F.email+F.pw+F.opt,verify:F.email+F.code,forgot:F.email,reset:F.email+F.code+F.pw}[mode];
  const links={login:`<a onclick="go('auth','forgot')">Forgot password?</a> · <a onclick="go('auth','register')">Create account</a>`,
    register:`<a onclick="go('auth','login')">Have an account? Login</a>`,verify:'',forgot:`<a onclick="go('auth','login')">Back to login</a>`,reset:''};
  html(`<div class="card form"><h2>${T[mode]}</h2>${body}<button onclick="submitAuth('${mode}')">${T[mode]}</button><p class="meta" style="cursor:pointer">${links[mode]}</p></div>`);
};
function submitAuth(m){
  const g=i=>document.getElementById(i)?v(i):'', p={email:g('em'),name:g('nm'),password:g('pw'),code:g('cd'),optin:!!(document.getElementById('op')||{}).checked};
  act(async()=>{
    if(m==='login'){const r=await api('login',p);S.token=r.token;S.user=r.user;lsSet('pt',r.token);const me=await api('me');S.pay=me.pay;S.optin=me.optin;nav();const n=S.next;S.next='';n?go('post',n):go('home')}
    else if(m==='register'){await api('register',p);toast('Code sent to your email');go('auth','verify')}
    else if(m==='verify'){await api('verify',p);toast('Verified! Please login');go('auth','login')}
    else if(m==='forgot'){await api('forgot',p);toast('If the account exists, a code was sent');go('auth','reset')}
    else{await api('reset',p);toast('Password changed. Please login');go('auth','login')}
  });
}
