# Tropa — Site (somostropa.com.br)

Site institucional com **home + duas portas** (Sou Creator / Sou Marca), formulários prontos pro Supabase e CTAs de WhatsApp.

## Arquivos
- `index.html` — home (hero com ticker de vendas ao vivo + as duas portas).
- `creator.html` — captação de creators (benefícios, requisitos, FAQ, formulário).
- `marca.html` — comercial para marcas (entregas, método, formulário).
- `styles.css` — sistema de design (cores, tipografia, componentes).
- `app.js` — ticker ao vivo + envio dos formulários (Supabase) + links de WhatsApp.

## Antes de publicar — preencher em `app.js`
No topo do arquivo, no objeto `TROPA`:
```js
whatsapp: "55DDDXXXXXXXXX",   // seu número
supabaseUrl: "https://xxxx.supabase.co",
supabaseAnonKey: "sua-chave-anon-publica",
```
Sem o Supabase preenchido, o site funciona normalmente — o lead é só registrado no console e o usuário segue pelo WhatsApp.

## Supabase — criar as tabelas (SQL)
No Supabase → SQL Editor, rode:
```sql
create table leads_creator (
  id uuid primary key default gen_random_uuid(),
  nome text, tiktok text, seguidores text, nicho text, whatsapp text,
  criado_em timestamptz default now()
);
create table leads_marca (
  id uuid primary key default gen_random_uuid(),
  empresa text, nome text, segmento text, ja_vende text,
  whatsapp text, email text, criado_em timestamptz default now()
);
alter table leads_creator enable row level security;
alter table leads_marca  enable row level security;
create policy "insert_creator" on leads_creator for insert to anon with check (true);
create policy "insert_marca"   on leads_marca   for insert to anon with check (true);
```
(Política só de INSERT para o público; leitura fica restrita ao painel do Supabase.)

## Testar localmente
Abra `index.html` no navegador (duplo clique). Tudo funciona sem servidor.

## Publicar (Vercel + GitHub + Supabase)
1. Suba esta pasta `07_Site` para um repositório no **GitHub**.
2. Na **Vercel**, importe o repositório (framework: "Other" / site estático). Deploy.
3. Em Domains, adicione **somostropa.com.br** e aponte o DNS conforme a Vercel indicar.
4. Crie as tabelas no **Supabase** (SQL acima) e cole as chaves no `app.js`.

## A fazer (conteúdo)
- Trocar `[WhatsApp]` / `@somos.tropa` / e-mail pelos reais.
- Substituir as estatísticas placeholder (`+0 creators`, `R$ 0`) quando tiver números.
- Trocar o ticker de vendas (em `app.js`, lista `SALES`) por exemplos reais quando quiser.
