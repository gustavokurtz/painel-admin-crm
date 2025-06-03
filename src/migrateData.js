import { readFile, writeFile } from 'fs/promises';
import path from 'path';

async function migrateData() {
    const dataPath = '/app/data/dados.json';
    
    try {
        // Try to read the existing data
        const rawData = await readFile(dataPath, 'utf-8');
        const data = JSON.parse(rawData);
        
        if (!Array.isArray(data)) {
            console.log('Dados não são um array. Iniciando com array vazio.');
            await writeFile(dataPath, '[]');
            return;
        }

        // Validate and fix each record
        const migratedData = data.map((item, index) => {
            const newItem = {
                id: item.id || index + 1,
                empresa: item.empresa || '',
                site: item.site || '',
                concluido: typeof item.concluido === 'boolean' ? item.concluido : false
            };
            return newItem;
        });

        // Find max ID and ensure no duplicates
        let maxId = 0;
        const finalData = migratedData.map(item => {
            maxId = Math.max(maxId, item.id);
            return item;
        });

        // Fix any duplicate IDs
        finalData.forEach(item => {
            if (finalData.filter(i => i.id === item.id).length > 1) {
                maxId++;
                item.id = maxId;
            }
        });

        // Save the migrated data
        await writeFile(dataPath, JSON.stringify(finalData, null, 2));
        console.log('Migração de dados concluída com sucesso.');
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, create empty array
            await writeFile(dataPath, '[]');
            console.log('Arquivo de dados criado com array vazio.');
        } else {
            console.error('Erro durante a migração:', error);
        }
    }
}

// Run migration
migrateData();
