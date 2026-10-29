/* ===== CHUNK 9: CLIENT SHOP (payment, plans), LIBRARY, FORMATTING, SHARE ===== */
function fmt(t){ // **bold**  *italic*  __underline__  # big heading  ## heading ; line breaks stay exactly as typed
  const span=(o,c)=>new RegExp(o+'(?=[^\\s'+c+'])((?:(?!\\n[ \\t]*\\n)[^'+c+'])+?)'+o,'g'); // may cover several lines, never crosses a blank line
  const h=esc(t).split('\n').map(l=>/^## /.test(l)?'<h3>'+l.slice(3)+'</h3>':/^# /.test(l)?'<h2>'+l.slice(2)+'</h2>':l).join('\n');
  return h.replace(span('\\*\\*','*'),'<b>$1</b>').replace(span('__','_'),'<u>$1</u>').replace(span('\\*','*'),'<i>$1</i>').replace(/(<\/h[23]>)\n/g,'$1');
}
function payBox(t,id,price){
  return `<div class="card"><h3>Pay ৳${esc(price)}</h3><p class="muted">Your ID: <b>${esc(S.user.id)}</b> · Choose how you paid:</p>
   <div class="chips">${['bKash','Nagad','Rocket'].map(m=>`<a id="m_${m}" onclick="pickPay('${m}')">${m}</a>`).join('')}</div>
   <div id="pnum" class="muted">Select a method to see the number.</div><br>
   <label>Transaction ID</label><input id="trx" maxlength="20" autocomplete="off">
   <label>Last 4 digits of the number you paid from</label><input id="l4" maxlength="4" inputmode="numeric" autocomplete="off">
   <label>Amount sent (৳)</label><input id="snt" type="number" min="1" value="${esc(price)}">
   <button onclick="sendReq('${t}','${esc(id)}')">Submit request</button></div>`;
}
function pickPay(m){
  S.pm=m; document.querySelectorAll('[id^=m_]').forEach(e=>e.classList.remove('on')); $('#m_'+m).classList.add('on');
  $('#pnum').innerHTML='Send Money to <b>'+esc((S.pay||{})[m])+'</b> ('+m+'), then fill the form below.';
}
function sendReq(t,id){act(async()=>{
  await api('requestAccess',{[t]:id,method:S.pm||'',trx:v('trx'),last4:v('l4'),sent:v('snt')});
  t==='postId'?go('post',id):go('mine');
},'Request sent')}
V.shop=async function(){
  const r=await api('products');
  html('<h2>Plans and Bundles</h2>'+(r.length?r.map(x=>`<div class="card"><h3>${esc(x.name)}</h3>
   <div class="meta"><span class="tag">৳${esc(x.price)}</span>${x.days?x.days+' days access':'Lifetime access'} · ${x.count} writing(s) included</div><p>${esc(x.desc)}</p>
   ${x.status==='Active'?`<span class="tag unl">Active${x.until?' until '+esc(x.until):''}</span>`:x.status==='Pending'?'<span class="tag">Request pending</span>':`<button onclick="go('buy','${esc(x.id)}')">Buy</button>`}</div>`).join(''):'<p class="muted">No plans yet.</p>'));
};
V.buy=async function(id){
  if(!S.user){S.next='';return go('auth','login')}
  const x=(await api('products')).find(y=>y.id===id); if(!x) throw new Error('Plan not found');
  html(`<div class="card"><h2>${esc(x.name)}</h2><p>${esc(x.desc)}<br>${x.days?x.days+' days access':'Lifetime access'} · ৳${esc(x.price)}</p></div>`+payBox('productId',x.id,x.price));
};
V.library=async function(){
  const r=await api('library'), li=a=>a.length?a.map(x=>`<div class="card"><a class="lnk" onclick="go('post','${esc(x.id)}')"><b>${esc(x.title)}</b></a> <span class="meta">${esc(x.id)}</span></div>`).join(''):'<p class="muted">Nothing yet.</p>';
  html(`<h2>My Library</h2><label><input type="checkbox" ${S.optin?'checked':''} onchange="act(async()=>{await api('setOptin',{on:this.checked});S.optin=this.checked},'Saved')"> Email me when new writings are published</label>
   <h3>Continue reading</h3>${li(r.history)}<h3>Bookmarks</h3>${li(r.bookmarks)}`);
};
const bm=id=>act(async()=>{await api('toggleBookmark',{id});go('post',id)});
function share(id){const l=location.href.split('#')[0].split('?')[0]+'?p='+id;
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(l).then(()=>toast('Link copied'),()=>prompt('Copy this link',l));else prompt('Copy this link',l)}
