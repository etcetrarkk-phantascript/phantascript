/* ===== CHUNK 8: CLIENT ADMIN (requests, write/edit, folders) ===== */
const adminTabs=t=>`<div class="tabs">${['requests','posts','write','folders','products','dashboard'].map(x=>`<button class="${x===t?'':'alt'} sm" onclick="go('admin','${x}')">${x[0].toUpperCase()+x.slice(1)}</button>`).join(' ')}</div>`;
V.admin=async function(tab){
  tab=tab||'requests'; const head='<h2>Admin</h2>'+adminTabs(tab); if(tab==='dashboard')return adminDash(head); if(tab==='products')return adminProducts(head);
  if(tab==='requests'){
    const r=await api('adminRequests');
    html(head+'<div style="overflow-x:auto"><table><tr><th>Req</th><th>User</th><th>For</th><th>Expected ৳</th><th>Sent ৳ · method · from</th><th>Trx</th><th>Status</th><th>Requested<br>Decided</th><th></th></tr>'+
      r.map(x=>`<tr${x.mismatch&&x.status==='Pending'?' style="background:#ffd6d6;color:#600"':''}><td>${esc(x.id)}</td><td>${esc(x.userId)}<br>${esc(x.user)}</td><td>${esc(x.postId||x.productId)}<br>${esc(x.title)}</td><td>${esc(x.price)}</td><td>${esc(x.sent)}${x.mismatch?' <b>⚠ MISMATCH</b>':''}<br>${esc(x.method)} · ***${esc(x.last4)}</td><td>${esc(x.trx)}</td><td>${esc(x.status)}${x.until&&x.until!=='Lifetime'?'<br>till '+esc(x.until):''}</td><td>${esc(x.date)}<br>${esc(x.decided||'—')}</td>
      <td>${x.status==='Pending'?`<button class="sm" onclick="decide('${esc(x.id)}',true)">Approve</button> <button class="sm alt" onclick="decide('${esc(x.id)}',false)">Reject</button>`:''}</td></tr>`).join('')+'</table></div>');
  } else if(tab==='posts'){
    const p=(await api('listPosts',{size:100})).items;
    html(head+p.map(x=>`<div class="card"><b>${esc(x.id)}</b> ${esc(x.title)} <span class="meta">${esc(x.type)} · ${esc(x.status)}</span><br>
      <button class="sm" onclick="go('admin',{edit:'${esc(x.id)}'})">Edit</button> <button class="sm alt" onclick="delPost('${esc(x.id)}')">Delete</button></div>`).join('')||head);
  } else if(tab==='folders'){
    html(head+`<div class="card"><label>New folder</label><input id="fn" maxlength="40"><button onclick="act(async()=>{await api('saveFolder',{name:v('fn')});await refFolders();go('admin','folders')},'Folder created')">Create</button></div>`+
      S.folders.map(f=>`<div class="card">${esc(f.id)} · ${esc(f.name)} <button class="sm alt" onclick="delFolder('${esc(f.id)}')">Delete</button></div>`).join(''));
  } else writeForm(head,typeof tab==='object'?tab.edit:'');
};
async function writeForm(head,id){
  const p=id?await api('getPost',{id}):{title:'',tags:'',series:'',body:'',type:'Free',price:0,status:'Published',folders:'',photo:''};
  const sel=new Set(String(p.folders).split(','));
  html(head+`<div class="card"><label>Title</label><input id="t" maxlength="150" value="${esc(p.title)}">
   <label>Tags (comma separated, e.g. love, rain, nature)</label><input id="tg" maxlength="200" value="${esc(p.tags)}">
   <label>Series (optional; same name = serial story, ordered by publish date)</label><input id="se" maxlength="60" value="${esc(p.series)}">
   <label>Writing</label><div class="tb"><button class="sm alt" onclick="wrap('**','**')"><b>B</b></button> <button class="sm alt" onclick="wrap('*','*')"><i>I</i></button> <button class="sm alt" onclick="wrap('__','__')"><u>U</u></button> <button class="sm alt" onclick="wrap('## ','')">H</button> <span class="muted" style="font-size:12px">**bold** · *italic* · __underline__ · ## heading · line breaks stay as typed</span></div><textarea id="b" rows="14">${esc(p.body)}</textarea>
   <label>Photo (optional)</label><input id="ph" type="file" accept="image/jpeg,image/png,image/webp">
   ${p.photo?'<label><input type="checkbox" id="rp"> Remove current photo</label><br><br>':''}
   <label>Type</label><select id="ty" onchange="document.getElementById('pr').disabled=this.value!=='Paid'"><option ${p.type==='Free'?'selected':''}>Free</option><option ${p.type==='Paid'?'selected':''}>Paid</option></select>
   <label>Price (BDT)</label><input id="pr" type="number" min="0" value="${esc(p.price)}" ${p.type==='Paid'?'':'disabled'}>
   <label>Status</label><select id="st"><option ${p.status==='Published'?'selected':''}>Published</option><option ${p.status==='Draft'?'selected':''}>Draft</option></select>
   <label>Folders</label><div>${S.folders.map(f=>`<label><input type="checkbox" class="fc" value="${esc(f.id)}" ${sel.has(f.id)?'checked':''}> ${esc(f.name)}</label> &nbsp;`).join('')||'<span class="muted">No folders yet</span>'}</div><br>
   ${id?'':'<label><input type="checkbox" id="nt" checked> Email subscribers about this new writing</label><br><br>'}<button onclick="savePost('${esc(id)}')">Save</button></div>`);
}
async function savePost(id){
  act(async()=>{
    const f=document.getElementById('ph').files[0], photoData=f?await shrink(f):'';
    await api('savePost',{id,title:v('t'),tags:v('tg'),series:v('se'),notify:!!(document.getElementById('nt')||{}).checked,body:v('b'),type:v('ty'),price:v('pr'),status:v('st'),photoData,
      removePhoto:!!(document.getElementById('rp')||{}).checked,folders:[...document.querySelectorAll('.fc:checked')].map(c=>c.value)});
    go('admin','posts');
  },'Saved');
}
function shrink(file){ // resize to max 1000px JPEG to keep uploads small
  return new Promise((res,rej)=>{const r=new FileReader();r.onerror=()=>rej(new Error('Cannot read photo'));
    r.onload=()=>{const i=new Image();i.onerror=()=>rej(new Error('Bad image'));
      i.onload=()=>{const k=Math.min(1,1000/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;
        c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.82))};i.src=r.result};r.readAsDataURL(file)});
}
function wrap(a,b){const t=document.getElementById('b'),s=t.selectionStart,e=t.selectionEnd;t.value=t.value.slice(0,s)+a+t.value.slice(s,e)+b+t.value.slice(e);t.focus();t.selectionStart=s+a.length;t.selectionEnd=e+a.length}
const refFolders=async()=>S.folders=await api('folders');
const decide=(id,ok)=>act(async()=>{await api('decide',{id,ok});go('admin','requests')},ok?'Approved & emailed':'Rejected');
const delPost=id=>confirm('Delete '+id+'?')&&act(async()=>{await api('deletePost',{id});go('admin','posts')},'Deleted');
const delFolder=id=>confirm('Delete folder '+id+'? (writings are kept)')&&act(async()=>{await api('deleteFolder',{id});await refFolders();go('admin','folders')},'Deleted');
