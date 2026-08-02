# Tropa — Site (somostropa.com.br)

Site institucional com **home + duas portas** (Sou Creator / Sou Marca), materiais, cases, formulários integrados ao Supabase, CTAs de WhatsApp e CRM protegido.

## Arquivos
- `index.html` — home (hero com ticker de vendas ao vivo + as duas portas).
- `creator.html` — captação de creators (benefícios, requisitos, FAQ, formulário).
- `marca.html` — comercial para marcas (entregas, método, formulário).
- `styles.css` — sistema de design (cores, tipografia, componentes).
- `app.js` — envio dos formulários para `crm_leads`, atribuição de origem/UTMs e links de WhatsApp.
- `painel.html` — CRM em `painel.somostropa.com.br`.

## Configuração
O WhatsApp e o projeto Supabase de produção ficam no objeto `TROPA`, no início de `app.js`. A chave usada no navegador é a chave pública `anon`; a proteção dos dados depende das políticas RLS definidas no banco.

## Supabase
Para preparar um projeto novo, execute `supabase/crm_leads.sql` no SQL Editor. Os formulários públicos podem inserir em `crm_leads`; leitura e atualização ficam restritas aos usuários cadastrados em `crm_admins`.

## Testar localmente
Abra `index.html` no navegador (duplo clique). Tudo funciona sem servidor.

## Publicar (Vercel + GitHub + Supabase)
1. Suba esta pasta `07_Site` para um repositório no **GitHub**.
2. Na **Vercel**, importe o repositório (framework: "Other" / site estático). Deploy.
3. Em Domains, adicione **somostropa.com.br** e aponte o DNS conforme a Vercel indicar.
4. Crie as tabelas no **Supabase** (SQL acima) e cole as chaves no `app.js`.

## Verificação antes de publicar
- Testar as páginas em 320 px, 390 px, tablet e desktop.
- Enviar um lead de creator e um de marca, confirmar no CRM e remover os registros de teste.
- Conferir links de WhatsApp, downloads e páginas de privacidade.
