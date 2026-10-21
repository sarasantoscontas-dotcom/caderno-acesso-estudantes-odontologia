(()=>{'use strict';const $=s=>document.querySelector(s),profile=window.ODONTO_PROFILE,store=profile.storage;const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const app=$('#app'),status=t=>$('#backupStatus').textContent=t;
const allowed=k=>/^odontologia-(caderno-v1|academic-[a-z0-9-]+-v2|calculator-v1)$/.test(k);
$('#exportBackup').onclick=()=>{const email=profile.active();if(!email){status('Entre no caderno para baixar seus registros.');return}const prefix=profile.scopedKey(''),entries={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key.startsWith(prefix)){const base=key.slice(prefix.length);if(allowed(base))entries[base]=localStorage.getItem(key)}}const blob=new Blob([JSON.stringify({format:'caderno-odontologia',version:1,email,exportedAt:new Date().toISOString(),entries},null,2)],{type:'application/json'});download(blob,'caderno-odontologia-'+new Date().toISOString().slice(0,10)+'.json');status('Registros baixados. Os PDFs devem ser guardados também em seus arquivos originais.')};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#importBackup').onclick=()=>{if(!profile.active()){status('Entre no caderno antes de restaurar.');return}$('#backupFile').click()};$('#backupFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('Use um arquivo de até 10 MB.');const b=JSON.parse(await file.text());if(b.format!=='caderno-odontologia'||b.version!==1||b.email!==profile.active()||!b.entries||typeof b.entries!=='object'||Array.isArray(b.entries))throw Error('Selecione um backup deste caderno e do mesmo e-mail.');const entries=Object.entries(b.entries);if(!entries.length)throw Error('O arquivo está sem registros.');for(const[k,v]of entries){if(!allowed(k)||typeof v!=='string')throw Error('Registro incompatível.');const obj=JSON.parse(v);if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Registro inválido.')}if(!confirm('Restaurar os registros deste backup? Os registros correspondentes serão substituídos.'))return;const before=entries.map(([k])=>[k,store.getItem(k)]);try{for(const[k,v]of entries)store.setItem(k,v)}catch(error){for(const[k,v]of before)v===null?store.removeItem(k):store.setItem(k,v);throw error}location.reload()}catch(error){status(error.message||'Não foi possível restaurar.')}finally{e.target.value=''}};
const num=v=>Number(String(v).trim().replace(',','.'));const fmt=v=>v.toLocaleString('pt-BR',{maximumFractionDigits:4});
function customShell(title,text){app.innerHTML=`<section class="page"><header class="odontologia-tool-intro"><a href="#home">← Página principal</a><h1>${title}</h1><p>${text}</p></header><div id="ODONTOToolContent"></div></section>`;$('#breadcrumbs').textContent='Odontologia › '+title;return $('#ODONTOToolContent')}
function calculators(){const root=customShell('Ferramentas de Estudo','Confira tempo, média ponderada e progresso. Informe valores positivos e unidades compatíveis.');let cached={};try{cached=JSON.parse(store.getItem('odontologia-calculator-v1')||'{}')}catch{}const configs=[{id:'tempo',title:'Tempo de revisão',labels:['Quantidade de temas','Minutos por tema'],values:['4','25'],solve:([a,b])=>`Tempo: ${fmt(a*b)} minutos\n${fmt(a*b/60)} horas de estudo, antes das pausas.`},{id:'media',title:'Média de duas avaliações',labels:['Primeira nota','Peso da primeira nota','Segunda nota','Peso da segunda nota'],values:['8','2','7','3'],solve:([a,b,c,d])=>`Média ponderada: ${fmt((a*b+c*d)/(b+d))}\nSoma dos produtos dividida pela soma dos pesos.`},{id:'progresso',title:'Progresso das atividades',labels:['Atividades concluídas','Total de atividades'],values:['6','10'],solve:([a,b])=>`Progresso: ${fmt(100*a/b)}%\n${fmt(a)} de ${fmt(b)} atividades.`},{id:'distribuicao',title:'Distribuir blocos de estudo',labels:['Minutos disponíveis','Número de blocos'],values:['120','4'],solve:([a,b])=>`Cada bloco: ${fmt(a/b)} minutos\nReserve as pausas fora do tempo informado.`}];root.innerHTML='<div class="odontologia-calc-grid">'+configs.map(c=>`<section class="odontologia-panel"><h2>${c.title}</h2><form class="odontologia-form" data-calc="${c.id}">${c.labels.map((l,i)=>`<label>${l}<input type="text" inputmode="decimal" required name="v${i}" value="${escape(cached[c.id]?.[i]??c.values[i])}"></label>`).join('')}<button type="submit">Conferir resultado</button><output aria-live="polite"></output></form></section>`).join('')+'</div>';for(const form of root.querySelectorAll('[data-calc]'))form.onsubmit=e=>{e.preventDefault();const c=configs.find(x=>x.id===form.dataset.calc),inputs=[...form.querySelectorAll('input')],vals=inputs.map(x=>num(x.value));if(vals.some(x=>!Number.isFinite(x)||x<=0)){form.querySelector('output').textContent='Preencha todos os valores com números positivos.';return}if(c.id==='progresso'&&vals[0]>vals[1]){form.querySelector('output').textContent='O número concluído não pode superar o total.';return}form.querySelector('output').textContent=c.solve(vals);cached[c.id]=inputs.map(x=>x.value);store.setItem('odontologia-calculator-v1',JSON.stringify(cached))}}
let dbPromise;function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('odontologia-pdf-library-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('files',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});return dbPromise}async function fileRequest(mode,action){const conn=await db();return new Promise((resolve,reject)=>{const tx=conn.transaction('files',mode),req=action(tx.objectStore('files'));let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('A operação não foi concluída.'))})}
async function pdfs(){const root=customShell('Biblioteca de PDFs','Guarde PDFs de estudo, enunciados e entregas neste dispositivo. Os arquivos ficam neste navegador e não são incluídos no backup JSON dos registros; mantenha também seus originais.');root.innerHTML='<section class="odontologia-panel"><h2>Meus materiais</h2><form class="odontologia-form" id="ODONTOPdfForm"><label>Selecionar PDF (até 10 MB)<input id="ODONTOPdfFile" type="file" accept="application/pdf,.pdf" required></label><label>Disciplina ou pasta<input id="ODONTOPdfFolder" type="text" maxlength="100" placeholder="Ex.: Anatomia de cabeça e pescoço"></label><button type="submit">Guardar PDF</button><output id="ODONTOPdfStatus" aria-live="polite"></output></form><label class="odontologia-form">Buscar meus arquivos<input id="ODONTOPdfSearch" class="odontologia-file-search" type="search" placeholder="Nome ou disciplina"></label><div class="odontologia-files-list" id="ODONTOFilesList"></div></section>';const feedback=$('#ODONTOPdfStatus');let files=[];const render=()=>{const list=$('#ODONTOFilesList');if(!list)return;const q=$('#ODONTOPdfSearch').value.toLocaleLowerCase('pt-BR');const hits=files.filter(f=>(f.name+' '+f.folder).toLocaleLowerCase('pt-BR').includes(q));list.innerHTML=hits.length?hits.map(f=>`<article class="odontologia-file-row"><div><strong>${escape(f.name)}</strong><small>${escape(f.folder||'Sem pasta')} · ${fmt(f.size/1024)} KB</small></div><button data-pdf-download="${escape(f.id)}">Baixar</button><button data-pdf-delete="${escape(f.id)}">Remover</button></article>`).join(''):'<p>Seus PDFs aparecerão aqui depois de adicionados.</p>';for(const b of list.querySelectorAll('[data-pdf-download]'))b.onclick=()=>{const f=files.find(x=>x.id===b.dataset.pdfDownload);download(f.blob,f.name)};for(const b of list.querySelectorAll('[data-pdf-delete]'))b.onclick=async()=>{const f=files.find(x=>x.id===b.dataset.pdfDelete);if(!confirm('Remover este PDF da biblioteca? Guarde o arquivo original antes de continuar.'))return;try{await fileRequest('readwrite',s=>s.delete(f.id));files=files.filter(x=>x.id!==f.id);render()}catch{feedback.textContent='Não foi possível remover o arquivo.'}}};try{files=(await fileRequest('readonly',s=>s.getAll())).filter(f=>f.profile===profile.active());render()}catch{feedback.textContent='O navegador não permitiu abrir a biblioteca de arquivos.'}$('#ODONTOPdfSearch').oninput=render;$('#ODONTOPdfForm').onsubmit=async e=>{e.preventDefault();const file=$('#ODONTOPdfFile').files[0];if(!file)return;if(file.size>10*1024*1024||!file.name.toLowerCase().endsWith('.pdf')){feedback.textContent='Selecione um PDF de até 10 MB.';return}try{const signature=new TextDecoder().decode(await file.slice(0,5).arrayBuffer());if(signature!=='%PDF-')throw Error('Este arquivo não foi reconhecido como PDF.');const rec={id:crypto.randomUUID(),profile:profile.active(),name:file.name,folder:$('#ODONTOPdfFolder').value.trim(),size:file.size,blob:file};await fileRequest('readwrite',s=>s.put(rec));files.push(rec);render();feedback.textContent='PDF guardado na sua biblioteca.';$('#ODONTOPdfFile').value=''}catch(error){feedback.textContent=error.message||'Não foi possível guardar o PDF.'}}}
const questions=[
  [
    "Qual explicação corresponde a trajeto do trigêmeo?",
    [
      "O trigêmeo reúne sensibilidade somática da face e componente motor para músculos derivados do primeiro arco faríngeo. Suas três divisões apresentam territórios e trajetos diferentes.",
      "Inflamação e reparo são processos coordenados que envolvem células, vasos e matriz. O reparo depende da extensão da lesão, do tecido e das condições locais e sistêmicas.",
      "Suporte resiste ao deslocamento em direção aos tecidos; retenção se relaciona ao afastamento; estabilidade limita movimentos laterais e rotacionais. Esses conceitos organizam a análise de próteses removíveis."
    ],
    0,
    "O trigêmeo reúne sensibilidade somática da face e componente motor para músculos derivados do primeiro arco faríngeo. Suas três divisões apresentam territórios e trajetos diferentes. Os ramos oftálmico e maxilar são sensitivos; o mandibular contém fibras sensitivas e motoras. Forames, fossas e canais relacionam o nervo a dentes, músculos e pele."
  ],
  [
    "Qual explicação corresponde a morfologia dos dentes anteriores?",
    [
      "A descrição de uma lesão deve registrar localização, duração, dimensão, cor, superfície, limites e sintomas. Uma linguagem precisa permite comparar observações e comunicar achados de maneira estruturada.",
      "Incisivos e caninos apresentam formas relacionadas à apreensão e ao corte dos alimentos, à orientação dos movimentos e à composição do arco. Faces, bordas e relevos permitem sua identificação.",
      "A oclusão envolve contatos em posições e movimentos distintos. Uma descrição estática registra uma situação; movimentos acrescentam trajetos, coordenação muscular e relações articulares."
    ],
    1,
    "Incisivos e caninos apresentam formas relacionadas à apreensão e ao corte dos alimentos, à orientação dos movimentos e à composição do arco. Faces, bordas e relevos permitem sua identificação. Cíngulo, cristas marginais e fossa lingual variam entre grupos e indivíduos. A proporção entre coroa e raiz e a orientação dos contatos influenciam relações funcionais."
  ],
  [
    "Qual explicação corresponde a esmalte e dentina?",
    [
      "A imagem radiográfica representa diferenças de atenuação em uma projeção bidimensional. Tecidos, espessuras, geometria e parâmetros de aquisição influenciam a aparência de radiopacidade e radiolucidez.",
      "Crescimento craniofacial combina mudanças de tamanho, forma e posição de estruturas. Remodelação e deslocamento contribuem para o desenvolvimento, com variações individuais de ritmo e direção.",
      "Esmalte é um tecido altamente mineralizado produzido por ameloblastos durante a formação dental. Dentina contém túbulos e mantém relação funcional com odontoblastos localizados na periferia pulpar."
    ],
    2,
    "Esmalte é um tecido altamente mineralizado produzido por ameloblastos durante a formação dental. Dentina contém túbulos e mantém relação funcional com odontoblastos localizados na periferia pulpar. A organização prismática do esmalte difere da matriz colágena mineralizada da dentina. A permeabilidade dentinária varia conforme profundidade, diâmetro e densidade dos túbulos."
  ],
  [
    "Qual explicação corresponde a odontogênese e interações celulares?",
    [
      "A formação do dente envolve comunicação entre epitélio oral e ectomesênquima. Os estágios de broto, capuz e campânula descrevem mudanças morfológicas associadas à diferenciação celular.",
      "Adesão resulta da interação entre material, superfície e condições de aplicação. Esmalte e dentina apresentam composições e estruturas diferentes, influenciando a formação e estabilidade da interface.",
      "Dentições decídua e mista apresentam características anatômicas e cronológicas próprias. A transição combina esfoliação, erupção, crescimento e reorganização de espaços no arco."
    ],
    0,
    "A formação do dente envolve comunicação entre epitélio oral e ectomesênquima. Os estágios de broto, capuz e campânula descrevem mudanças morfológicas associadas à diferenciação celular. Órgão do esmalte, papila e folículo dental participam da formação de tecidos distintos. A indução recíproca coordena a diferenciação de ameloblastos e odontoblastos."
  ],
  [
    "Qual explicação corresponde a saliva e equilíbrio oral?",
    [
      "A integridade estrutural do dente depende da quantidade e da distribuição de tecidos remanescentes. A análise restauradora envolve biologia, função e possibilidade de manutenção ao longo do tempo.",
      "A saliva participa da lubrificação, percepção gustativa, proteção das superfícies e manutenção do equilíbrio mineral. Sua composição reflete contribuição glandular e condições de secreção.",
      "A análise prévia de uma região cirúrgica relaciona dentes, osso, estruturas vasculares, nervos e cavidades adjacentes. O objetivo acadêmico é compreender riscos anatômicos e necessidades de informação."
    ],
    1,
    "A saliva participa da lubrificação, percepção gustativa, proteção das superfícies e manutenção do equilíbrio mineral. Sua composição reflete contribuição glandular e condições de secreção. Tampões, proteínas e íons modulam o ambiente oral. Fluxo salivar e composição não são sinônimos; ambos influenciam depuração, umedecimento e interação com as superfícies dentárias."
  ],
  [
    "Qual explicação corresponde a equilíbrio mineral do esmalte?",
    [
      "A polpa contém tecido conjuntivo, vasos, nervos e células com funções defensivas e formadoras. Sua resposta a estímulos depende da intensidade, duração e condição prévia do complexo dentinopulpar.",
      "Indicadores sintetizam informações de uma população e precisam de definição, denominador e método de coleta. Medidas de experiência de doença não descrevem necessariamente atividade ou necessidade atual.",
      "A superfície do esmalte participa de trocas iônicas com o fluido ao seu redor. Desmineralização e remineralização refletem condições químicas locais, disponibilidade de íons e tempo de exposição."
    ],
    2,
    "A superfície do esmalte participa de trocas iônicas com o fluido ao seu redor. Desmineralização e remineralização refletem condições químicas locais, disponibilidade de íons e tempo de exposição. A saturação do fluido em relação ao mineral dental é central. Acidez favorece perda mineral, enquanto condições favoráveis de cálcio, fosfato e fluoreto podem apoiar sua reposição."
  ],
  [
    "Qual explicação corresponde a biofilme como comunidade organizada?",
    [
      "O biofilme dental é uma comunidade aderida a superfícies e envolvida em matriz extracelular. Sua organização espacial diferencia esse ecossistema de microrganismos dispersos em suspensão.",
      "Retenção e resistência descrevem aspectos distintos da estabilidade de uma restauração indireta. Geometria, altura, área e relação entre superfícies influenciam o comportamento do conjunto.",
      "Precauções-padrão organizam medidas de prevenção aplicáveis ao cuidado segundo a exposição prevista. Elas articulam higiene das mãos, barreiras, segurança de materiais e organização do ambiente."
    ],
    0,
    "O biofilme dental é uma comunidade aderida a superfícies e envolvida em matriz extracelular. Sua organização espacial diferencia esse ecossistema de microrganismos dispersos em suspensão. Adesão inicial, coadesão, disponibilidade de nutrientes e gradientes químicos favorecem comunidades distintas. Relações cooperativas e competitivas contribuem para mudanças ao longo do desenvolvimento do biofilme."
  ],
  [
    "Qual explicação corresponde a barreira epitelial e imunidade inata?",
    [
      "Suporte resiste ao deslocamento em direção aos tecidos; retenção se relaciona ao afastamento; estabilidade limita movimentos laterais e rotacionais. Esses conceitos organizam a análise de próteses removíveis.",
      "O epitélio oral integra barreira física e atividade imunológica. Junções celulares, renovação epitelial, peptídeos antimicrobianos e reconhecimento de padrões contribuem para a defesa local.",
      "Uma pergunta de pesquisa define população, exposição ou intervenção, comparação e desfecho quando esses elementos são pertinentes. O desenho deve corresponder ao tipo de resposta procurada."
    ],
    1,
    "O epitélio oral integra barreira física e atividade imunológica. Junções celulares, renovação epitelial, peptídeos antimicrobianos e reconhecimento de padrões contribuem para a defesa local. Células epiteliais e imunes detectam sinais e liberam mediadores que recrutam outras células. A intensidade e a duração da resposta influenciam proteção e possibilidade de dano colateral."
  ],
  [
    "Qual explicação corresponde a lesão cariosa e atividade?",
    [
      "A oclusão envolve contatos em posições e movimentos distintos. Uma descrição estática registra uma situação; movimentos acrescentam trajetos, coordenação muscular e relações articulares.",
      "O trigêmeo reúne sensibilidade somática da face e componente motor para músculos derivados do primeiro arco faríngeo. Suas três divisões apresentam territórios e trajetos diferentes.",
      "A cárie envolve um processo mediado por biofilme e modulado por açúcares, com desequilíbrio mineral ao longo do tempo. A lesão é uma manifestação tecidual desse processo."
    ],
    2,
    "A cárie envolve um processo mediado por biofilme e modulado por açúcares, com desequilíbrio mineral ao longo do tempo. A lesão é uma manifestação tecidual desse processo. Localização, aspecto superficial e contexto de retenção de biofilme ajudam a discutir atividade. Profundidade, cavitação e atividade representam dimensões diferentes da avaliação."
  ],
  [
    "Qual explicação corresponde a gengivite e periodontite?",
    [
      "Gengivite e periodontite não são termos intercambiáveis. Ambas envolvem inflamação, mas a periodontite se caracteriza por perda de suporte periodontal em um contexto clínico específico.",
      "Crescimento craniofacial combina mudanças de tamanho, forma e posição de estruturas. Remodelação e deslocamento contribuem para o desenvolvimento, com variações individuais de ritmo e direção.",
      "Incisivos e caninos apresentam formas relacionadas à apreensão e ao corte dos alimentos, à orientação dos movimentos e à composição do arco. Faces, bordas e relevos permitem sua identificação."
    ],
    0,
    "Gengivite e periodontite não são termos intercambiáveis. Ambas envolvem inflamação, mas a periodontite se caracteriza por perda de suporte periodontal em um contexto clínico específico. Resposta do hospedeiro, biofilme e fatores modificadores influenciam a evolução. Sinais gengivais e medidas de suporte precisam ser interpretados conjuntamente e ao longo do tempo."
  ]
];let qi=0;function quizzes(){const root=customShell('Quizzes de Odontologia','Responda, confira a explicação e avance. As perguntas retomam conceitos presentes na biblioteca do caderno.');const q=questions[qi];root.innerHTML=`<section class="odontologia-panel"><p>Questão ${qi+1} de ${questions.length}</p><h2 class="odontologia-question">${escape(q[0])}</h2><div class="odontologia-quiz-options">${q[1].map((a,i)=>`<button data-choice="${i}">${escape(a)}</button>`).join('')}</div><div class="odontologia-feedback" role="status" aria-live="polite"></div><button class="odontologia-main-button" id="ODONTOQuizNext" hidden>${qi===questions.length-1?'Recomeçar':'Próxima questão'}</button></section>`;let answered=false;for(const b of root.querySelectorAll('[data-choice]'))b.onclick=()=>{if(answered)return;answered=true;for(const btn of root.querySelectorAll('[data-choice]')){btn.disabled=true;if(+btn.dataset.choice===q[2])btn.classList.add('correct')}if(+b.dataset.choice!==q[2])b.classList.add('incorrect');root.querySelector('.odontologia-feedback').textContent=q[3];$('#ODONTOQuizNext').hidden=false};$('#ODONTOQuizNext').onclick=()=>{qi=(qi+1)%questions.length;quizzes()}}
function route(){const id=location.hash.split('/')[1];if(location.hash.startsWith('#module/')){if(id==='calculadoras')calculators();if(id==='biblioteca-pdfs')pdfs();if(id==='quizzes')quizzes()}if(location.hash.startsWith('#summary/')&&!$('#ODONTOPrintSummary')){const actions=$('.article-actions');if(actions){const b=document.createElement('button');b.id='ODONTOPrintSummary';b.className='odontologia-print';b.textContent='Imprimir / salvar PDF';b.onclick=()=>window.print();actions.append(b)}}}window.addEventListener('hashchange',route);route();
document.addEventListener('keydown',e=>{const modal=!$('#profileModal').hidden?$('#profileModal'):!$('#searchModal').hidden?$('#searchModal'):null;if(!modal)return;if(e.key==='Escape'){if(modal.id==='searchModal'){modal.hidden=true;$('#searchBtn').focus()}else if(profile.active()){$('#profileClose').click();$('#profileBtn').focus()}}if(e.key==='Tab'){const els=[...modal.querySelectorAll('button,input,a[href],select,textarea')].filter(x=>!x.hidden&&!x.disabled&&x.offsetParent!==null);if(!els.length)return;const first=els[0],last=els[els.length-1];if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){e.preventDefault();first.focus()}}});window.ODONTO_TOOLS_TEST={questions};})();
