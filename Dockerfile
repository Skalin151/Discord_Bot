# Use Node.js 20 LTS como base
FROM node:20-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache python3 make g++

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências de produção
RUN npm install --production --no-optional && \
    npm cache clean --force

# Copiar o código da aplicação
COPY . .

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Mudar para o usuário não-root
USER nodejs

# Expor a porta (para health checks)
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=400 --expose-gc"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:prod"]
