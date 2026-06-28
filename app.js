/* ========== TROPA · app.js ========== */

/* ---- CONFIG (preencher antes de publicar) ---- */
const TROPA = {
  whatsapp: "5500000000000",              // <-- TROCAR pelo seu número, formato 55DDDXXXXXXXXX
  supabaseUrl: "https://aqkqcbjfmygtxogiznzd.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxa3FjYmpmbXlndHhvZ2l6bnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MTE1ODIsImV4cCI6MjA5ODE4NzU4Mn0.ZYaEjUlClzXV4ZMq8RF_TYDZTuQ2WxlTFvGt4sOBtiE",
};

/* WhatsApp helper */
function waLink(msg){
  return `https://wa.me/${TROPA.whatsapp}?text=${encodeURIComponent(msg)}`;
}
document.querySelectorAll("[data-wa]").forEach(a=>{
  a.href = waLink(a.getAttribute("data-wa") || "Oi! Vim pelo site da Tropa.");
});

/* ---- LIVE SELLS TICKER (assinatura) ---- */
const SALES = [
  ["@maria.makes","Sérum Vitamina C","R$ 89"],
  ["@casa.facil","Organizador 6 em 1","R$ 64"],
  ["@duda.fit","Whey 900g","R$ 119"],
  ["@lulu.beauty","Kit Skincare","R$ 147"],
  ["@tech.achados","Fone Bluetooth","R$ 79"],
  ["@bel.decora","Luminária LED","R$ 52"],
  ["@gabi.glow","Base Matte","R$ 69"],
  ["@pedro.casa","Mop Giratório","R$ 98"],
  ["@nutri.ya","Colágeno Verisol","R$ 134"],
  ["@rafa.style","Óculos UV400","R$ 59"],
  ["@manu.pele","Protetor FPS50","R$ 74"],
  ["@joao.gadgets","Mini Projetor","R$ 210"],
];
function timeAgo(i){ const s=[ "agora","há 12s","há 31s","há 1min","há 2min","há 3min","há 5min" ]; return s[i % s.length]; }
function saleRow([who,prod,val],i){
  return `<div class="sale"><span class="who">${who}</span><span class="val">${val}</span>`+
         `<span class="prod">vendeu · ${prod}</span><span class="ago">${timeAgo(i)}</span></div>`;
}
const feed = document.getElementById("liveTrack");
if(feed){
  const rows = SALES.map(saleRow).join("");
  feed.innerHTML = rows + rows; // duplica p/ loop contínuo
}

/* ---- FORMULÁRIOS (Supabase-ready) ---- */
async function saveLead(table, payload){
  // Se o Supabase estiver configurado, insere; senão, segue só com WhatsApp.
  if(TROPA.supabaseUrl && TROPA.supabaseAnonKey){
    try{
      const res = await fetch(`${TROPA.supabaseUrl}/rest/v1/${table}`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "apikey":TROPA.supabaseAnonKey,
          "Authorization":`Bearer ${TROPA.supabaseAnonKey}`,
          "Prefer":"return=minimal"
        },
        body:JSON.stringify(payload)
      });
      return res.ok;
    }catch(e){ console.warn("Supabase:",e); return false; }
  }
  console.info("[Tropa] Lead capturado (Supabase não configurado):", table, payload);
  return true;
}

document.querySelectorAll("form.lead").forEach(form=>{
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const table = form.getAttribute("data-table");
    const data = Object.fromEntries(new FormData(form).entries());
    data.criado_em = new Date().toISOString();
    const btn = form.querySelector("button[type=submit]");
    if(btn){ btn.disabled = true; btn.textContent = "Enviando…"; }
    await saveLead(table, data);
    form.style.display = "none";
    const ok = form.parentElement.querySelector(".form-ok");
    if(ok){
      const wa = ok.querySelector("[data-wa-dyn]");
      if(wa) wa.href = waLink(`Oi! Acabei de me cadastrar no site da Tropa (${data.nome||""}). Quero seguir.`);
      ok.classList.add("show");
    }
  });
});
