const SB_URL = "https://aqkqcbjfmygtxogiznzd.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa3FjYmpmbXlndHhvZ2l6bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MTE1ODIsImV4cCI6MjA5ODE4NzU4Mn0.ZYaEjUlClzXV4ZMq8RF_TYDZTuQ2WxlTFvGt4sOBtiE";
const SESSION_KEY = "tropa_crm_session";
const statuses = {novo:"Novo",contato:"Em contato",qualificado:"Qualificado",proposta:"Proposta",ganho:"Ganho",perdido:"Perdido"};
let session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
let leads = [];
let currentLead = null;
const authHash = new URLSearchParams(location.hash.slice(1));
const inviteToken = authHash.get("access_token");
const authFlowType = authHash.get("type");

const $ = (selector) => document.querySelector(selector);
const request = async (endpoint, options = {}) => {
  const headers = {"apikey":SB_KEY,"Content-Type":"application/json",...(options.headers || {})};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const response = await fetch(`${SB_URL}${endpoint}`, {...options, headers});
  if (response.status === 401 && session) logout();
  return response;
};
const escapeHtml = (value="") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const date = value => new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value));
const phone = value => String(value || "").replace(/\D/g,"");
const showToast = message => { $("#toast").textContent=message; $("#toast").classList.add("show"); setTimeout(()=>$("#toast").classList.remove("show"),2400); };

async function login(email,password){
  const response = await request("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})});
  if(!response.ok) throw new Error("E-mail ou senha inválidos.");
  session = await response.json();
  localStorage.setItem(SESSION_KEY,JSON.stringify(session));
  const adminResponse = await request(`/rest/v1/crm_admins?id=eq.${session.user.id}&select=id`);
  const admin = adminResponse.ok ? (await adminResponse.json())[0] : null;
  if(!admin){ logout(); throw new Error("Esta conta não tem acesso administrativo."); }
}
function logout(){
  if(session?.access_token) request("/auth/v1/logout",{method:"POST"}).catch(()=>{});
  session=null; localStorage.removeItem(SESSION_KEY); $("#app-view").hidden=true; $("#login-view").hidden=false;
}
async function loadLeads(){
  $("#loading").hidden=false; $("#leads-table").hidden=true; $("#empty").hidden=true;
  const response = await request("/rest/v1/crm_leads?select=*&order=criado_em.desc");
  if(!response.ok){
    $("#loading").textContent = response.status === 404 ? "O banco do CRM ainda precisa ser ativado com a migração SQL." : "Não foi possível carregar os leads.";
    return;
  }
  leads=await response.json(); $("#loading").hidden=true; render();
}
function filteredLeads(){
  const query=$("#search").value.trim().toLowerCase();
  return leads.filter(lead => {
    const haystack=[lead.nome,lead.empresa,lead.tiktok,lead.whatsapp,lead.email].filter(Boolean).join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (!$("#filter-type").value || lead.tipo===$("#filter-type").value) && (!$("#filter-status").value || lead.status===$("#filter-status").value);
  });
}
function renderMetrics(){
  const won=leads.filter(l=>l.status==="ganho").length;
  const active=leads.filter(l=>!["ganho","perdido"].includes(l.status)).length;
  const newThisWeek=leads.filter(l=>Date.now()-new Date(l.criado_em).getTime()<7*864e5).length;
  $("#metrics").innerHTML=[
    [leads.length,"Total de leads"],[newThisWeek,"Novos em 7 dias"],[active,"Em andamento"],[won,"Ganhos"]
  ].map(([n,label])=>`<div class="metric"><strong>${n}</strong><span>${label}</span></div>`).join("");
}
function render(){
  renderMetrics();
  const list=filteredLeads(), body=$("#leads-body");
  body.textContent="";
  $("#empty").hidden=!!list.length; $("#leads-table").hidden=!list.length;
  list.forEach(lead=>{
    const row=document.createElement("tr");
    row.innerHTML=`<td><div class="lead-name">${escapeHtml(lead.nome || lead.empresa || lead.tiktok || "Sem nome")}</div><div class="lead-sub">${escapeHtml(lead.empresa || lead.tiktok || lead.whatsapp || lead.email || "Sem contato")}</div></td><td><span class="badge ${lead.tipo}">${lead.tipo==="marca"?"Marca":"Creator"}</span></td><td><select class="status-select" aria-label="Status de ${escapeHtml(lead.nome || "lead")}">${Object.entries(statuses).map(([value,label])=>`<option value="${value}" ${lead.status===value?"selected":""}>${label}</option>`).join("")}</select></td><td>${escapeHtml(lead.origem || "site")}</td><td>${date(lead.criado_em)}</td><td><button class="row-action" type="button">Ver detalhes</button></td>`;
    row.querySelector(".status-select").addEventListener("change",e=>quickStatus(lead,e.target.value));
    row.querySelector(".row-action").addEventListener("click",()=>openLead(lead));
    body.appendChild(row);
  });
}
async function updateLead(lead,patch){
  const response=await request(`/rest/v1/crm_leads?id=eq.${lead.id}`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify(patch)});
  if(!response.ok) throw new Error("Não foi possível salvar.");
  const updated=(await response.json())[0]; leads=leads.map(item=>item.id===lead.id?updated:item); return updated;
}
async function quickStatus(lead,status){
  try{ await updateLead(lead,{status,ultimo_contato_em:new Date().toISOString()}); render(); showToast("Status atualizado."); }
  catch(error){ showToast(error.message); render(); }
}
function openLead(lead){
  currentLead=lead; $("#dialog-kind").textContent=lead.tipo==="marca"?"Marca":"Creator"; $("#dialog-kind").className=`badge ${lead.tipo}`;
  $("#dialog-name").textContent=lead.nome || lead.empresa || lead.tiktok || "Lead sem nome";
  $("#edit-status").value=lead.status; $("#edit-notes").value=lead.notas || ""; $("#save-error").textContent="";
  const contacts=[];
  if(lead.whatsapp) contacts.push(`<a target="_blank" rel="noopener" href="https://wa.me/55${phone(lead.whatsapp).replace(/^55/,"")}">Abrir WhatsApp ↗</a>`);
  if(lead.email) contacts.push(`<a href="mailto:${encodeURIComponent(lead.email)}">Enviar e-mail</a>`);
  $("#lead-contact").innerHTML=contacts.join("");
  const details={Empresa:lead.empresa,TikTok:lead.tiktok,WhatsApp:lead.whatsapp,"E-mail":lead.email,Origem:lead.origem,...(lead.dados || {})};
  const hiddenKeys=["criado_em","nome","empresa","tiktok","whatsapp","email"];
  $("#lead-details").innerHTML=Object.entries(details).filter(([key,value])=>value && !hiddenKeys.includes(key)).map(([key,value])=>`<dl class="detail"><dt>${escapeHtml(key.replaceAll("_"," "))}</dt><dd>${escapeHtml(value)}</dd></dl>`).join("");
  $("#lead-dialog").showModal();
}

