(()=>{
const clone=v=>JSON.parse(JSON.stringify(v));
const safe=(v)=>String(v??"");
function mergeRows(current,defaults){
 const out=Array.isArray(current)?clone(current):[],seen=new Set(out.map(x=>JSON.stringify(x)));
 (defaults||[]).forEach(x=>{const k=JSON.stringify(x);if(!seen.has(k)){out.push(clone(x));seen.add(k);}});
 return out;
}
function loadState(mod,store){
 const key="odontologia-academic-"+mod.id+"-v2",oldKey="odontologia-academic-"+mod.id+"-v1";
 const hasV2=!!store.getItem(key),source=hasV2?store.getItem(key):store.getItem(oldKey);
 let st={tables:{},checks:{},customChecks:{},notes:{},kanban:{},grades:{},attendance:{},hours:{}};
 try{st=Object.assign(st,JSON.parse(source||"{}"));}catch(e){}
 st.tables=st.tables||{};st.checks=st.checks||{};st.customChecks=st.customChecks||{};st.notes=st.notes||{};st.kanban=st.kanban||{};st.grades=st.grades||{};st.attendance=st.attendance||{};st.hours=st.hours||{};
 for(const s of mod.sections||[]){
  if(s.type==="table")st.tables[s.id]=hasV2&&Array.isArray(st.tables[s.id])?st.tables[s.id]:mergeRows(st.tables[s.id],s.rows||[]);
  if(s.type==="checklist"){if(!st.checks[s.id])st.checks[s.id]={};if(!Array.isArray(st.customChecks[s.id]))st.customChecks[s.id]=[];}
  if(s.type==="notes"&&typeof st.notes[s.id]!=="string")st.notes[s.id]=s.seed||"";
  if(s.type==="kanban")st.kanban[s.id]=hasV2&&Array.isArray(st.kanban[s.id])?st.kanban[s.id]:mergeRows(st.kanban[s.id],s.cards||[]);
  if(s.type==="gradebook")st.grades[s.id]=hasV2&&Array.isArray(st.grades[s.id])?st.grades[s.id]:mergeRows(st.grades[s.id],s.rows||[]);
  if(s.type==="attendance")st.attendance[s.id]=hasV2&&Array.isArray(st.attendance[s.id])?st.attendance[s.id]:mergeRows(st.attendance[s.id],s.rows||[]);
  if(s.type==="hours")st.hours[s.id]=hasV2&&Array.isArray(st.hours[s.id])?st.hours[s.id]:mergeRows(st.hours[s.id],s.rows||[]);
 }
 if(!hasV2)store.setItem(key,JSON.stringify(st));
 return {key,st};
}
function save(store,key,st){store.setItem(key,JSON.stringify(st));}
function toneClass(v){return "tool-tone-"+(v||"green");}
function renderCards(s,esc){
 return '<section class="tool-section tool-cards-section" id="'+s.id+'"><div class="tool-section-head"><div><span>PAINEL ACADÊMICO</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc||"")+'</p></div></div><div class="tool-info-grid">'+(s.cards||[]).map((c,i)=>'<article class="tool-info-card info-shape-'+(i%4)+'"><span>'+esc(c.tag||"")+'</span><h3>'+esc(c.title)+'</h3><p>'+esc(c.text)+'</p></article>').join("")+'</div></section>';
}
function renderTimeline(s,esc){
 return '<section class="tool-section" id="'+s.id+'"><div class="tool-section-head"><div><span>FLUXO DE TRABALHO</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc||"")+'</p></div></div><div class="tool-timeline">'+(s.items||[]).map((x,i)=>'<article><div class="timeline-index">'+String(i+1).padStart(2,"0")+'</div><div><span>'+esc(x.label)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.text)+'</p></div></article>').join("")+'</div></section>';
}
function renderChecklist(s,st,esc){
 const checked=st.checks[s.id]||{},items=[...(s.items||[]),...(st.customChecks[s.id]||[])],done=items.filter(x=>checked[x.id]).length,pct=items.length?Math.round(done/items.length*100):0;
 return '<section class="tool-section tool-check-section" id="'+s.id+'"><div class="tool-section-head"><div><span>CHECKLIST EDITÁVEL</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc||"")+'</p></div><div class="tool-head-actions"><button class="tool-add-btn" data-add-check="'+s.id+'">+ item</button><div class="tool-progress"><b data-check-count="'+s.id+'">'+done+' / '+items.length+'</b><i><em data-check-bar="'+s.id+'" style="width:'+pct+'%"></em></i></div></div></div><div class="tool-checklist">'+items.map(x=>'<label class="tool-check '+(checked[x.id]?"checked":"")+'"><input type="checkbox" data-check="'+s.id+'" data-item="'+x.id+'" '+(checked[x.id]?"checked":"")+'><span class="check-box"></span><div><strong>'+esc(x.text)+'</strong><p>'+esc(x.detail||"")+'</p></div></label>').join("")+'</div></section>';
}
function renderTable(s,rows,esc){
 return '<section class="tool-section" id="'+s.id+'"><div class="tool-section-head"><div><span>TABELA EDITÁVEL</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc||"")+'</p></div><button class="tool-add-btn" data-add-table="'+s.id+'">+ adicionar linha</button></div><div class="tool-table-wrap"><table class="tool-table"><thead><tr>'+s.columns.map(c=>'<th>'+esc(c)+'</th>').join("")+'<th></th></tr></thead><tbody>'+rows.map((r,ri)=>'<tr>'+s.columns.map((c,ci)=>'<td><input value="'+esc(r[ci]||"")+'" data-table="'+s.id+'" data-row="'+ri+'" data-col="'+ci+'" aria-label="'+esc(c)+'"></td>').join("")+'<td><button class="row-delete" data-delete-table="'+s.id+'" data-row="'+ri+'" aria-label="Excluir linha">×</button></td></tr>').join("")+'</tbody></table></div></section>';
}
function renderNotes(s,st,esc){
 return '<section class="tool-section tool-notes-section" id="'+s.id+'"><div class="tool-section-head"><div><span>CADERNO PESSOAL</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.prompt||"")+'</p></div><span class="save-state">salva automaticamente</span></div><div class="tool-note-paper"><textarea data-note="'+s.id+'" spellcheck="true">'+esc(st.notes[s.id]||"")+'</textarea></div></section>';
}
function renderKanban(s,cards,esc){
 return '<section class="tool-section" id="'+s.id+'"><div class="tool-section-head"><div><span>QUADRO EDITÁVEL</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc||"")+'</p></div><button class="tool-add-btn" data-add-kanban="'+s.id+'">+ nova tarefa</button></div><div class="tool-kanban">'+s.columns.map((col,ci)=>'<div class="kanban-column kanban-tone-'+ci+'"><header><span>'+esc(col)+'</span><b>'+cards.filter(c=>c.status===col).length+'</b></header><div>'+cards.filter(c=>c.status===col).map(c=>{const real=cards.indexOf(c);return '<article class="kanban-card"><input class="kanban-tag" value="'+esc(c.tag||"TAREFA")+'" data-kanban-field="'+s.id+'" data-card="'+real+'" data-field="tag"><input class="kanban-title" value="'+esc(c.title)+'" data-kanban-field="'+s.id+'" data-card="'+real+'" data-field="title"><textarea data-kanban-field="'+s.id+'" data-card="'+real+'" data-field="detail">'+esc(c.detail||"")+'</textarea><select data-kanban-status="'+s.id+'" data-card="'+real+'">'+s.columns.map(x=>'<option '+(x===c.status?"selected":"")+'>'+esc(x)+'</option>').join("")+'</select><button data-delete-kanban="'+s.id+'" data-card="'+real+'">remover</button></article>';}).join("")+'</div></div>').join("")+'</div></section>';
}
function gradeAverage(rows){
 let num=0,den=0;for(const r of rows){const w=parseFloat(String(r.weight).replace(",", ".")),g=parseFloat(String(r.grade).replace(",", "."));if(Number.isFinite(w)&&Number.isFinite(g)){num+=w*g;den+=w;}}return den?num/den:null;
}
function renderGradebook(s,rows,esc){
 const avg=gradeAverage(rows);
 return '<section class="tool-section" id="'+s.id+'"><div class="tool-section-head"><div><span>NOTAS & PESOS</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc||"")+'</p></div><div class="grade-result"><small>MÉDIA PONDERADA DOS ITENS PREENCHIDOS</small><strong data-grade-result="'+s.id+'">'+(avg===null?"—":avg.toFixed(2).replace(".",","))+'</strong></div></div><div class="tool-table-wrap"><table class="tool-table grade-table"><thead><tr><th>Avaliação</th><th>Peso (%)</th><th>Nota</th><th>Status</th><th></th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><td><input value="'+esc(r.assessment||"")+'" data-grade="'+s.id+'" data-row="'+i+'" data-field="assessment"></td><td><input inputmode="decimal" value="'+esc(r.weight||"")+'" data-grade="'+s.id+'" data-row="'+i+'" data-field="weight"></td><td><input inputmode="decimal" value="'+esc(r.grade||"")+'" data-grade="'+s.id+'" data-row="'+i+'" data-field="grade"></td><td><input value="'+esc(r.status||"")+'" data-grade="'+s.id+'" data-row="'+i+'" data-field="status"></td><td><button class="row-delete" data-delete-grade="'+s.id+'" data-row="'+i+'">×</button></td></tr>').join("")+'</tbody></table></div><button class="tool-add-inline" data-add-grade="'+s.id+'">+ nova avaliação</button></section>';
}
function attendancePct(r){const total=parseFloat(r.total),abs=parseFloat(r.absences);return Number.isFinite(total)&&total>0&&Number.isFinite(abs)?Math.max(0,(total-abs)/total*100):null;}
function renderAttendance(s,rows,esc){
 return '<section class="tool-section" id="'+s.id+'"><div class="tool-section-head"><div><span>CONTROLE AUTOMÁTICO</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc||"")+'</p></div><button class="tool-add-btn" data-add-attendance="'+s.id+'">+ disciplina</button></div><div class="attendance-grid">'+rows.map((r,i)=>{const pct=attendancePct(r),min=parseFloat(r.minimum)||0,ok=pct!==null&&pct>=min;return '<article class="attendance-card '+(pct===null?"":ok?"safe":"risk")+'"><div class="attendance-top"><input class="attendance-name" value="'+esc(r.discipline||"")+'" data-attendance="'+s.id+'" data-row="'+i+'" data-field="discipline"><button data-delete-attendance="'+s.id+'" data-row="'+i+'">×</button></div><div class="attendance-meter"><i style="width:'+(pct===null?0:Math.min(100,pct))+'%"></i></div><strong>'+(pct===null?"—":pct.toFixed(1).replace(".",",")+"%")+'</strong><span>frequência atual</span><div class="attendance-fields"><label>Carga/aulas<input inputmode="numeric" value="'+esc(r.total||"")+'" data-attendance="'+s.id+'" data-row="'+i+'" data-field="total"></label><label>Faltas<input inputmode="numeric" value="'+esc(r.absences||"")+'" data-attendance="'+s.id+'" data-row="'+i+'" data-field="absences"></label><label>Mínimo %<input inputmode="numeric" value="'+esc(r.minimum||"")+'" data-attendance="'+s.id+'" data-row="'+i+'" data-field="minimum"></label></div><small>'+(pct===null?"Preencha os valores":ok?"Acima do mínimo informado":"Atenção: abaixo do mínimo informado")+'</small></article>';}).join("")+'</div></section>';
}
function renderHours(s,rows,esc){
 const totals=rows.reduce((a,r)=>{a.req+=parseFloat(r.required)||0;a.done+=parseFloat(r.completed)||0;return a;},{req:0,done:0}),pct=totals.req?Math.min(100,totals.done/totals.req*100):0;
 return '<section class="tool-section" id="'+s.id+'"><div class="tool-section-head"><div><span>HORAS COMPLEMENTARES</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc||"")+'</p></div><div class="hours-total"><strong>'+totals.done.toFixed(0)+'h</strong><span>de '+totals.req.toFixed(0)+'h cadastradas</span><i><em style="width:'+pct+'%"></em></i></div></div><div class="hours-grid">'+rows.map((r,i)=>{const req=parseFloat(r.required)||0,done=parseFloat(r.completed)||0,p=req?Math.min(100,done/req*100):0;return '<article><input class="hours-name" value="'+esc(r.category||"")+'" data-hours="'+s.id+'" data-row="'+i+'" data-field="category"><div class="hours-bar"><i style="width:'+p+'%"></i></div><div><label>Exigidas<input inputmode="numeric" value="'+esc(r.required||"")+'" data-hours="'+s.id+'" data-row="'+i+'" data-field="required"></label><label>Comprovadas<input inputmode="numeric" value="'+esc(r.completed||"")+'" data-hours="'+s.id+'" data-row="'+i+'" data-field="completed"></label></div><button data-delete-hours="'+s.id+'" data-row="'+i+'">remover</button></article>';}).join("")+'<button class="hours-add-card" data-add-hours="'+s.id+'">+ nova categoria</button></div></section>';
}
function renderModuleOverview(mod,st,esc){
 const notes={};const titleNotes={};
 const list=mod.overviewNotes||notes[mod.id]||[["organização","seu espaço do seu jeito"],["progresso","acompanhe o que está acontecendo"],["próximo passo","sempre saiba o que fazer agora"]];
 const heading=mod.overviewTitle||titleNotes[mod.id]||mod.title;
 const sections=mod.sections||[];
 return '<section class="module-command-center"><div class="module-paper-orb orb-a"></div><div class="module-paper-orb orb-b"></div><div class="module-tape mt-a"></div><div class="module-tape mt-b"></div><div class="module-command-head"><div><span>'+esc(mod.category||"MEU ESPAÇO ACADÊMICO")+'</span><h2>'+esc(heading)+'</h2><p>'+esc(mod.desc||"")+'</p></div><div class="module-command-badge"><strong>'+sections.length+'</strong><span>ferramentas prontas</span><em>editáveis</em></div></div><div class="module-note-strip">'+list.map((x,i)=>'<article class="module-mini-note note-'+i+'"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></article>').join("")+'</div><div class="module-tool-grid">'+sections.map((s,i)=>'<button data-scroll-tool="'+s.id+'" class="module-tool-card card-'+(i%7)+'"><span>'+sectionIcon(s.type)+'</span><div><small>'+esc(({table:"TABELA",checklist:"CHECKLIST",cards:"PAINEL",timeline:"FLUXO",notes:"ANOTAÇÕES",kanban:"QUADRO",gradebook:"NOTAS",attendance:"FREQUÊNCIA",hours:"HORAS"})[s.type]||"FERRAMENTA")+'</small><h3>'+esc(s.title)+'</h3><p>'+esc(s.desc||s.prompt||"Abra esta ferramenta e personalize com a sua rotina.")+'</p></div></button>').join("")+'</div></section>';
}
function renderTccOverview(mod,st,esc){
 const groups=[...new Set((mod.sections||[]).map(s=>s.group).filter(Boolean))];
 const descriptions={
  "Visão geral e pergunta":"Da ideia inicial à pergunta, objetivos e hipóteses.",
  "Busca e evidências":"Descritores, bases, triagem, fichamento e leitura crítica.",
  "Registro e protocolo":"Método, coerência, variáveis, amostra e instrumentos.",
  "Coleta e gestão de dados":"Coleta, banco, versionamento e qualidade.",
  "Plano de análise":"Estratégia estatística, pressupostos e análise qualitativa.",
  "Ética e proteção de participantes":"Procedimentos de pesquisa, consentimento quando aplicável e organização das fontes.",
  "Gestão do projeto":"Cronograma, pendências, decisões, documentos e orientação.",
  "Escrita científica":"Introdução, resultados, discussão, figuras e integridade.",
  "Defesa, submissão e continuidade":"Banca, slides, submissão, produtos e encerramento."
 };
 const stageIcons=["✦","⌕","⌬","▦","∑","♡","✓","✎","☆"];
 let total=0,done=0;
 (mod.sections||[]).filter(s=>s.type==="checklist").forEach(s=>{const all=[...(s.items||[]),...(st.customChecks?.[s.id]||[])];total+=all.length;done+=all.filter(i=>st.checks?.[s.id]?.[i.id]).length;});
 const pct=total?Math.round(done/total*100):0;
 return '<section class="tcc-command-center"><div class="tcc-paper-dot dot-one"></div><div class="tcc-paper-dot dot-two"></div><div class="tcc-tape tape-a"></div><div class="tcc-tape tape-b"></div><div class="tcc-command-head"><div><span>PAINEL DO PROJETO</span><h2>Seu TCC inteiro em um só lugar</h2><p>Use as etapas abaixo para navegar. Todo o projeto-exemplo já está preenchido e pode ser substituído pelo seu próprio trabalho.</p></div><div class="tcc-overall-progress"><strong>'+pct+'%</strong><span>checklists concluídos</span><i><em style="width:'+pct+'%"></em></i></div></div><div class="tcc-creative-strip"><article class="tcc-mini-note pink"><b>tema</b><span>uma boa pergunta nasce de um recorte claro</span></article><article class="tcc-mini-note blue"><b>método</b><span>cada objetivo precisa de uma forma de resposta</span></article><article class="tcc-mini-note green"><b>dados</b><span>organizar antes de analisar</span></article><article class="tcc-mini-note yellow"><b>escrita</b><span>o texto cresce junto com o projeto</span></article></div><div class="tcc-seodontologia-wrap"><span>⌕</span><input type="search" data-tool-search placeholder="Buscar ferramenta do TCC..."><small>Busque por método, artigos, ética, dados, escrita, banca...</small></div><div class="tcc-stage-grid">'+groups.map((g,i)=>{const secs=(mod.sections||[]).filter(s=>s.group===g),first=secs[0]?.id||"";return '<button data-scroll-tool="'+first+'" class="tcc-stage-card stage-'+i+'"><span>'+stageIcons[i]+'</span><div><small>ETAPA '+String(i+1).padStart(2,"0")+'</small><h3>'+esc(g)+'</h3><p>'+esc(descriptions[g]||"Ferramentas desta etapa do projeto.")+'</p><em>'+secs.length+' ferramentas</em></div></button>';}).join("")+'</div></section>';
}
function renderConnectedLinks(s,esc){
 const items=Array.isArray(s.links)?s.links:[];
 const safeTarget=t=>{const v=String(t||"");return /^(module\/[a-zA-Z0-9_À-ÿ-]+|subject\/[a-zA-Z0-9_-]+|summary\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)$/.test(v)?"#"+v:"#home";};
 return '<section class="tool-section tool-connected-section" id="'+esc(s.id)+'"><div class="tool-section-head"><div><span>CONEXÕES DO CADERNO</span><h2>'+esc(s.title)+'</h2><p>'+esc(s.desc||"Trilhas complementares conectadas a outros módulos acadêmicos.")+'</p></div></div><div class="tool-connected-grid">'+items.map((x,i)=>'<a class="tool-connected-card card-'+(i%4)+'" href="'+esc(safeTarget(x.target))+'"><small>'+esc(x.tag||"ÁREA INTEGRADA")+'</small><strong>'+esc(x.title)+'</strong><p>'+esc(x.desc||"Continue neste conteúdo.")+'</p><span>Abrir conteúdo →</span></a>').join("")+'</div></section>';
}
function renderSection(s,st,esc){
 if(s.type==="links")return renderConnectedLinks(s,esc);
 if(s.type==="cards")return renderCards(s,esc);
 if(s.type==="timeline")return renderTimeline(s,esc);
 if(s.type==="checklist")return renderChecklist(s,st,esc);
 if(s.type==="table")return renderTable(s,st.tables[s.id]||[],esc);
 if(s.type==="notes")return renderNotes(s,st,esc);
 if(s.type==="kanban")return renderKanban(s,st.kanban[s.id]||[],esc);
 if(s.type==="gradebook")return renderGradebook(s,st.grades[s.id]||[],esc);
 if(s.type==="attendance")return renderAttendance(s,st.attendance[s.id]||[],esc);
 if(s.type==="hours")return renderHours(s,st.hours[s.id]||[],esc);
 return "";
}
function sectionIcon(type){return ({table:"▦",checklist:"✓",cards:"✦",timeline:"↻",notes:"✎",kanban:"▤",gradebook:"∑",attendance:"✓",hours:"◷",links:"↗"})[type]||"•";}
function bind({mod,app,store,key,st,esc,rerender}){
 app.querySelectorAll("[data-scroll-tool]").forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scrollTool)?.scrollIntoView({behavior:"smooth",block:"start"}));
 const search=app.querySelector("[data-tool-search]");if(search)search.oninput=()=>{const q=search.value.trim().toLowerCase();app.querySelectorAll(".academic-tool-sidebar nav button").forEach(b=>{b.style.display=!q||b.textContent.toLowerCase().includes(q)?"":"none";});app.querySelectorAll(".tool-nav-group-label").forEach(g=>{let n=g.nextElementSibling,visible=false;while(n&&!n.classList.contains("tool-nav-group-label")){if(n.tagName==="BUTTON"&&n.style.display!=="none")visible=true;n=n.nextElementSibling;}g.style.display=visible||!q?"":"none";});};
 app.querySelectorAll("[data-check]").forEach(x=>x.onchange=()=>{const sid=x.dataset.check,item=x.dataset.item;st.checks[sid]=st.checks[sid]||{};st.checks[sid][item]=x.checked;save(store,key,st);const sec=mod.sections.find(s=>s.id===sid),all=[...(sec.items||[]),...(st.customChecks[sid]||[])],done=all.filter(i=>st.checks[sid][i.id]).length,pct=all.length?Math.round(done/all.length*100):0;const count=app.querySelector('[data-check-count="'+sid+'"]'),bar=app.querySelector('[data-check-bar="'+sid+'"]');if(count)count.textContent=done+" / "+all.length;if(bar)bar.style.width=pct+"%";x.closest(".tool-check")?.classList.toggle("checked",x.checked);});
 app.querySelectorAll("[data-add-check]").forEach(b=>b.onclick=()=>{const sid=b.dataset.addCheck,text=prompt("Novo item do checklist:");if(!text)return;const detail=prompt("Detalhe ou observação:")||"";st.customChecks[sid]=st.customChecks[sid]||[];st.customChecks[sid].push({id:"custom-"+Date.now(),text,detail});save(store,key,st);rerender();});
 app.querySelectorAll("[data-note]").forEach(x=>x.oninput=()=>{st.notes[x.dataset.note]=x.value;save(store,key,st);});
 app.querySelectorAll("[data-table]").forEach(x=>x.onchange=()=>{st.tables[x.dataset.table][+x.dataset.row][+x.dataset.col]=x.value;save(store,key,st);});
 app.querySelectorAll("[data-add-table]").forEach(b=>b.onclick=()=>{const sid=b.dataset.addTable,sec=mod.sections.find(s=>s.id===sid);st.tables[sid].push(sec.columns.map(()=>''));save(store,key,st);rerender();});
 app.querySelectorAll("[data-delete-table]").forEach(b=>b.onclick=()=>{st.tables[b.dataset.deleteTable].splice(+b.dataset.row,1);save(store,key,st);rerender();});
 app.querySelectorAll("[data-kanban-status]").forEach(x=>x.onchange=()=>{st.kanban[x.dataset.kanbanStatus][+x.dataset.card].status=x.value;save(store,key,st);rerender();});
 app.querySelectorAll("[data-kanban-field]").forEach(x=>x.onchange=()=>{st.kanban[x.dataset.kanbanField][+x.dataset.card][x.dataset.field]=x.value;save(store,key,st);});
 app.querySelectorAll("[data-add-kanban]").forEach(b=>b.onclick=()=>{const sid=b.dataset.addKanban,sec=mod.sections.find(s=>s.id===sid),title=prompt("Título da tarefa:");if(!title)return;const detail=prompt("Descrição breve:")||"";st.kanban[sid].push({title,detail,status:sec.columns[0],tag:"TAREFA"});save(store,key,st);rerender();});
 app.querySelectorAll("[data-delete-kanban]").forEach(b=>b.onclick=()=>{st.kanban[b.dataset.deleteKanban].splice(+b.dataset.card,1);save(store,key,st);rerender();});
 app.querySelectorAll("[data-grade]").forEach(x=>x.onchange=()=>{const sid=x.dataset.grade;st.grades[sid][+x.dataset.row][x.dataset.field]=x.value;save(store,key,st);const v=gradeAverage(st.grades[sid]),el=app.querySelector('[data-grade-result="'+sid+'"]');if(el)el.textContent=v===null?"—":v.toFixed(2).replace(".",",");});
 app.querySelectorAll("[data-add-grade]").forEach(b=>b.onclick=()=>{st.grades[b.dataset.addGrade].push({assessment:"",weight:"",grade:"",status:""});save(store,key,st);rerender();});
 app.querySelectorAll("[data-delete-grade]").forEach(b=>b.onclick=()=>{st.grades[b.dataset.deleteGrade].splice(+b.dataset.row,1);save(store,key,st);rerender();});
 app.querySelectorAll("[data-attendance]").forEach(x=>x.onchange=()=>{st.attendance[x.dataset.attendance][+x.dataset.row][x.dataset.field]=x.value;save(store,key,st);rerender();});
 app.querySelectorAll("[data-add-attendance]").forEach(b=>b.onclick=()=>{st.attendance[b.dataset.addAttendance].push({discipline:"Nova disciplina",total:"",absences:"0",minimum:"75"});save(store,key,st);rerender();});
 app.querySelectorAll("[data-delete-attendance]").forEach(b=>b.onclick=()=>{st.attendance[b.dataset.deleteAttendance].splice(+b.dataset.row,1);save(store,key,st);rerender();});
 app.querySelectorAll("[data-hours]").forEach(x=>x.onchange=()=>{st.hours[x.dataset.hours][+x.dataset.row][x.dataset.field]=x.value;save(store,key,st);rerender();});
 app.querySelectorAll("[data-add-hours]").forEach(b=>b.onclick=()=>{st.hours[b.dataset.addHours].push({category:"Nova categoria",required:"",completed:""});save(store,key,st);rerender();});
 app.querySelectorAll("[data-delete-hours]").forEach(b=>b.onclick=()=>{st.hours[b.dataset.deleteHours].splice(+b.dataset.row,1);save(store,key,st);rerender();});
 const reset=app.querySelector("[data-reset-module]");if(reset)reset.onclick=()=>{if(confirm("Restaurar o modelo original deste módulo? As alterações feitas aqui serão apagadas.")){store.removeItem(key);rerender();}};
}
window.ODONTO_ACADEMIC_UI={
 renderSectionInto({mod,section,app,store,esc,rerender}){
  const {key,st}=loadState(mod,store);
  app.innerHTML=renderSection(section,st,esc);
  bind({mod,app,store,key,st,esc,rerender});
 },
 render({id,modules,app,esc,setCrumbs,store}){
  const mod=modules.find(m=>m.id===id);if(!mod)return false;
  const loaded=loadState(mod,store),st=loaded.st,key=loaded.key,v=mod.visual||{};
  setCrumbs(["Faculdade de Odontologia",mod.title]);
  let navGroup="";
  const nav=(mod.sections||[]).map(s=>{const group=s.group||"";const label=group&&group!==navGroup?'<div class="tool-nav-group-label">'+esc(group)+'</div>':"";navGroup=group;return label+'<button data-scroll-tool="'+s.id+'"><span>'+sectionIcon(s.type)+'</span>'+esc(s.title)+'</button>';}).join("");
  const isTcc=id==="tcc-pesquisa",isCreative=!isTcc;
  const catClass=mod.category==="Pesquisa & Produção Científica"?"reseodontologia-mvc-workspace":mod.category==="Estágios & Formação"?"clinical-mvc-workspace":mod.category==="Prática & Aprendizagem"?"residency-mvc-workspace":mod.category==="Pós-Graduação & Carreira"?"career-mvc-workspace":mod.category==="Vida Pessoal & Organização"?"personal-mvc-workspace":"";
  app.innerHTML='<section class="academic-tool-workspace '+toneClass(v.tone)+' '+(isTcc?"tcc-workspace":"creative-module-workspace module-"+id)+' '+catClass+'">'+
   '<aside class="academic-tool-sidebar"><a class="tool-back-home" href="#home">← Página principal</a>'+(isTcc?'<a class="tool-back-tcc" href="#module/tcc-pesquisa">← Voltar ao novo Estúdio de TCC</a>':"")+'<div class="tool-side-kicker">CADERNO DO ESTUDANTE</div><h2>'+esc(mod.title)+'</h2><div class="tool-side-script">'+esc(mod.hero?.script||"meu espaço acadêmico")+'</div><nav>'+nav+'</nav><div class="tool-side-note"><b>Seu espaço é editável</b><p>Tabelas, checklists, quadros e anotações ficam salvos neste Caderno para o seu uso acadêmico.</p></div><button class="tool-reset" data-reset-module>Restaurar modelo inicial</button></aside>'+
   '<div class="academic-tool-main">'+(catClass?'<div class="mvc-module-toolbar"><span>✦ '+esc(mod.category)+'</span><b>Workspace acadêmico</b><a href="#module/referencias">Biblioteca científica ↗</a><a href="#module/tcc-pesquisa">TCC Studio ↗</a></div>':'')+'<section class="academic-tool-hero"><div class="tool-hero-tape"></div><span class="tool-hero-label">'+esc(v.label||"MÓDULO ACADÊMICO")+'</span><h1>'+esc(mod.hero?.title||mod.title)+'</h1><em>'+esc(mod.hero?.script||"")+'</em><p>'+esc(mod.hero?.text||mod.desc)+'</p><div class="tool-hero-chips"><span>'+esc(v.note||"organizar · acompanhar · usar")+'</span><span>modelo preenchido</span><span>editável</span><span>salvo automaticamente</span></div><div class="tool-hero-icon">'+esc(v.icon||"✦")+'</div></section>'+
   (isTcc?renderTccOverview(mod,st,esc):renderModuleOverview(mod,st,esc))+
   (()=>{let last="";const groups=[...new Set((mod.sections||[]).map(x=>x.group).filter(Boolean))];return (mod.sections||[]).map((s,si)=>{const g=s.group||"",gi=isTcc?groups.indexOf(g):-1,head=g&&g!==last?'<section class="tool-group-divider '+(isTcc?"tcc-divider tcc-stage-"+gi:"")+'"><span>ETAPA DO PROJETO</span><h2>'+esc(g)+'</h2><em>'+(isTcc?String(gi+1).padStart(2,"0"):"")+'</em></section>':"";last=g;const body=renderSection(s,st,esc);if(isTcc)return head+'<div class="tcc-section-shell tcc-stage-'+gi+' tcc-shell-'+(si%4)+'">'+body+'</div>';return head+'<div class="creative-section-shell creative-shell-'+(si%7)+'">'+body+'</div>';}).join("");})()+
   '<footer class="tool-page-footer"><span>'+esc(mod.title)+'</span><b>Caderno do Estudante de Odontologia</b><em>organização acadêmica contínua</em></footer></div></section>';
  const rerender=()=>window.ODONTO_ACADEMIC_UI.render({id,modules,app,esc,setCrumbs,store});
  bind({mod,app,store,key,st,esc,rerender});
  return true;
 }
};
})();


