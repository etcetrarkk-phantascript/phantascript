/* ===== CHUNK 10: CLIENT ADMIN 2 (dashboard, bundles & plans) ===== */
const tbl=(h,rows)=>`<div style="overflow-x:auto"><table><tr>${h.map(x=>'<th>'+x+'</th>').join('')}</tr>${rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')}</table></div>`;
async function adminDash(head){
  const d=await api('dashboard');
  html(head+`<div class="card"><b>Total income ৳${esc(d.total.income)}</b> · ${esc(d.total.reqs)} approved requests · ${esc(d.total.views)} reader views</div>
   <h3>By month</h3>${tbl(['Month','Views','Approved','Income ৳'],d.months.map(m=>[m.month,m.views,m.reqs,m.income]))}
   <h3>By folder (topic)</h3>${tbl(['Folder','Views','Requests','Income ৳'],d.folders.map(m=>[m.name,m.views,m.reqs,m.income]))}
   <h3>Top writings</h3>${tbl(['ID','Title','Views','Requests','Income ৳'],d.posts.map(m=>[m.id,m.title,m.views,m.reqs,m.income]))}
   <h3>Bundles and plans</h3>${tbl(['ID','Name','Requests','Income ৳'],d.products.map(m=>[m.id,m.name,m.reqs,m.income]))}`);
}
async function adminProducts(head,edit){
  const ps=await api('products',{all:1}), e=edit?ps.find(x=>x.id===edit):null;
  const x=e||{id:'',name:'',kind:'Plan',ref:'',price:0,days:30,active:'Y'};
  html(head+`<div class="card"><h3>${e?'Edit '+esc(e.id):'New bundle / plan'}</h3>
   <label>Name</label><input id="bn" maxlength="60" value="${esc(x.name)}">
   <label>Kind</label><select id="bk">${['Folder','Series','Custom','Plan'].map(k=>`<option ${x.kind===k?'selected':''}>${k}</option>`).join('')}</select>
   <label>Reference</label><input id="br" value="${esc(x.ref)}">
   <div class="muted" style="margin-bottom:12px;font-size:13px">Folder → folder ID (${esc(S.folders.map(f=>f.id+'='+f.name).join(', ')||'none yet')}) · Series → exact series name · Custom → content IDs like C0001, C0005 · Plan → highest included price (0 = all paid)</div>
   <label>Price (৳)</label><input id="bp" type="number" min="0" value="${esc(x.price)}">
   <label>Access days (30 = monthly pass, 0 = lifetime)</label><input id="bd" type="number" min="0" value="${esc(x.days)}">
   <label>Active (visible to readers)</label><select id="ba"><option value="Y" ${x.active!=='N'?'selected':''}>Yes</option><option value="N" ${x.active==='N'?'selected':''}>No</option></select>
   <button onclick="act(async()=>{await api('saveProduct',{id:'${esc(x.id)}',name:v('bn'),kind:v('bk'),ref:v('br'),price:v('bp'),days:v('bd'),active:v('ba')});go('admin','products')},'Saved')">Save</button>
   ${ps.some(p=>p.kind==='Plan')?'':`<button class="alt" onclick="act(async()=>{await api('seedPlans');go('admin','products')},'Created Basic / Plus / Ultra')">Create Basic / Plus / Ultra plans</button>`}</div>`+
   ps.map(p=>`<div class="card"><b>${esc(p.id)}</b> ${esc(p.name)} · ৳${esc(p.price)} · ${p.days?p.days+' days':'lifetime'} · ${esc(p.kind)}${p.active==='N'?' · <i>hidden</i>':''}<br><span class="muted">${esc(p.desc)} · ${p.count} writing(s)</span><br>
    <button class="sm" onclick="adminProducts('<h2>Admin</h2>'+adminTabs('products'),'${esc(p.id)}')">Edit</button>
    <button class="sm alt" onclick="confirm('Delete ${esc(p.id)}?')&&act(async()=>{await api('deleteProduct',{id:'${esc(p.id)}'});go('admin','products')},'Deleted')">Delete</button></div>`).join(''));
}
