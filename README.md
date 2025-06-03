# API de Gerenciamento de Empresas

Esta é uma API REST para gerenciamento de empresas, construída com Node.js e Express, containerizada com Docker.

## Requisitos

- Docker instalado
- Node.js 18+ (para desenvolvimento local)
- npm (para desenvolvimento local)

## Estrutura do Projeto

```
.
├── data/               # Diretório para persistência dos dados
│   └── dados.json     # Arquivo JSON com os dados das empresas
├── src/
│   └── index.js       # Código principal da aplicação
├── Dockerfile         # Configuração do container
├── package.json       # Dependências do projeto
└── run.sh            # Script auxiliar para build e execução
```

## Instalação e Execução

### Método 1: Usando o script automatizado

1. Clone o repositório
2. Execute o script run.sh:
```bash
./run.sh
```

### Método 2: Comandos Docker manuais

1. Construa a imagem:
```bash
docker build -t empresa-backend .
```

2. Crie o diretório de dados:
```bash
mkdir -p data
```

3. Execute o container:
```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name empresa-backend-container \
  empresa-backend
```

## Gerenciamento do Container

### Parar o container
```bash
docker stop empresa-backend-container
```

### Iniciar o container (após parado)
```bash
docker start empresa-backend-container
```

### Remover o container
```bash
docker rm empresa-backend-container
```

### Ver logs do container
```bash
docker logs empresa-backend-container
```

## Endpoints da API

### Públicos
- `GET /dados` - Lista todas as empresas

### Administrativos (requer senha)
- `POST /admin/replace-all` - Substitui todos os dados
- `POST /admin/add-multiple` - Adiciona múltiplos registros
- `POST /admin/clear-all` - Remove todos os dados
- `PUT /admin/edit/:index` - Edita um registro específico
- `DELETE /admin/delete/:index` - Remove um registro específico
- `POST /admin/upload-json` - Faz upload de um arquivo JSON
- `POST /admin/password` - Verifica senha de administrador

## Interface Administrativa

Acesse a interface administrativa em:
- http://localhost:3000/admin

## Persistência de Dados

Os dados são armazenados no arquivo `data/dados.json` e persistidos através de um volume Docker. 
O diretório `data` é mapeado para `/app/data` dentro do container, garantindo que os dados sobrevivam 
a reinicios do container.

## Variáveis de Ambiente

- `PORT`: Porta em que a aplicação vai rodar (default: 3000)
- `ADMIN_PASSWORD`: Senha para acesso administrativo (default: admin123)

## Desenvolvimento Local

1. Instale as dependências:
```bash
npm install
```

2. Execute a aplicação:
```bash
node src/index.js
```

## Solução de Problemas

### Dados não estão persistindo
1. Verifique se o diretório `data` existe
2. Verifique as permissões:
```bash
chmod -R 777 data
```

### Container não inicia
1. Verifique os logs:
```bash
docker logs empresa-backend-container
```

2. Verifique se a porta 3000 não está em uso:
```bash
lsof -i :3000
```

### Erro ao construir imagem
1. Limpe o cache do Docker:
```bash
docker builder prune
```

2. Reconstrua sem cache:
```bash
docker build --no-cache -t empresa-backend .
```
