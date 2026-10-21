(()=>{
const DB=window.ODONTO_SUMMARIES||[];
const FLASH=window.ODONTO_FLASHCARDS||[];
const REFS=window.ODONTO_REFERENCES||{};
const ACADEMIC=window.ODONTO_ACADEMIC_MODULES||[];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const app=$("#app"),crumbs=$("#breadcrumbs");
const STORE=window.ODONTO_PROFILE?.storage||localStorage;
const KEY="odontologia-caderno-v1";
let state={read:[],favorites:[],recent:[],ratings:{},deckOrder:{},deckIndex:{},deckMode:{}};
try{state=Object.assign(state,JSON.parse(STORE.getItem(KEY)||"{}"));}catch(e){}
const MODULES=[
 {id:"resumos",title:"Resumos",desc:"Biblioteca acadêmica organizada por grandes áreas, disciplinas e assuntos para acompanhar os conceitos e as aplicações de Odontologia."},
 {id:"flashcards",title:"Flashcards",desc:"Revisão ativa por disciplina com cartas, resposta oculta, classificação por dificuldade e progresso salvo."},
 {id:"referencias",title:"Referências Bibliográficas",desc:"Bibliografia de base organizada por disciplina para aprofundar conceitos, atividades, pesquisa e formação em Odontologia."}
].concat(ACADEMIC.map(m=>({id:m.id,title:m.title,desc:m.desc})));

function save(){STORE.setItem(KEY,JSON.stringify(state));}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function parts(){return location.hash.replace(/^#/,"").split("/").filter(Boolean).map(decodeURIComponent);}
function setCrumbs(items){crumbs.innerHTML=items.map((x,i)=>'<span>'+esc(x)+'</span>'+(i<items.length-1?' <b>›</b> ':'')).join("");}
function disciplineById(id){for(const area of DB){const d=area.disciplines.find(x=>x.id===id);if(d)return {area,discipline:d};}return null;}
function topicById(did,tid){const hit=disciplineById(did);if(!hit)return null;const topic=hit.discipline.topics.find(x=>x.id===tid);return topic?{...hit,topic}:null;}
function allTopics(){return DB.flatMap(area=>area.disciplines.flatMap(d=>d.topics.map(t=>({area,discipline:d,topic:t}))));}
function flashDeck(id){return FLASH.find(d=>d.id===id);}
function groupLetter(t){return (t||"M").charAt(0).toUpperCase();}
function moduleNav(active){
 return '<nav class="ws-module-nav">'+MODULES.map(m=>'<a class="'+(m.id===active?'active':'')+'" href="#module/'+m.id+'"><span class="ws-nav-dot"></span><b>'+esc(m.title)+'</b></a>').join("")+'</nav>';
}
function sidebarShell(active,title,body,isolated=false){
 const nav=isolated?'<nav class="ws-module-nav isolated"><a class="active" href="#module/'+active+'"><span class="ws-nav-dot"></span><b>'+esc(MODULES.find(m=>m.id===active)?.title||title)+'</b></a></nav>':moduleNav(active);
 return '<aside class="academic-sidebar"><div class="sidebar-kicker">CADERNO DO ESTUDANTE</div><div class="sidebar-title">'+esc(title)+'</div>'+nav+body+'</aside>';
}
function statusLabel(value){
 const map={Novo:"Novo","Em treino":"Revisar","Em progresso":"Em andamento",Dominado:"Consolidado"};
 return map[value]||value;
}
function refType(text){
 const t=String(text).toLowerCase();
 if(t.includes("atlas"))return "Atlas";
 if(t.includes("guideline")||t.includes("diretr"))return "Diretriz";
 if(t.includes("código")||t.includes("code of"))return "Código";
 return "Livro-texto";
}

function moduleVisual(id,index){
 const academic=ACADEMIC.find(m=>m.id===id);
 if(academic&&academic.visual)return academic.visual;
 const map={
  resumos:{icon:"✎",label:"ESTUDO PROFUNDO",note:"ler · compreender · relacionar",tone:"pink",tag:"Biblioteca acadêmica"},
  flashcards:{icon:"↻",label:"REVISÃO ATIVA",note:"lembrar · conferir · repetir",tone:"blue",tag:"Treino de memória"},
  referencias:{icon:"⌑",label:"BIBLIOTECA DE ODONTOLOGIA",note:"consultar · aprofundar · pesquisar",tone:"purple",tag:"Base teórica"}
 };
 return map[id]||{icon:["✦","◎","◇"][index%3],label:"MÓDULO ACADÊMICO",note:"estudar · organizar · evoluir",tone:["green","yellow","rose"][index%3],tag:"Caderno de Odontologia"};
}
function home(){
 setCrumbs(["Faculdade de Odontologia"]);
 const coreModules=MODULES.slice(0,3).map((m,i)=>({module:m,visual:moduleVisual(m.id,i)}));
 const academicModules=MODULES.slice(3).map((m,i)=>{const source=ACADEMIC.find(a=>a.id===m.id)||{};return {module:m,visual:moduleVisual(m.id,i+3),category:source.category||"Graduação & Organização"};});
 const categories=[  {    "name": "Graduação & Organização",    "script": "compreender · integrar · revisar",    "desc": "Graduação & Organização na formação em Odontologia: atividades, registros e próximos passos."  },  {    "name": "Prática & Aprendizagem",    "script": "compreender · integrar · revisar",    "desc": "Prática & Aprendizagem na formação em Odontologia: atividades, registros e próximos passos."  },  {    "name": "Biblioteca de Estudos",    "script": "compreender · integrar · revisar",    "desc": "Biblioteca de Estudos na formação em Odontologia: atividades, registros e próximos passos."  },  {    "name": "Pesquisa & Produção Científica",    "script": "compreender · integrar · revisar",    "desc": "Pesquisa & Produção Científica na formação em Odontologia: atividades, registros e próximos passos."  },  {    "name": "Estágios & Formação",    "script": "compreender · integrar · revisar",    "desc": "Estágios & Formação na formação em Odontologia: atividades, registros e próximos passos."  },  {    "name": "Pós-Graduação & Carreira",    "script": "compreender · integrar · revisar",    "desc": "Pós-Graduação & Carreira na formação em Odontologia: atividades, registros e próximos passos."  },  {    "name": "Vida Pessoal & Organização",    "script": "compreender · integrar · revisar",    "desc": "Vida Pessoal & Organização na formação em Odontologia: atividades, registros e próximos passos."  }].filter(c=>academicModules.some(x=>x.category===c.name));
 const card=({module:m,visual:v},i,extra="")=>'<a class="home-module-card home-tone-'+v.tone+' home-module-shape-'+(i%3)+' '+extra+'" data-home-module data-search="'+esc((m.title+" "+m.desc).toLowerCase())+'" href="#module/'+m.id+'">'+
    '<div class="home-module-cover"><div class="module-doodle">'+v.icon+'</div><span>'+v.label+'</span><div class="cover-lines"><i></i><i></i><i></i></div><small>'+v.note+'</small></div>'+
    '<div class="home-module-body"><div class="home-module-meta"><span>'+v.tag+'</span><em>Disponível</em></div><h3>'+esc(m.title)+'</h3><p>'+esc(m.desc)+'</p><footer><span>Abrir módulo</span><b>→</b></footer></div>'+
  '</a>';
 app.innerHTML='<section class="page home-page medicine-home">'+
  '<section class="home-notebook-hero">'+
   '<div class="home-hero-wash wash-pink"></div><div class="home-hero-wash wash-blue"></div><div class="home-hero-wash wash-green"></div>'+
   '<div class="home-paper-tape tape-one"></div><div class="home-paper-tape tape-two"></div>'+
   '<div class="home-hero-copy"><span class="home-kicker">CADERNO DO ESTUDANTE</span><h1><span>Odontologia</span><em>para estudar e organizar a graduação inteira</em></h1><p>Dos fundamentos à apresentação do TCC: estudos, atividades, rotina e carreira em um caderno de Odontologia.</p><div class="home-hero-tags"><span>estudo profundo</span><span>organização acadêmica</span><span>carreira e vida real</span></div></div>'+
   '<div class="home-hero-notes"><article class="floating-note note-pink"><small>estudo</small><strong>Entender antes de decorar.</strong><i>✎</i></article><article class="floating-note note-blue"><small>trajetória</small><strong>Acompanhar evolução sem perder contexto.</strong><i>⌁</i></article><article class="floating-note note-yellow"><small>futuro</small><strong>Preparar o próximo passo sem atropelar o atual.</strong><i>↻</i></article></div>'+
  '</section>'+
  '<section class="home-intro"><div><span class="home-handwritten">meu caderno de odontologia</span><h2>Escolha o espaço que você precisa agora</h2><p>O Caderno acompanha desde o estudo de hoje até estágio supervisionado, projeto, pesquisa e decisões futuras. Resumos, casos e referências estão organizados por disciplina e finalidade de estudo.</p></div><aside><span>ODONTOLOGIA</span><strong>Um lugar para estudar, organizar, registrar e construir sua trajetória.</strong></aside></section>'+
  '<section class="home-module-section"><div class="home-section-title"><div><span>ESTUDO E APROFUNDAMENTO</span><h2>Biblioteca de estudo</h2></div><p class="home-script-note">entenda, revise, aprofunde.</p></div>'+
  '<div class="home-module-grid home-core-grid">'+coreModules.map((x,i)=>card(x,i,"core-module-card")).join("")+'</div></section>'+
  '<section class="home-academic-explorer"><div class="academic-section-banner"><div><span>VIDA ACADÊMICA COMPLETA</span><h2>Todos os seus módulos</h2><p>Navegue por área ou pesquise diretamente o que precisa. Os módulos já chegam preenchidos com exemplos e continuam totalmente editáveis.</p></div><em class="home-handwritten">do primeiro período aos próximos passos da carreira</em></div>'+
  '<div class="home-module-search"><span>⌕</span><input type="search" id="homeModuleSearch" placeholder="Buscar módulo: estágio, atividade de estudo, finanças, mestrado..."><small>Pesquise pelo nome ou pela função do módulo.</small></div>'+
  '<div class="home-category-nav">'+categories.map((c,i)=>'<button class="home-category-chip category-tone-'+i+'" data-scroll-target="home-category-'+i+'"><span>'+String(i+1).padStart(2,"0")+'</span>'+esc(c.name)+'</button>').join("")+'</div>'+
  categories.map((c,i)=>{const items=academicModules.filter(x=>x.category===c.name);return '<section class="home-academic-category category-tone-'+i+'" id="home-category-'+i+'"><header class="home-category-header"><div><span>ÁREA '+String(i+1).padStart(2,"0")+'</span><h2>'+esc(c.name)+'</h2><p>'+esc(c.desc)+'</p></div><em>'+esc(c.script)+'</em><b>'+items.length+' módulos</b></header><div class="home-academic-module-grid">'+items.map((x,j)=>card(x,j,"academic-home-card")).join("")+'</div></section>';}).join("")+
  '<div class="home-seodontologia-empty" id="homeSearchEmpty" hidden><span>⌕</span><h3>Nenhum módulo encontrado</h3><p>Tente outra palavra, como “estágio”, “projeto”, “pesquisa” ou “rotina”.</p></div></section>'+
  '<section class="home-study-board"><div class="study-board-title"><span class="home-handwritten">um sistema, vários momentos da formação</span><h2>O Caderno acompanha o seu ritmo</h2></div><div class="study-board-grid">'+
   '<article><span class="board-icon pink">✎</span><div><small>QUANDO PRECISAR ENTENDER</small><strong>Entre nos Resumos</strong><p>Leia conteúdo completo e construa base conceitual.</p></div></article>'+
   '<article><span class="board-icon blue">↻</span><div><small>QUANDO PRECISAR ORGANIZAR</small><strong>Abra o módulo da sua rotina</strong><p>Planeje semestre, estágio, pesquisa, projeto ou vida pessoal.</p></div></article>'+
   '<article><span class="board-icon purple">☆</span><div><small>QUANDO PRECISAR OLHAR ADIANTE</small><strong>Use os módulos de carreira</strong><p>Explore especialidades, programas e formação futura sem perder o foco atual.</p></div></article>'+
  '</div></section>'+
 '</section>';
 bindInternalScroll(app);
 const search=$("#homeModuleSearch"),empty=$("#homeSearchEmpty");
 if(search)search.oninput=()=>{const q=search.value.trim().toLowerCase();let shown=0;$$("[data-home-module]",app).forEach(el=>{const ok=!q||(el.dataset.search||"").includes(q);el.style.display=ok?"":"none";if(ok)shown++;});$$(".home-academic-category",app).forEach(sec=>{const visible=[...sec.querySelectorAll("[data-home-module]")].some(el=>el.style.display!=="none");sec.style.display=visible?"":"none";});$$(".home-category-chip",app).forEach((b,i)=>{const sec=$("#home-category-"+i);b.style.display=sec&&sec.style.display!=="none"?"":"none";});if(empty)empty.hidden=shown>0;};
}

function bindInternalScroll(root=document){
 $$("[data-scroll-target]",root).forEach(el=>{
   el.onclick=e=>{
     e.preventDefault();
     const target=document.getElementById(el.dataset.scrollTarget);
     if(target)target.scrollIntoView({behavior:"smooth",block:"start"});
   };
 });
}
function areaVisual(index){
 const labels=[  "Bases biológicas",  "Clínica e diagnóstico",  "Tecnologia e reabilitação",  "Função e desenvolvimento",  "Saúde e pesquisa"];
 const icons=["⌂","▦","◇","◐","△","⌘","✎"];
 return {className:"area-tone-"+(index%8),label:labels[index]||"Odontologia",icon:icons[index]||"✦"};
}
function summariesHome(){
 setCrumbs(["Faculdade de Odontologia","Resumos"]);
 const side='<div class="ws-sidebar-group"><span>Áreas de estudo</span>'+DB.map((a,i)=>'<button data-scroll-target="area-'+esc(a.id)+'"><span class="side-color-dot area-tone-'+(i%8)+'"></span>'+esc(a.title)+'</button>').join("")+'</div>'+
 '<div class="ws-sidebar-note colorful-note"><b>Como usar</b><p>Comece pela área, escolha a disciplina e abra o assunto. Dentro de cada resumo, use os blocos, tabelas, destaques e seções expansíveis conforme seu ritmo de estudo.</p></div>';
 app.innerHTML='<section class="academic-workspace summaries-color-workspace">'+sidebarShell("resumos","Resumos",side,true)+
 '<div class="academic-main"><header class="workspace-hero summary-library-hero"><span class="workspace-eyebrow">BIBLIOTECA DE RESUMOS</span><h1>Resumos de Odontologia</h1><p>Uma biblioteca de estudo organizada por grandes áreas, com páginas extensas, explicações aprofundadas e formatos variados para tornar a leitura mais dinâmica.</p><div class="workspace-guide colorful-guide"><span>Escolha uma área</span><i>→</i><span>Entre na disciplina</span><i>→</i><span>Abra o assunto</span><i>→</i><span>Estude pela página completa</span></div></header>'+
 '<section class="summary-area-overview"><div class="workspace-panel-head"><div><span class="workspace-label">GRANDES ÁREAS</span><h2>Escolha por onde começar</h2><p>Cada área reúne disciplinas relacionadas e possui sua própria identidade visual para facilitar a navegação.</p></div></div><div class="summary-area-gallery">'+
 DB.map((area,i)=>{const v=areaVisual(i);return '<button class="summary-area-card '+v.className+'" data-scroll-target="area-'+esc(area.id)+'"><div class="area-card-cover"><span class="area-card-icon">'+v.icon+'</span><small>'+esc(v.label)+'</small></div><div class="area-card-body"><span class="area-card-kicker">ÁREA DE ESTUDO</span><h3>'+esc(area.title)+'</h3><p>'+esc(area.desc)+'</p><em>Explorar área →</em></div></button>';}).join("")+
 '</div></section>'+
 DB.map((area,i)=>{const v=areaVisual(i);return '<section class="workspace-section colorful-area-section '+v.className+'" id="area-'+esc(area.id)+'"><div class="workspace-panel-head"><div><span class="workspace-label">ÁREA DE ESTUDO</span><h2>'+esc(area.title)+'</h2><p>'+esc(area.desc)+'</p></div><span class="panel-state">Resumos disponíveis</span></div>'+
 '<div class="discipline-gallery">'+area.disciplines.map((d,j)=>'<a class="discipline-gallery-card card-shape-'+(j%4)+'" href="#subject/'+encodeURIComponent(d.id)+'"><div class="discipline-mini-cover"><span>'+esc(groupLetter(d.title))+'</span><i></i><i></i></div><div class="discipline-gallery-body"><span>'+esc(v.label)+'</span><h3>'+esc(d.title)+'</h3><p>'+esc(d.desc)+'</p><em>Abrir disciplina →</em></div></a>').join("")+'</div></section>';}).join("")+
 '</div></section>';
 bindInternalScroll(app);
}

function subjectPage(id){
 const hit=disciplineById(id);if(!hit)return summariesHome();
 const {area,discipline:d}=hit;
 const areaIndex=Math.max(0,DB.findIndex(a=>a.id===area.id)),v=areaVisual(areaIndex);
 setCrumbs(["Odontologia","Resumos",area.title,d.title]);
 const side='<div class="ws-sidebar-group"><span>Nesta disciplina</span><a href="#module/resumos">← Voltar aos resumos</a>'+d.topics.map(t=>'<a href="#summary/'+encodeURIComponent(d.id)+'/'+encodeURIComponent(t.id)+'">'+esc(t.title)+'</a>').join("")+'</div>'+
 '<div class="ws-sidebar-note colorful-note"><b>Área acadêmica</b><p>'+esc(area.title)+'</p></div>';
 app.innerHTML='<section class="academic-workspace subject-color-workspace '+v.className+'">'+sidebarShell("resumos",d.title,side,true)+
 '<div class="academic-main"><div class="subject-color-cover"><span>'+v.icon+'</span><small>'+esc(area.title)+'</small></div><header class="workspace-hero compact subject-color-head"><span class="workspace-eyebrow">'+esc(area.title)+'</span><h1>'+esc(d.title)+'</h1><p>'+esc(d.desc)+'</p></header>'+
 '<section class="workspace-section"><div class="workspace-panel-head"><div><span class="workspace-label">ASSUNTOS DA DISCIPLINA</span><h2>Escolha um resumo</h2><p>Cada assunto abre uma página completa de estudo, com estrutura visual própria e conteúdo aprofundado.</p></div></div>'+
 '<div class="topic-gallery">'+d.topics.map((t,i)=>{const k=d.id+":"+t.id;return '<a class="topic-gallery-card topic-tone-'+(i%6)+'" href="#summary/'+encodeURIComponent(d.id)+'/'+encodeURIComponent(t.id)+'"><div class="topic-card-top"><span>'+esc(groupLetter(t.title))+'</span><em class="status-pill '+(state.read.includes(k)?'done':'ready')+'">'+(state.read.includes(k)?'Revisado':'Para estudar')+'</em></div><h3>'+esc(t.title)+'</h3><p>'+esc(t.lead)+'</p><footer><span>'+esc(t.keywords.slice(0,3).join(" · "))+'</span><b>Abrir resumo →</b></footer></a>';}).join("")+
 '</div></section></div></section>';
}

function markedText(part){
 const obj=typeof part==="string"?{text:part}:part||{text:""};
 let out=esc(obj.text||"");
 (obj.marks||[]).forEach(mark=>{
   const token=esc(mark.text||"");if(!token)return;
   const tag=mark.style==="underline"?"u":mark.style==="mark"?"mark":"strong";
   out=out.split(token).join("<"+tag+">"+token+"</"+tag+">");
 });
 return out;
}
function themeIcon(theme){
 const icons={anatomy:"✎",histology:"▦",molecular:"◫",biochem:"∆",cardiac:"♥",physiology:"↕",respiratory:"≈",pathology:"✣",immunology:"Y",pharmacology:"Rx",semiology:"◉",clinical:"⚕",public:"∑",ethics:"⚖",neuro:"⌁",renal:"◇",endocrine:"↻",gastro:"≈",hematology:"●",microbiology:"◌",genetics:"DNA",embryology:"✧",musculoskeletal:"⇄"};
 return icons[theme]||"✎";
}
function summaryBlocks(t){
 if(Array.isArray(t.blocks)&&t.blocks.length)return t.blocks;
 return (t.sections||[]).map(s=>({type:"text",title:s[0],paragraphs:[s[1]]}));
}
function renderSummaryBlock(b,i){
 const id="section-"+i,variant=" block-v"+(i%6);
 if(b.type==="callout")return '<aside class="notion-callout tone-'+esc(b.tone||"blue")+variant+'" id="'+id+'"><span class="callout-icon">'+esc(b.icon||"✦")+'</span><div><strong>'+esc(b.title||"")+'</strong><p>'+esc(b.text||"")+'</p></div></aside>';
 if(b.type==="text")return '<section class="notion-content-block notion-text-block'+variant+'" id="'+id+'"><span class="reading-label">CONTEÚDO TEÓRICO</span><h2>'+esc(b.title||"")+'</h2>'+(b.paragraphs||[]).map(p=>'<p>'+markedText(p)+'</p>').join("")+'</section>';
 if(b.type==="table")return '<section class="notion-content-block notion-table-block'+variant+'" id="'+id+'"><span class="reading-label">QUADRO DE ESTUDO</span><h2>'+esc(b.title||"")+'</h2>'+(b.intro?'<p class="block-intro">'+esc(b.intro)+'</p>':"")+'<div class="notion-table-shell"><table class="notion-study-table"><thead><tr>'+(b.headers||[]).map(h=>'<th>'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+(b.rows||[]).map(row=>'<tr>'+row.map(cell=>'<td>'+esc(cell)+'</td>').join("")+'</tr>').join("")+'</tbody></table></div></section>';
 if(b.type==="columns")return '<section class="notion-content-block notion-columns-block'+variant+'" id="'+id+'"><span class="reading-label">VISÃO COMPARATIVA</span><h2>'+esc(b.title||"")+'</h2><div class="notion-columns">'+(b.cards||[]).map(c=>'<article><span>'+esc(c.badge||"")+'</span><h3>'+esc(c.title||"")+'</h3><p>'+esc(c.text||"")+'</p></article>').join("")+'</div></section>';
 if(b.type==="bullets")return '<section class="notion-content-block notion-bullets'+variant+'" id="'+id+'"><span class="reading-label">ORGANIZAÇÃO DO CONTEÚDO</span><h2>'+esc(b.title||"")+'</h2>'+(b.intro?'<p class="block-intro">'+esc(b.intro)+'</p>':"")+'<div class="notion-bullet-list">'+(b.items||[]).map(item=>'<div><span>•</span><p><strong>'+esc(item.title||"")+'</strong>'+esc(item.text||"")+'</p></div>').join("")+'</div></section>';
 if(b.type==="toggle")return '<details class="notion-toggle'+variant+'" id="'+id+'"><summary><span class="toggle-arrow">›</span><div><strong>'+esc(b.title||"")+'</strong>'+(b.summary?'<small>'+esc(b.summary)+'</small>':"")+'</div></summary><div class="toggle-content">'+(b.content||[]).map(p=>'<p>'+esc(p)+'</p>').join("")+(b.items?.length?'<ul>'+b.items.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':"")+'</div></details>';
 if(b.type==="sequence")return '<section class="notion-content-block notion-sequence-block'+variant+'" id="'+id+'"><span class="reading-label">SEQUÊNCIA</span><h2>'+esc(b.title||"")+'</h2><div class="notion-sequence">'+(b.steps||[]).map((s,n)=>'<div><span class="step-dot">'+(n+1)+'</span><div><strong>'+esc(s.title||"")+'</strong><p>'+esc(s.text||"")+'</p></div></div>').join("")+'</div></section>';
 if(b.type==="formula")return '<section class="notion-content-block notion-formulas'+variant+'" id="'+id+'"><span class="reading-label">RELAÇÕES ESSENCIAIS</span><h2>'+esc(b.title||"")+'</h2><div class="formula-grid">'+(b.formulas||[]).map(f=>'<div><code>'+esc(f.expression||"")+'</code><p>'+esc(f.note||"")+'</p></div>').join("")+'</div></section>';
 if(b.type==="quote")return '<blockquote class="notion-quote'+variant+'" id="'+id+'"><p>'+esc(b.text||"")+'</p>'+(b.caption?'<cite>'+esc(b.caption)+'</cite>':"")+'</blockquote>';
 return "";
}
function summaryPage(did,tid){
 const hit=topicById(did,tid);if(!hit)return summariesHome();
 const {area,discipline:d,topic:t}=hit,k=did+":"+tid;
 if(!state.recent.includes(k)){state.recent.unshift(k);state.recent=state.recent.slice(0,12);save();}
 const blocks=summaryBlocks(t);
 setCrumbs(["Odontologia","Resumos",d.title,t.title]);
 const navLinks=blocks.map((b,i)=>b.title?'<button data-scroll-target="section-'+i+'">'+esc(b.title)+'</button>':"").join("");
 const side='<div class="ws-sidebar-group"><span>Neste resumo</span><a href="#subject/'+encodeURIComponent(d.id)+'">← Voltar à disciplina</a>'+navLinks+'</div>'+
 '<div class="ws-sidebar-note"><b>Palavras-chave</b><div class="sidebar-keywords">'+t.keywords.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div></div>';
 app.innerHTML='<section class="academic-workspace summary-only-workspace">'+sidebarShell("resumos",d.title,side,true)+
 '<div class="academic-main summary-notion-main"><article class="notion-summary-page summary-theme-'+esc(t.pageTheme||"default")+'">'+
 '<div class="notion-cover theme-'+esc(t.pageTheme||"default")+'"><span>'+esc(area.title)+'</span></div>'+
 '<div class="notion-page-icon">'+themeIcon(t.pageTheme)+'</div>'+
 '<header class="notion-summary-head"><div class="article-subject">'+esc(area.title)+' · '+esc(d.title)+'</div><h1>'+esc(t.title)+'</h1><p>'+esc(t.lead)+'</p><div class="article-actions"><button id="readBtn" class="'+(state.read.includes(k)?"active":"")+'">'+(state.read.includes(k)?"✓ Revisado":"Marcar como revisado")+'</button><button id="favBtn" class="'+(state.favorites.includes(k)?"active":"")+'">'+(state.favorites.includes(k)?"★ Favorito":"☆ Adicionar aos favoritos")+'</button></div></header>'+
 '<div class="notion-summary-content">'+blocks.map(renderSummaryBlock).join("")+
 '<section class="notion-content-block notion-keywords"><span class="reading-label">REVISÃO</span><h2>Palavras-chave para recuperar sem olhar</h2><p class="block-intro">Tente explicar cada termo em voz alta antes de voltar ao texto. A ideia é usar o resumo também como guia de recuperação ativa, sem transformar esta página em outro módulo.</p><div class="keywords">'+t.keywords.map(x=>'<span class="keyword">'+esc(x)+'</span>').join("")+'</div></section>'+
 '</div></article></div></section>';
 const personal=document.createElement("section");personal.className="notion-content-block summary-personal";const initial=blocks.map(b=>[b.title,...(b.paragraphs||[]),b.text||"",...(b.cards||[]).map(c=>c.title+"\n"+c.text)].filter(Boolean).join("\n\n")).join("\n\n");state.summaryEdits=state.summaryEdits||{};personal.innerHTML='<details><summary>Minha versão do resumo</summary><p>O conteúdo já está preenchido. Você pode adaptar o texto para o seu estudo.</p><label for="personalSummary">Texto de estudo</label><textarea id="personalSummary" rows="18">'+esc(state.summaryEdits[k]??initial)+'</textarea><span id="summaryEditStatus" role="status">Pronto para adaptar</span></details>';$(".notion-summary-content").append(personal);$("#personalSummary").oninput=e=>{state.summaryEdits[k]=e.target.value;save();$("#summaryEditStatus").textContent="Sua versão foi salva";};
 $("#readBtn").onclick=()=>{toggle("read",k);summaryPage(did,tid);};
 $("#favBtn").onclick=()=>{toggle("favorites",k);summaryPage(did,tid);};
 bindInternalScroll(app);
}
function toggle(field,k){const a=state[field],i=a.indexOf(k);i>=0?a.splice(i,1):a.push(k);save();}

function deckStatus(d){
 const vals=d.cards.map((_,i)=>state.ratings[d.id+":"+i]).filter(Boolean);
 if(!vals.length)return "Novo";
 if(vals.some(v=>v==="wrong"||v==="hard"))return "Em treino";
 if(vals.length===d.cards.length&&vals.every(v=>v==="right"||v==="easy"))return "Dominado";
 return "Em progresso";
}
function studyAreaIndex(name){
 const exact=DB.findIndex(a=>a.title===name);
 return exact>=0?exact:0;
}
function flashcardsHome(){
 setCrumbs(["Faculdade de Odontologia","Flashcards"]);
 const dbAreas=DB.map(a=>a.title).filter(a=>FLASH.some(d=>d.area===a));
 const extras=[...new Set(FLASH.map(d=>d.area))].filter(a=>!dbAreas.includes(a));
 const areas=[...dbAreas,...extras];
 const side='<div class="ws-sidebar-group"><span>Áreas de revisão</span>'+areas.map((a,i)=>'<button data-scroll-target="flash-area-'+i+'"><span class="side-color-dot area-tone-'+(studyAreaIndex(a)%8)+'"></span>'+esc(a)+'</button>').join("")+'</div>'+
 '<div class="ws-sidebar-note flash-method-note"><b>Recuperação ativa</b><p>Leia a pergunta, tente explicar a resposta sem olhar e só então vire a carta. Classifique sua dificuldade para o Caderno separar o que precisa de novo contato.</p></div>';
 app.innerHTML='<section class="academic-workspace flash-color-workspace">'+sidebarShell("flashcards","Flashcards",side,true)+
 '<div class="academic-main"><header class="workspace-hero flash-library-hero"><span class="workspace-eyebrow">REVISÃO ATIVA</span><h1>Flashcards de Odontologia</h1><p>Baralhos organizados pelas mesmas áreas do Caderno, com perguntas construídas para recuperar conceitos, mecanismos, comparações, aplicações e interpretações importantes da graduação.</p><div class="workspace-guide colorful-guide"><span>Leia a pergunta</span><i>→</i><span>Recupere sem olhar</span><i>→</i><span>Confira a resposta</span><i>→</i><span>Classifique a dificuldade</span></div></header>'+
 '<section class="flash-area-overview"><div class="workspace-panel-head"><div><span class="workspace-label">ÁREAS DE REVISÃO</span><h2>Escolha a área que quer treinar</h2><p>Os baralhos seguem a mesma lógica visual dos Resumos para o estudante reconhecer rapidamente a área, a disciplina e o tipo de raciocínio de cada carta.</p></div></div><div class="flash-area-gallery">'+
 areas.map((area,i)=>{const ai=studyAreaIndex(area),v=areaVisual(ai),decks=FLASH.filter(d=>d.area===area);return '<button class="flash-area-card area-tone-'+(ai%8)+'" data-scroll-target="flash-area-'+i+'"><div class="flash-area-cover"><span>'+v.icon+'</span><small>'+esc(v.label)+'</small></div><div><span>REVISÃO</span><h3>'+esc(area)+'</h3><p>'+esc(decks[0]?.focus||"Baralhos de recuperação ativa organizados por disciplina.")+'</p><em>Ver baralhos →</em></div></button>';}).join("")+
 '</div></section>'+
 areas.map((area,i)=>{const ai=studyAreaIndex(area),v=areaVisual(ai),decks=FLASH.filter(d=>d.area===area);return '<section class="workspace-section flash-area-section area-tone-'+(ai%8)+'" id="flash-area-'+i+'"><div class="workspace-panel-head"><div><span class="workspace-label">ÁREA DE REVISÃO</span><h2>'+esc(area)+'</h2><p>'+esc(v.label)+' · recuperação ativa organizada por disciplina.</p></div><span class="panel-state">Pronto para estudar</span></div><div class="flash-deck-gallery">'+
 decks.map((d,j)=>{const cats=[...new Set(d.cards.map(c=>c.category).filter(Boolean))].slice(0,4);return '<a class="flash-deck-card deck-shape-'+(j%4)+' deck-tone-'+(j%6)+'" href="#flashcard/'+encodeURIComponent(d.id)+'"><div class="flash-deck-top"><span class="deck-symbol">'+esc(groupLetter(d.title))+'</span><em class="status-pill '+(deckStatus(d)==="Dominado"?'done':deckStatus(d)==="Em treino"?'review':'ready')+'">'+esc(statusLabel(deckStatus(d)))+'</em></div><span class="flash-deck-kicker">'+esc(v.label)+'</span><h3>'+esc(d.title)+'</h3><p>'+esc(d.focus||"Revisão ativa dos pontos centrais da disciplina.")+'</p><div class="deck-category-chips">'+cats.map(c=>'<span>'+esc(c)+'</span>').join("")+'</div><footer><b>Estudar baralho →</b></footer></a>';}).join("")+
 '</div></section>';}).join("")+
 '</div></section>';
 bindInternalScroll(app);
}

function deckOrder(d){
 const base=d.cards.map((_,i)=>i),saved=state.deckOrder[d.id],mode=state.deckMode?.[d.id]||"all";
 if(mode==="difficult"&&Array.isArray(saved)&&saved.length&&saved.every(x=>base.includes(x)))return saved;
 if(mode==="all"&&Array.isArray(saved)&&saved.length){
  const valid=[...new Set(saved.filter(i=>base.includes(i)))],missing=base.filter(i=>!valid.includes(i));
  if(!missing.length&&valid.length===base.length)return valid;
  const merged=valid.concat(missing);
  state.deckOrder[d.id]=merged;state.deckIndex[d.id]=Math.min(state.deckIndex[d.id]||0,merged.length-1);save();
  return merged;
 }
 // Nos baralhos ainda não abertos, inicie a revisão embaralhada. Os índices dos
 // cartões históricos são preservados para manter o progresso de estudo.
 const fresh=base.slice();for(let i=fresh.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[fresh[i],fresh[j]]=[fresh[j],fresh[i]];}
 state.deckMode[d.id]="all";state.deckOrder[d.id]=fresh;state.deckIndex[d.id]=0;save();return fresh;
}
function shuffleDeck(d){
 const a=d.cards.map((_,i)=>i);
 for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
 state.deckMode[d.id]="all";state.deckOrder[d.id]=a;state.deckIndex[d.id]=0;save();flashSession(d.id);
}
function resetDeckOrder(d){
 state.deckMode[d.id]="all";state.deckOrder[d.id]=d.cards.map((_,i)=>i);state.deckIndex[d.id]=0;save();flashSession(d.id);
}
function reviewDifficult(d){
 const difficult=d.cards.map((_,i)=>i).filter(i=>["wrong","hard"].includes(state.ratings[d.id+":"+i]));
 if(!difficult.length)return;
 state.deckMode[d.id]="difficult";state.deckOrder[d.id]=difficult;state.deckIndex[d.id]=0;save();flashSession(d.id);
}

function flashSession(id){
 const d=flashDeck(id);if(!d)return flashcardsHome();
 const order=deckOrder(d),pos=Math.min(state.deckIndex[id]||0,order.length-1),ci=order[pos],card=d.cards[ci];
 const ai=studyAreaIndex(d.area),v=areaVisual(ai);
 const difficult=d.cards.map((_,i)=>i).filter(i=>["wrong","hard"].includes(state.ratings[d.id+":"+i])).length;
 setCrumbs(["Odontologia","Flashcards",d.title]);
 const side='<div class="ws-sidebar-group"><span>Neste baralho</span><a href="#module/flashcards">← Voltar aos flashcards</a><button id="shuffleSide">Embaralhar cartas</button><button id="allCardsSide">Revisar o baralho completo</button>'+(difficult?'<button id="difficultSide">Revisar o que ficou difícil</button>':"")+'</div>'+
 '<div class="ws-sidebar-note flash-study-note"><b>Como usar esta carta</b><p>Formule a resposta mentalmente antes de revelar. Depois compare o que você recuperou com a resposta e classifique a dificuldade com sinceridade.</p></div>';
 app.innerHTML='<section class="academic-workspace flash-session-workspace area-tone-'+(ai%8)+'">'+sidebarShell("flashcards",d.title,side,true)+
 '<div class="academic-main"><div class="flash-subject-cover"><span>'+v.icon+'</span><small>'+esc(d.area)+'</small></div><header class="workspace-hero compact flash-session-head-new"><span class="workspace-eyebrow">'+esc(v.label)+'</span><h1>'+esc(d.title)+'</h1><p>'+esc(d.focus||"Revisão ativa dos conceitos centrais da disciplina.")+'</p><div class="silent-progress"><i style="width:'+(((pos+1)/order.length)*100)+'%"></i></div></header>'+
 '<section class="flash-focus flash-focus-color"><div class="flash-card-main deck-tone-'+(ci%6)+'"><div class="flash-card-meta"><span class="flash-category">'+esc(card.category||"Revisão")+'</span><span class="flash-memory-prompt">Carta '+(pos+1)+' de '+order.length+' · tente responder sem consultar o verso</span></div><span class="flash-side">PERGUNTA</span><h2>'+esc(card.q)+'</h2><div class="flash-answer" id="flashAnswer" hidden><span class="flash-side">RESPOSTA</span><p>'+esc(card.a)+'</p><small>Compare sua resposta mental com esta explicação e classifique o quanto precisou de ajuda para recuperar a informação.</small></div></div>'+
 '<div class="flash-controls flash-controls-new"><button class="reveal" id="revealBtn">Revelar resposta</button><button id="shuffleBtn">Embaralhar</button></div>'+
 '<div class="rating-row rating-row-new" id="ratingRow" hidden><button class="wrong" data-rate="wrong"><b>Errei</b><small>Não consegui recuperar</small></button><button class="hard" data-rate="hard"><b>Difícil</b><small>Recuperei com esforço</small></button><button class="right" data-rate="right"><b>Acertei</b><small>Resposta consistente</small></button><button class="easy" data-rate="easy"><b>Fácil</b><small>Recuperação imediata</small></button></div></section>'+
 '<section class="flash-study-strip"><div><span>TIPO DE RACIOCÍNIO</span><strong>'+esc(card.category||"Revisão")+'</strong></div><div><span>DISCIPLINA</span><strong>'+esc(d.title)+'</strong></div><div><span>ÁREA</span><strong>'+esc(d.area)+'</strong></div></section>'+
 '</div></section>';
 $("#revealBtn").onclick=()=>{$("#flashAnswer").hidden=false;$("#ratingRow").hidden=false;$("#revealBtn").hidden=true;};
 $("#shuffleBtn").onclick=()=>shuffleDeck(d);
 if($("#shuffleSide"))$("#shuffleSide").onclick=()=>shuffleDeck(d);
 if($("#allCardsSide"))$("#allCardsSide").onclick=()=>resetDeckOrder(d);
 if($("#difficultSide"))$("#difficultSide").onclick=()=>reviewDifficult(d);
 $$("[data-rate]").forEach(b=>b.onclick=()=>{
   state.ratings[d.id+":"+ci]=b.dataset.rate;
   state.deckIndex[id]=(pos+1)%order.length;
   save();flashSession(id);
 });
}


function referencePurpose(text,index){
 const type=refType(text);
 if(type==="Atlas")return "Revisão visual e relações espaciais";
 if(type==="Diretriz")return "Critérios técnicos e orientações de projeto";
 if(type==="Código")return "Princípios, normas e responsabilidade profissional";
 return index===0?"Base principal para estudo da disciplina":index===1?"Aprofundamento conceitual e correlação":"Consulta complementar e ampliação do conteúdo";
}
function referencesPage(){
 setCrumbs(["Faculdade de Odontologia","Referências Bibliográficas"]);
 const disciplineMap={},disciplineDesc={};DB.forEach(a=>a.disciplines.forEach(d=>{disciplineMap[d.title]=a.title;disciplineDesc[d.title]=d.desc;}));
 const dbAreas=DB.map(a=>a.title).filter(a=>Object.keys(REFS).some(k=>(disciplineMap[k]||"Outras")===a));
 const extras=[...new Set(Object.keys(REFS).map(k=>disciplineMap[k]||"Outras"))].filter(a=>!dbAreas.includes(a));
 const areas=[...dbAreas,...extras];
 const side='<div class="ws-sidebar-group"><span>Áreas da biblioteca</span>'+areas.map((a,i)=>'<button data-scroll-target="ref-area-'+i+'"><span class="side-color-dot area-tone-'+(studyAreaIndex(a)%8)+'"></span>'+esc(a)+'</button>').join("")+'</div>'+
 '<div class="ws-sidebar-note reference-method-note"><b>Como usar a biblioteca</b><p>Cada referência explica o que estudar, quando consultar e como utilizar em produção acadêmica. Você pode abrir o resumo correspondente, iniciar um fichamento e consultar a bibliografia comentada.</p></div>';
 app.innerHTML='<section class="academic-workspace reference-color-workspace">'+sidebarShell("referencias","Referências",side,true)+
 '<div class="academic-main"><header class="workspace-hero reference-library-hero"><span class="workspace-eyebrow">BIBLIOTECA DE ODONTOLOGIA</span><h1>Referências Bibliográficas</h1><p>Bibliografia comentada por disciplina, com finalidade de cada obra, momento de uso, aplicações em TCC, seminários, relatórios e estudos de caso, além de fichamentos e caminhos de estudo conectados.</p><div class="workspace-guide colorful-guide"><span>Escolha a área</span><i>→</i><span>Localize a disciplina</span><i>→</i><span>Identifique o tipo de obra</span><i>→</i><span>Aprofunde o tema</span></div></header>'+
 '<div class="reference-filter-panel"><label for="referenceLibrarySearch">Encontrar obra, assunto ou tipo de trabalho acadêmico</label><div><span>⌕</span><input id="referenceLibrarySearch" type="search" placeholder="Ex.: anatomia dental, cariologia, periodontia, materiais, saúde bucal…" autocomplete="off"><small id="referenceLibraryCount" role="status">Biblioteca completa</small></div></div><section class="reference-area-overview"><div class="workspace-panel-head"><div><span class="workspace-label">COLEÇÕES POR ÁREA</span><h2>Navegue pela biblioteca</h2><p>As cores seguem o mesmo mapa visual dos Resumos e Flashcards.</p></div></div><div class="reference-area-gallery">'+areas.map((area,i)=>{const ai=studyAreaIndex(area),v=areaVisual(ai);return '<button class="reference-area-card area-tone-'+(ai%8)+'" data-scroll-target="ref-area-'+i+'"><div class="reference-area-cover"><span>'+v.icon+'</span><small>'+esc(v.label)+'</small></div><div><span>BIBLIOTECA</span><h3>'+esc(area)+'</h3><p>Livros e materiais fundamentais das disciplinas desta área.</p><em>Explorar coleção →</em></div></button>';}).join("")+'</div></section>'+
 areas.map((area,i)=>{const ai=studyAreaIndex(area),v=areaVisual(ai);const disciplines=Object.entries(REFS).filter(([d])=>(disciplineMap[d]||"Outras")===area);return '<section class="workspace-section reference-area-section area-tone-'+(ai%8)+'" id="ref-area-'+i+'"><div class="workspace-panel-head"><div><span class="workspace-label">COLEÇÃO ACADÊMICA</span><h2>'+esc(area)+'</h2><p>'+esc(v.label)+' · referências organizadas por disciplina e finalidade de uso.</p></div><span class="panel-state">Biblioteca organizada</span></div><div class="reference-discipline-gallery">'+disciplines.map(([d,items])=>'<article class="reference-discipline-card"><header><div class="reference-discipline-symbol">'+esc(groupLetter(d))+'</div><div><span>DISCIPLINA</span><h3>'+esc(d)+'</h3><p>'+esc(disciplineDesc[d]||"Obras fundamentais para estudo e aprofundamento desta disciplina.")+'</p></div></header><div class="reference-book-grid">'+items.map((r,j)=>{const g=window.ODONTO_REFERENCE_GUIDE?.describe(d,r,j);return '<article data-reference-card class="reference-book-card reference-deep-card book-tone-'+(j%6)+'"><div class="reference-book-cover"><span>'+esc(g?.kind||refType(r))+'</span><b>'+esc(groupLetter(d))+'</b><i></i><i></i><i></i></div><div class="reference-book-info"><span>'+esc(g?.kind||refType(r))+'</span><h4>'+esc(r)+'</h4><p class="reference-short-purpose">'+esc(g?.what||referencePurpose(r,j))+'</p><div class="reference-context-grid"><div><b>Quando consultar</b><p>'+esc(g?.when||"Na preparação da disciplina e dos trabalhos acadêmicos.")+'</p></div><div><b>Trabalhos acadêmicos</b><p>'+esc(g?.works||"Fichamentos, relatórios e fundamentação teórica.")+'</p></div></div><details class="reference-extended"><summary>Ver conceitos e aplicação da obra <span>↘</span></summary><div class="reference-expanded-body"><h5>Como transformar a leitura em trabalho acadêmico</h5><p>'+esc(g?.method||"Organize conceito, fundamentação e aplicação com as páginas realmente consultadas.")+'</p><h5>Exemplo de utilização em '+esc(d)+'</h5><p>'+esc(g?.example||"Relacionar os conceitos à disciplina e criar uma ficha autoral.")+'</p><h5>Contribuição para o estudo</h5><p>'+esc(g?.limit||"Verifique a edição consultada e normas aplicáveis.")+'</p></div></details><div class="reference-open-links">'+""+(g?.disciplineId&&g?.topicId?'<a href="#summary/'+encodeURIComponent(g.disciplineId)+'/'+encodeURIComponent(g.topicId)+'">Ver resumo relacionado →</a>':"")+'<a href="#module/estudo-0">Abrir Fichamentos →</a></div></div></article>';}).join("")+'</div></article>').join("")+'</div></section>';}).join("")+
 '</div></section>';
 bindInternalScroll(app);
 const refSearch=$("#referenceLibrarySearch",app),status=$("#referenceLibraryCount",app);
 if(refSearch){const cards=$$("[data-reference-card]",app);refSearch.oninput=()=>{
 const needle=refSearch.value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 let count=0;cards.forEach(card=>{const hay=card.textContent.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");const match=!needle||hay.includes(needle);card.hidden=!match;if(match)count++;});
 if(status)status.textContent=needle?count+" referências encontradas":"Biblioteca completa";
 }; }
}

function modulePage(id){
 if(id==="tcc-pesquisa" && window.ODONTO_TCC_STUDIO)return window.ODONTO_TCC_STUDIO.render({app,store:STORE,setCrumbs,esc});
 if(id==="resumos")return summariesHome();
 if(id==="flashcards")return flashcardsHome();
 if(id==="referencias")return referencesPage();
 if(ACADEMIC.some(m=>m.id===id)&&window.ODONTO_ACADEMIC_UI)return window.ODONTO_ACADEMIC_UI.render({id,modules:ACADEMIC,app,esc,setCrumbs,store:STORE});
 return home();
}

function bindSearch(){
 const modal=$("#searchModal"),input=$("#globalSearch"),results=$("#searchResults");
 $("#searchBtn").onclick=()=>{modal.hidden=false;input.value="";results.innerHTML="";setTimeout(()=>input.focus(),30);};
 $("#closeSearch").onclick=()=>modal.hidden=true;
 modal.onclick=e=>{if(e.target===modal)modal.hidden=true;};
 input.oninput=()=>{
   const q=input.value.trim().toLowerCase();
   if(q.length<2){results.innerHTML="";return;}
   const hits=allTopics().filter(x=>(x.topic.title+" "+x.topic.lead+" "+x.discipline.title+" "+x.area.title+" "+x.topic.keywords.join(" ")).toLowerCase().includes(q)).slice(0,18);
   results.innerHTML=hits.length?hits.map(x=>'<a href="#summary/'+encodeURIComponent(x.discipline.id)+'/'+encodeURIComponent(x.topic.id)+'"><strong>'+esc(x.topic.title)+'</strong><small>'+esc(x.area.title)+' · '+esc(x.discipline.title)+'</small></a>').join(""):'<div style="padding:14px;font-size:9px;color:#888">Nenhum conteúdo encontrado.</div>';
   $$("a",results).forEach(a=>a.onclick=()=>modal.hidden=true);
 };
}

function router(event){
 if(event && document.getElementById("profileModal").hidden) app.focus({preventScroll:true});
 const p=parts();
 if(!p.length||p[0]==="home")return home();
 if(p[0]==="module")return modulePage(p[1]);
 if(p[0]==="subject")return subjectPage(p[1]);
 if(p[0]==="summary")return summaryPage(p[1],p[2]);
 if(p[0]==="flashcard")return flashSession(p[1]);
 return home();
}
bindSearch();
window.addEventListener("hashchange",router);
router();
})();



