# Dockerfile
# Use uma imagem Node.js oficial. Alpine é uma boa escolha por ser leve.
# Verifique se a versão do Node (ex: 18, 20) é compatível com seu projeto.
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copie package.json e package-lock.json (ou yarn.lock se você usar yarn)
# Isso ajuda a aproveitar o cache de camadas do Docker se suas dependências não mudarem.
COPY package*.json ./

# Instale apenas as dependências de produção para manter a imagem menor
# 'npm ci' é geralmente recomendado para instalações consistentes se você tem um package-lock.json
RUN npm ci --omit=dev
# Se preferir npm install, ou não tiver package-lock.json:
# RUN npm install --omit=dev

# Copie o restante do código da sua aplicação para o diretório de trabalho no container
# Isso inclui sua pasta src/, a pasta public/, e o dados.json inicial (se houver).
COPY . .

# A variável de ambiente PORT é definida pelo Fly.io (geralmente 8080).
# Seu app usa 'process.env.PORT || 3000', então ele escutará na porta que o Fly.io fornecer.
# O comando EXPOSE documenta qual porta o container está escutando.
EXPOSE 8080 
# Se seu fallback é 3000 e você quer testar localmente com Docker na 3000,
# você pode usar EXPOSE 3000, mas para Fly.io o importante é que seu app
# respeite process.env.PORT e o fly.toml esteja configurado para essa porta interna.

# Comando para iniciar sua aplicação quando o container iniciar.
# Ajustado para seu arquivo de entrada src/index.js
CMD [ "node", "src/index.js" ]