$("#login-form").addEventListener("submit",async event=>{
  event.preventDefault(); const button=event.currentTarget.querySelector("button"); button.disabled=true; button.textContent="Entrando…"; $("#login-error").textContent="";
  const data=new FormData(event.currentTarget);
  try{ await login(data.get("email"),data.get("password")); await startApp(); }
  catch(error){ $("#login-error").textContent=error.message; }
  finally{ button.disabled=false; button.textContent="Entrar no painel"; }
});
$("#setup-form").addEventListener("submit",async event=>{
  event.preventDefault();
  const button=event.currentTarget.querySelector("button");
  const data=new FormData(event.currentTarget);
  const password=data.get("password"), confirmation=data.get("confirm_password");
  $("#setup-error").textContent="";
  if(password!==confirmation){ $("#setup-error").textContent="As senhas não coincidem."; return; }
  button.disabled=true; button.textContent="Salvando…";
  try{
    const response=await fetch(`${SB_URL}/auth/v1/user`,{method:"PUT",headers:{"apikey":SB_KEY,"Authorization":`Bearer ${inviteToken}`,"Content-Type":"application/json"},body:JSON.stringify({password})});
    if(!response.ok) throw new Error("O convite expirou ou já foi usado. Solicite um novo convite.");
    history.replaceState(null,"",location.pathname);
    $("#setup-view").hidden=true; $("#login-copy").hidden=false; $("#login-form").hidden=false;
    $("#login-title").textContent="Senha criada";
    $("#login-copy p").textContent="Agora entre com seu e-mail e a senha que acabou de definir.";
    $("#access-note").textContent="Seu acesso administrativo está pronto.";
  }catch(error){ $("#setup-error").textContent=error.message; }
  finally{ button.disabled=false; button.textContent="Salvar senha"; }
});
$("#logout").addEventListener("click",logout);
$("#refresh").addEventListener("click",loadLeads);
["#search","#filter-type","#filter-status"].forEach(selector=>$(selector).addEventListener("input",render));
$("#save-lead").addEventListener("click",async()=>{
  const button=$("#save-lead"); button.disabled=true; button.textContent="Salvando…"; $("#save-error").textContent="";
  try{
    currentLead=await updateLead(currentLead,{status:$("#edit-status").value,notas:$("#edit-notes").value.trim()||null,ultimo_contato_em:new Date().toISOString()});
    render(); $("#lead-dialog").close(); showToast("Lead atualizado.");
  }catch(error){ $("#save-error").textContent=error.message; }
  finally{ button.disabled=false; button.textContent="Salvar alterações"; }
});
async function startApp(){
  $("#login-view").hidden=true; $("#app-view").hidden=false; $("#user-email").textContent=session.user.email; await loadLeads();
}
if(inviteToken && ["invite","recovery"].includes(authFlowType)){
  session=null; localStorage.removeItem(SESSION_KEY);
  $("#login-copy").hidden=true; $("#login-form").hidden=true; $("#setup-view").hidden=false;
  $("#access-note").textContent="O link é pessoal e expira por segurança.";
}else if(session?.access_token) startApp(); else logout();
