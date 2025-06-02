#!/bin/bash

# Criar diretório de dados se não existir
mkdir -p data
chmod 777 data

# Se o arquivo dados.json existe na raiz, copiar para data/
if [ -f dados.json ]; then
    cp dados.json data/dados.json
    chmod 666 data/dados.json
fi

# Parar e remover container existente se houver
docker stop empresa-backend-container 2>/dev/null || true
docker rm empresa-backend-container 2>/dev/null || true

# Construir a imagem
docker build -t empresa-backend .

# Executar o container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name empresa-backend-container \
  empresa-backend

echo "Container iniciado! Acesse:"
echo "API: http://localhost:3000"
echo "Admin: http://localhost:3000/admin"
