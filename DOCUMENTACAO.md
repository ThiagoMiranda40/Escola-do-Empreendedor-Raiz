# Documentação - Escola do Empreendedor Raiz

## 🚀 Como Usar a Plataforma

### 1. Criar Conta de Professor

1. Acesse a página inicial: `/`
2. Clique em **"Criar Conta de Professor"**
3. Preencha:
   - **Nome**: Seu nome completo
   - **Email**: Email válido
   - **Senha**: Mínimo 6 caracteres
4. Clique em **"Criar Conta"**
5. Você será redirecionado para o dashboard do professor

### 2. Criar Categorias

1. No backoffice, clique em **"Categorias"** na sidebar
2. Clique em **"+ Nova Categoria"**
3. Preencha:
   - **Nome**: Nome da categoria (ex: "Empreendedorismo")
   - **Slug**: Identificador único (auto-gerado a partir do nome)
4. Clique em **"Criar"**

**Exemplo de categorias:**
- Empreendedorismo
- Marketing Digital
- Finanças Pessoais
- Desenvolvimento Pessoal
- Tecnologia
- Vendas

### 3. Criar Cursos

1. No backoffice, clique em **"Cursos"** na sidebar
2. Clique em **"+ Novo Curso"**
3. Preencha:
   - **Título**: Nome do curso (obrigatório)
   - **Categoria**: Selecione uma categoria (obrigatório)
   - **Descrição**: Descrição do curso
   - **URL da Thumbnail**: Link para imagem de capa
   - **Status**: Rascunho ou Publicado
4. Clique em **"Criar Curso"**

### 4. Criar Módulos

1. Após criar um curso, você verá a seção **"Módulos"** na direita
2. Clique em **"+ Novo"**
3. Digite o nome do módulo
4. Clique em **"Criar"**

### 5. Criar Aulas

1. Clique no nome do módulo para abrir a página de edição
2. Clique em **"+ Nova Aula"**
3. Preencha:
   - **Título**: Nome da aula (obrigatório)
   - **Descrição**: Conteúdo da aula
   - **Embed Panda Video**: Cole aqui o código iframe do seu vídeo
4. Clique em **"Criar"**

### 6. Adicionar Embed de Vídeo (Panda Video)

1. No Panda Video, selecione seu vídeo
2. Clique em **"Share"** ou **"Embed"**
3. Copie o código `<iframe>` completo
4. Cole na aula no campo **"Embed Panda Video"**
5. O vídeo será renderizado automaticamente

**Exemplo de iframe do Panda:**
```html
<iframe src="https://player.pandavideo.com.br/..." width="100%" height="600" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

### 7. Publicar Conteúdo

**Para publicar um curso:**
1. Na página de cursos, clique no botão **"Publicar"** do curso
2. O status mudará de "Rascunho" para "Publicado"

**Para publicar uma aula:**
1. Na página do módulo, clique no botão **"Publicar"** da aula
2. Apenas aulas publicadas aparecerão para os alunos

### 8. Ver Cursos como Aluno

1. Acesse `/app/student/home`
2. Você verá todos os cursos publicados
3. Clique em um curso para ver seus módulos e aulas
4. Clique em uma aula para assistir ao vídeo

---

## 📊 Estrutura de Dados

### Tabelas Principais

**users_profile**
- `id`: UUID (referência ao auth.users)
- `name`: Nome do usuário
- `role`: STUDENT, TEACHER ou MANAGER
- `payment_status`: active, past_due, blocked
- `created_at`: Data de criação

**category**
- `id`: UUID
- `name`: Nome da categoria
- `slug`: Identificador único
- `sort_order`: Ordem de exibição
- `created_at`: Data de criação

**course**
- `id`: UUID
- `category_id`: Referência à categoria
- `teacher_id`: Referência ao professor
- `title`: Título do curso
- `description`: Descrição
- `thumb_url`: URL da imagem de capa
- `status`: draft ou published
- `created_at`: Data de criação
- `updated_at`: Data de atualização

**module**
- `id`: UUID
- `course_id`: Referência ao curso
- `title`: Título do módulo
- `sort_order`: Ordem dentro do curso
- `created_at`: Data de criação

**lesson**
- `id`: UUID
- `module_id`: Referência ao módulo
- `title`: Título da aula
- `description`: Descrição/conteúdo
- `panda_embed`: Código iframe do vídeo
- `sort_order`: Ordem dentro do módulo
- `status`: draft ou published
- `created_at`: Data de criação
- `updated_at`: Data de atualização

**resource**
- `id`: UUID
- `lesson_id`: Referência à aula
- `title`: Título do material
- `url`: Link ou URL do arquivo
- `type`: link ou file
- `created_at`: Data de criação

---

## 🔐 Segurança (RLS - Row Level Security)

Todas as tabelas têm políticas RLS ativadas:

- **Professores** podem CRUD apenas seus próprios cursos, módulos e aulas
- **Alunos** podem visualizar apenas cursos publicados
- **Cada usuário** pode editar apenas seu próprio perfil

---

## 🔧 Fluxo Completo de Teste

1. **Criar conta de professor**
   - Email: `professor@teste.com`
   - Senha: `123456`

2. **Criar categorias**
   - "Empreendedorismo"
   - "Marketing"

3. **Criar curso**
   - Título: "Como Começar um Negócio"
   - Categoria: "Empreendedorismo"
   - Status: Rascunho

4. **Criar módulo**
   - Título: "Fundamentos"

5. **Criar aula**
   - Título: "Introdução"
   - Embed: Cole um iframe de vídeo do Panda Video

6. **Publicar**
   - Publique o curso
   - Publique a aula

7. **Ver como aluno**
   - Acesse `/app/student/home`
   - Clique no curso
   - Clique na aula
   - Assista ao vídeo

---

## 🚀 Próximos Passos

- [ ] Adicionar sistema de comentários
- [ ] Implementar sistema de progresso do aluno
- [ ] Adicionar gamificação (XP, badges)
- [ ] Sistema de notificações por email
- [ ] Upload de materiais complementares
- [ ] Certificados de conclusão
- [ ] Analytics e relatórios

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o SQL foi executado no Supabase
2. Verifique as credenciais em `.env.local`
3. Teste as políticas RLS no Supabase Dashboard

---

**Versão**: 1.0.0  
**Última atualização**: Fevereiro 2026
