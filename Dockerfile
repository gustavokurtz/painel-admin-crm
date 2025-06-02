# Use a imagem oficial do Node.js como base
FROM node:18-alpine

# Criar e definir o diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o resto dos arquivos do projeto
COPY . .

# Criar um volume para persistir dados.json
VOLUME /app/data

# Expor a porta que a aplicação usa
EXPOSE 3000

# Definir variáveis de ambiente
ENV PORT=3000
ENV ADMIN_PASSWORD=admin123

# Comando para iniciar a aplicação
CMD ["node", "src/index.js"]
