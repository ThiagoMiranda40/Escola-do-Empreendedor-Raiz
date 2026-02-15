const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Erro: Variáveis de ambiente não encontradas em .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnostic() {
    console.log('--- DIAGNÓSTICO SUPABASE ---');

    const tables = ['users_profile', 'course', 'category', 'module', 'lesson'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ Tabela [${table}]: Erro ou Sem Acesso (${error.message})`);
        } else {
            console.log(`✅ Tabela [${table}]: Conexão OK (${count} registros encontrados)`);
        }
    }
}

diagnostic();
