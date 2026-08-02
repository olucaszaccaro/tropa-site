# Tropa — somostropa.com.br

Site institucional multipágina da Tropa, com páginas para marcas e creators, materiais gratuitos, cases, integração com Supabase e CRM protegido em `painel.somostropa.com.br`.

## Estrutura principal

- `index.html`, `marca.html`, `creator.html` — aquisição e conversão.
- `materiais.html` e páginas de download — geração de leads.
- `painel.html`, `painel.js`, `painel.css` — CRM de leads.
- `app.js` — WhatsApp e envio dos formulários para `crm_leads`.
- `supabase/crm_leads.sql` — estrutura, políticas e permissões do CRM.
- `PRODUCT.md` — contexto estratégico e princípios do produto.

## Publicação

O repositório é publicado pela Vercel. O domínio principal serve o site e o subdomínio `painel.somostropa.com.br` direciona para o CRM.
