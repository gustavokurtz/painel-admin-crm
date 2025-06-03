import express from 'express';
import { readFile, writeFile, mkdir } from 'fs/promises';
import cors from "cors";
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Senha simples para administração (use variável de ambiente em produção)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Função para garantir que o diretório de dados existe
async function ensureDataDirectoryExists() {
    try {
        await mkdir('/app/data', { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

app.use(cors({ origin: '*' }));
app.use(express.json());


// Função auxiliar para ler dados
async function readData() {
    await ensureDataDirectoryExists();
    try {
        const data = await readFile('/app/data/dados.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeData([]); // Cria o arquivo se não existir
            return [];
        }
        throw error;
    }
}

// Função auxiliar para escrever dados
async function writeData(data) {
    await ensureDataDirectoryExists();
    try {
        await writeFile('/app/data/dados.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erro ao escrever dados:', error);
        throw error;
    }
}

// Middleware para verificar senha de admin
function checkAdminAuth(req, res, next) {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Senha incorreta' });
    }
    next();
}

// Rotas existentes
app.get("/dados", async (req, res) => {
    try {
        const data = await readData();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao ler os dados' });
    }
});

app.post("/dados", async (req, res) => {
    try {
        const newData = req.body;
        
        // Validate required fields
        if (!newData.empresa || typeof newData.empresa !== 'string') {
            return res.status(400).json({ error: 'Campo "empresa" é obrigatório e deve ser uma string' });
        }
        if (!newData.site || typeof newData.site !== 'string') {
            return res.status(400).json({ error: 'Campo "site" é obrigatório e deve ser uma string' });
        }

        const data = await readData();
        const newId = data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
        const dataWithId = { 
            id: newId, 
            empresa: newData.empresa,
            site: newData.site,
            concluido: false // Valor padrão para novos registros
        };
        
        data.push(dataWithId);
        await writeData(data);
        res.status(201).json(dataWithId);
    } catch (error) {
        console.error('Erro ao adicionar dados:', error);
        res.status(500).json({ error: 'Erro ao adicionar os dados' });
    }
});

// NOVAS ROTAS ADMINISTRATIVAS

// Rota para interface de administração
app.get('/admin', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'admin.html'));
});

// Substituir todos os dados (equivalente a trocar o JSON)
app.post('/admin/replace-all', checkAdminAuth, async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'O campo data deve ser um array' });
        }

        // Validate all items
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (!item.id || typeof item.id !== 'number') {
                return res.status(400).json({ error: `Item ${i}: Campo "id" é obrigatório e deve ser um número` });
            }
            if (!item.empresa || typeof item.empresa !== 'string') {
                return res.status(400).json({ error: `Item ${i}: Campo "empresa" é obrigatório e deve ser uma string` });
            }
            if (!item.site || typeof item.site !== 'string') {
                return res.status(400).json({ error: `Item ${i}: Campo "site" é obrigatório e deve ser uma string` });
            }
            if (typeof item.concluido !== 'boolean') {
                return res.status(400).json({ error: `Item ${i}: Campo "concluido" deve ser true ou false` });
            }
        }

        await writeData(data);
        res.status(200).json({ message: 'Dados substituídos com sucesso', count: data.length });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao substituir dados' });
    }
});

// Substituir todos os dados (equivalente a trocar o JSON)
app.post('/admin/password', checkAdminAuth, async (req, res) => {
    try {
        res.status(200).json({ message: 'Logado com sucesso'});
    } catch (error) {
        res.status(500).json({ error: 'Erro ao logar' });
    }
});

app.put('/update-status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { concluido } = req.body;
        const data = await readData();

        // Verifica se o valor de 'concluido' é booleano
        if (typeof concluido !== 'boolean') {
            return res.status(400).json({ error: "'concluido' deve ser true ou false" });
        }

        // Encontra o índice do usuário no array
        const index = data.findIndex(item => item.id === parseInt(id));

        if (index === -1) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        // Atualiza apenas o campo 'concluido'
        data[index].concluido = concluido;

        // Salva os dados atualizados
        await writeData(data);

        // Retorna o usuário atualizado
        return res.status(200).json({
            message: 'Status "concluido" atualizado com sucesso',
            user: data[index]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// Adicionar múltiplos registros
app.post('/admin/add-multiple', checkAdminAuth, async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'O campo data deve ser um array' });
        }

        // Validate all items before adding any
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (!item.empresa || typeof item.empresa !== 'string') {
                return res.status(400).json({ error: `Item ${i}: Campo "empresa" é obrigatório e deve ser uma string` });
            }
            if (!item.site || typeof item.site !== 'string') {
                return res.status(400).json({ error: `Item ${i}: Campo "site" é obrigatório e deve ser uma string` });
            }
        }

        const existingData = await readData();
        let maxId = existingData.length > 0 ? Math.max(...existingData.map(item => item.id)) : 0;
        
        const newData = data.map(item => ({
            id: ++maxId,
            empresa: item.empresa,
            site: item.site,
            concluido: false // Default value for new records
        }));
        
        existingData.push(...newData);
        await writeData(existingData);
        res.status(200).json({ message: 'Dados adicionados com sucesso', added: data.length });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar dados' });
    }
});

// Limpar todos os dados
app.post('/admin/clear-all', checkAdminAuth, async (req, res) => {
    try {
        await writeData([]);
        res.status(200).json({ message: 'Todos os dados foram removidos' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao limpar dados' });
    }
});

// Editar um registro específico por índice
app.put('/admin/edit/:index', checkAdminAuth, async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const { updatedItem } = req.body;
        const data = await readData();
        
        if (index < 0 || index >= data.length) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        // Validate required fields
        if (!updatedItem.empresa || typeof updatedItem.empresa !== 'string') {
            return res.status(400).json({ error: 'Campo "empresa" é obrigatório e deve ser uma string' });
        }
        if (!updatedItem.site || typeof updatedItem.site !== 'string') {
            return res.status(400).json({ error: 'Campo "site" é obrigatório e deve ser uma string' });
        }
        if (typeof updatedItem.concluido !== 'boolean') {
            return res.status(400).json({ error: 'Campo "concluido" deve ser true ou false' });
        }

        // Preserve the original ID and update other fields
        data[index] = {
            id: data[index].id,
            empresa: updatedItem.empresa,
            site: updatedItem.site,
            concluido: updatedItem.concluido
        };
        
        await writeData(data);
        res.status(200).json({ message: 'Registro editado com sucesso', item: updatedItem });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao editar dados' });
    }
});

// Remover um registro específico por índice
app.delete('/admin/delete/:index', checkAdminAuth, async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const data = await readData();
        
        if (index < 0 || index >= data.length) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        
        const removedItem = data.splice(index, 1)[0];
        await writeData(data);
        res.status(200).json({ message: 'Registro removido com sucesso', removed: removedItem });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover dados' });
    }
});

// Upload de arquivo JSON
app.post('/admin/upload-json', checkAdminAuth, async (req, res) => {
    try {
        const { jsonContent } = req.body;
        const parsedData = JSON.parse(jsonContent);
        await writeData(parsedData);
        res.status(200).json({ message: 'JSON carregado com sucesso', count: parsedData.length });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar JSON ou dados inválidos' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Admin interface: http://localhost:${PORT}/admin`);
    ensureDataDirectoryExists().catch(console.error);
});