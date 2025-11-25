const { app } = require('@azure/functions');
const { Client } = require('pg');
const { BlobServiceClient } = require('@azure/storage-blob');
const multipart = require('parse-multipart-data');

app.http('postObra', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const connectionStringDB = process.env.DATABASE_URL;
        const connectionStringStorage = process.env.AzureWebJobsStorage; 
        const contentType = request.headers.get('content-type');
        const boundary = multipart.getBoundary(contentType);
        
        const bodyBuffer = Buffer.from(await request.arrayBuffer());
        const parts = multipart.parse(bodyBuffer, boundary);

        const nome = parts.find(p => p.name === 'nome')?.data.toString();
        const artista = parts.find(p => p.name === 'artista')?.data.toString();
        const descricao = parts.find(p => p.name === 'descricao')?.data.toString();
        const imagemPart = parts.find(p => p.filename);

        if (!nome || !artista || !imagemPart) {
            return { status: 400, body: "Faltam dados obrigatórios (nome, artista ou imagem)." };
        }

        const clientDB = new Client({
            connectionString: connectionStringDB,
            ssl: connectionStringDB.includes('localhost') ? false : { rejectUnauthorized: false }
        });

        try {
            const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient('obrasarte');
            await containerClient.createIfNotExists({
                access: 'blob'
            });
            const nomeArquivo = `${Date.now()}_${imagemPart.filename}`;
            const blockBlobClient = containerClient.getBlockBlobClient(nomeArquivo);
            
            await blockBlobClient.upload(imagemPart.data, imagemPart.data.length);

            await clientDB.connect();
            const query = 'INSERT INTO obras (nome, artista, descricao, nome_arquivo_imagem) VALUES ($1, $2, $3, $4) RETURNING *';
            const values = [nome, artista, descricao, nomeArquivo];
            
            const res = await clientDB.query(query, values);

            return {
                status: 201,
                jsonBody: res.rows[0]
            };

        } catch (err) {
            context.error(err);
            return { status: 500, body: `Erro interno: ${err.message}` };
        } finally {
            await clientDB.end();
        }
    }
});