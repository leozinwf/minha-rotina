# Minha Rotina

Planejador pessoal simples para organizar o dia, a semana e o mês sem transformar organização em mais uma obrigação.

## O que já existe

- **Hoje**: prioridades, rotina, tarefas e encerramento do dia
- **Semana**: visão rápida de carga por dia
- **Mês**: calendário completo com rotinas e tarefas
- **Rotinas**: criar, editar e remover recorrências
- **Cores**: trabalho, saúde, estudo, casa, pessoal, importante e neutro
- **Copiar mês anterior**: duplica tarefas pontuais para o mês atual
- **Banco local**: IndexedDB, sem configuração externa
- **Migração**: tenta reaproveitar os dados da primeira versão em `localStorage`

## Agenda inicial

A primeira configuração inclui exemplos baseados na rotina planejada para setembro de 2026:

- trabalho de segunda a sexta
- academia em dias de home office
- estudo diário
- passeio com os cachorros
- lixo segunda, quarta e sexta
- reciclável sábado
- roupa 3x por semana
- limpeza rápida, banheiro e organização da casa
- preparo de marmitas/congelados no domingo
- planejamento semanal e planejamento rápido do dia seguinte
- blocos de projeto pessoal e noite livre
- dias de escritório como tarefas editáveis

## Rodar localmente

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Persistência

A V2 usa **IndexedDB**, que é um banco embutido no navegador. Isso mantém o projeto simples e não exige conta, servidor ou variáveis de ambiente no Vercel.

Se depois for importante abrir no celular e no computador com os mesmos dados, o próximo passo recomendado é Supabase com autenticação simples e sincronização da mesma estrutura de dados.
