import express from 'express';
import { readFile, writeFile } from 'fs/promises';
import cors from "cors";
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Senha simples para administração (use variável de ambiente em produção)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public')); // Para servir arquivos estáticos

// Função auxiliar para ler dados
async function readData() {
    try {
        const data = await readFile('dados.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return []; // Retorna array vazio se arquivo não existir
    }
}

// Função auxiliar para escrever dados
async function writeData(data) {
    await writeFile('dados.json', JSON.stringify(data, null, 2));
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
        const data = await readData();
        data.push(newData);
        await writeData(data);
        res.status(201).json(newData);
    } catch (error) {
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

// Adicionar múltiplos registros
app.post('/admin/add-multiple', checkAdminAuth, async (req, res) => {
    try {
        const { data } = req.body;
        const existingData = await readData();
        existingData.push(...data);
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
        
        data[index] = updatedItem;
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
});