# Discord_Bot
Bot do Skalin

## 🛠️ Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Skalin151/Discord_Bot.git
   cd Discord_Bot
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o ambiente:**
   ```bash
   # Copie o arquivo de exemplo
   copy .env.example .env
   
   # Edite o arquivo .env e adicione seu token do Discord
   ```

4. **Execute o bot:**
   ```bash
   npm start
   ```

## 🎯 Comandos Disponíveis

### Comando Purge (Duas formas de uso)

- **Prefixo:** `!purge [quantidade]` 
- **Slash:** `/purge [quantidade]`

Apaga mensagens do canal atual (máximo 100, requer permissão "Gerenciar Mensagens")

## 🔐 Segurança

- O arquivo `.env` contém informações sensíveis e **nunca** deve ser enviado para o GitHub
- Use sempre o arquivo `.env.example` como template
