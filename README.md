# Campus Online - Supabase Edition

Plataforma educacional moderna construída com **Next.js 14**, **Supabase Auth**, **Postgres** e **RLS (Row Level Security)**.

## 🎯 Características

- ✅ Autenticação com Supabase Auth (email/senha)
- ✅ CRUD completo de categorias, cursos, módulos e aulas
- ✅ Embed de vídeos Panda Video
- ✅ RLS para segurança de dados
- ✅ Interface responsiva com Tailwind CSS
- ✅ Backoffice do professor totalmente funcional
- ✅ Home do aluno com cursos publicados

## 📋 Pré-requisitos

- Node.js 18+
- Conta Supabase (gratuita)
- Panda Video (para vídeos, opcional)

## 🚀 Setup Rápido

### 1. Clonar o projeto

```bash
cd /home/ubuntu/escola-raiz-supabase
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

Você encontra essas informações em:
- Supabase Dashboard → Project Settings → API

### 4. Executar o SQL no Supabase

1. Vá para **Supabase Dashboard → SQL Editor**
2. Crie uma nova query
3. Cole o conteúdo de `supabase/schema.sql`
4. Execute
5. Crie uma nova query (ou adicione à anterior)
6. Cole o conteúdo de `supabase/migrations/20260216221833_create_schools_table.sql`
7. Execute para criar a tabela `schools` e a "Escola do Empreendedor Raiz"
8. Crie uma nova query (ou adicione à anterior)
9. Cole o conteúdo de `supabase/migrations/20260216222522_create_school_members_table.sql`
10. Execute para criar a tabela `school_members`
11. Crie uma nova query (ou adicione à anterior)
12. Cole o conteúdo de `supabase/migrations/20260216224637_add_school_id_multi_tenant.sql`
13. Execute para adicionar suporte multi-tenant e migrar dados existentes para a "Escola do Empreendedor Raiz"

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 📁 Estrutura de Pastas

```
app/
├── page.tsx                 # Home pública
├── login/                   # Página de login
├── signup-professor/        # Signup de professor
├── teacher/                 # Backoffice do professor
│   ├── layout.tsx
│   ├── dashboard/
│   ├── categories/
│   ├── courses/
│   └── modules/
└── app/student/            # Área do aluno
    ├── home/
    ├── course/
    └── lesson/

lib/
└── supabase.ts            # Cliente Supabase

supabase/
└── schema.sql             # Schema e RLS

middleware.ts              # Proteção de rotas
```

## 🔐 Autenticação

### Criar conta de professor

1. Acesse `/signup-professor`
2. Preencha nome, email e senha
3. Uma entrada em `users_profile` será criada com `role = 'TEACHER'`

### Login

1. Acesse `/login`
2. Use email e senha

### Proteção de rotas

- Rotas `/teacher/*` exigem autenticação e role `TEACHER`
- Rotas `/app/student/*` são públicas (qualquer um pode acessar)

## 📚 Fluxo de Uso

### Como Professor

1. Criar conta em `/signup-professor`
2. Ir para `/teacher/dashboard`
3. Criar categorias em `/teacher/categories`
4. Criar cursos em `/teacher/courses`
5. Adicionar módulos ao curso
6. Adicionar aulas aos módulos
7. Publicar curso e aulas
8. Alunos verão em `/app/student/home`

### Como Aluno

1. Acessar `/app/student/home`
2. Ver cursos publicados
3. Clicar em um curso para ver módulos
4. Clicar em uma aula para assistir vídeo

## 🎥 Integração com Panda Video

1. Faça upload do vídeo no Panda Video
2. Clique em "Share" ou "Embed"
3. Copie o código `<iframe>`
4. Cole na aula no campo "Embed Panda Video"

Exemplo:
```html
<iframe src="https://player.pandavideo.com.br/..." width="100%" height="600" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

## 🗄️ Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `users_profile` | Perfil do usuário (role, payment_status) |
| `category` | Categorias de cursos |
| `course` | Cursos (draft/published) |
| `module` | Módulos dentro de cursos |
| `lesson` | Aulas dentro de módulos |
| `resource` | Materiais complementares |

### RLS (Row Level Security)

Todas as tabelas têm RLS ativada:

- Professores podem CRUD apenas seus próprios cursos
- Alunos veem apenas cursos publicados
- Cada usuário edita apenas seu próprio perfil

## 🚀 Deploy

### Vercel (recomendado)

```bash
npm install -g vercel
vercel
```

### Outros

O projeto é um Next.js padrão e pode ser deployado em:
- Netlify
- Railway
- Render
- AWS Amplify

## 📝 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | Sim |

## 🐛 Troubleshooting

### Erro: "Permission denied" ao criar curso

- Verifique se o SQL foi executado no Supabase
- Verifique se o usuário tem role `TEACHER`
- Verifique as políticas RLS em Supabase Dashboard

### Vídeo não aparece

- Verifique se o iframe é válido
- Verifique se o domínio do Panda Video é permitido
- Teste o iframe em um navegador

### Não consegue fazer login

- Verifique as credenciais em `.env.local`
- Verifique se o usuário existe em Supabase Auth
- Verifique se existe entrada em `users_profile`

## 📚 Documentação Completa

Veja `DOCUMENTACAO.md` para instruções detalhadas de uso.

## 📄 Licença

MIT

## 👨‍💻 Desenvolvido com

- [Next.js 14](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

---

**Versão**: 1.0.0  
**Status**: MVP Funcional
