const { app } = require('@azure/functions');
const { Client } = require('pg');

app.http('getObras', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const connectionString = process.env.DATABASE_URL;
        
        if (!connectionString) {
            return { status: 500, body: "Erro: DATABASE_URL não configurada." };
        }

        const client = new Client({
            connectionString: connectionString,
            ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false } 
        });

        try {
            await client.connect();
            
            const res = await client.query('SELECT * FROM obras');
            
            const storageBaseUrl = process.env.STORAGE_BASE_URL || ""; 
            
            const obrasFormatadas = res.rows.map(obra => ({
                id: obra.id,
                nome: obra.nome,
                artista: obra.artista,
                descricao: obra.descricao,
                url_imagem: `${storageBaseUrl}/${obra.nome_arquivo_imagem}`
            }));

            return {
                status: 200,
                jsonBody: obrasFormatadas
            };
            
        } catch (err) {
            context.log(err);
            return { 
                status: 500, 
                body: `Erro ao conectar no banco: ${err.message}` 
            };
        } finally {
            await client.end();
        }
    }
});