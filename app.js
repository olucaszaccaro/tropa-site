/* ========== TROPA · app.js ========== */

/* ---- CONFIG (preencher antes de publicar) ---- */
const TROPA = {
  whatsapp: "5561994597000",              // WhatsApp da Tropa
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

/* ---- FORMULÁRIOS (Supabase-ready) ---- */
async function saveLead(table, payload){
  // Se o Supabase estiver configurado, insere; senão, segue só com WhatsApp.
  if(TROPA.supabaseUrl && TROPA.supabaseAnonKey){
    try{
      const lead = {
        tipo: table === "leads_marca" ? "marca" : "creator",
        origem: payload.material ? `material: ${payload.material}` : location.pathname.replace(/^\//, "") || "home",
        nome: payload.nome || null,
        email: payload.email || null,
        whatsapp: payload.whatsapp || null,
        empresa: payload.empresa || null,
        tiktok: payload.tiktok || null,
        dados: {
          ...payload,
          pagina: location.pathname,
          utm_source: new URLSearchParams(location.search).get("utm_source") || null,
          utm_medium: new URLSearchParams(location.search).get("utm_medium") || null,
          utm_campaign: new URLSearchParams(location.search).get("utm_campaign") || null
        }
      };
      const res = await fetch(`${TROPA.supabaseUrl}/rest/v1/crm_leads`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "apikey":TROPA.supabaseAnonKey,
          "Authorization":`Bearer ${TROPA.supabaseAnonKey}`,
          "Prefer":"return=minimal"
        },
        body:JSON.stringify(lead)
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
    const originalLabel = btn?.textContent;
    form.setAttribute("aria-busy", "true");
    form.querySelector(".form-error")?.remove();
    if(btn){ btn.disabled = true; btn.textContent = "Enviando…"; }
    const saved = await saveLead(table, data);
    if(!saved){
      form.removeAttribute("aria-busy");
      if(btn){ btn.disabled = false; btn.textContent = originalLabel || "Tentar novamente"; }
      let error = form.querySelector(".form-error");
      if(!error){
        error = document.createElement("p");
        error.className = "form-error";
        error.setAttribute("role", "alert");
        form.appendChild(error);
      }
      error.textContent = "Não foi possível enviar agora. Tente novamente ou fale com a Tropa pelo WhatsApp.";
      return;
    }
    form.removeAttribute("aria-busy");
    form.style.display = "none";
    const ok = form.parentElement.querySelector(".form-ok");
    const download = form.getAttribute("data-download");
    if(ok){
      const wa = ok.querySelector("[data-wa-dyn]");
      if(wa){
        const msg = download
          ? `Oi! Acabei de baixar o material "${data.material||""}" da Tropa (${data.nome||""}). Quero entrar como creator.`
          : `Oi! Acabei de me cadastrar no site da Tropa (${data.nome||""}). Quero seguir.`;
        wa.href = waLink(msg);
      }
      const dl = ok.querySelector("[data-download-link]");
      if(dl && download) dl.href = download;
      ok.classList.add("show");
    }
    if(download){
      const a = document.createElement("a");
      a.href = download; a.setAttribute("download", "");
      document.body.appendChild(a); a.click(); a.remove();
    }
  });
});
