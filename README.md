# WhatsApp Audit

Este projeto automatiza a auditoria de grupos do WhatsApp utilizando Node.js e a biblioteca `whatsapp-web.js`. Ele permite validar os membros de um grupo com base em uma lista de contatos fornecida em um arquivo CSV, adicionando e removendo participantes conforme necessário.

## Funcionalidades
- **Autenticação automática** via QR code e persistência de sessão.
- **Leitura de contatos** de um arquivo CSV.
- **Busca de grupos** pelo nome.
- **Validação de membros**: compara os membros do grupo com os contatos do CSV, removendo e adicionando conforme necessário.
- **Limpeza de dados de autenticação e cache** após execução.

## Estrutura dos arquivos
- `WhatsApp-Audit.js`: Script principal de auditoria e validação de grupos.
- `contatos.csv`: Lista de números de telefone para validação dos membros do grupo.

## Como usar
1. Instale as dependências:
   ```bash
   npm install whatsapp-web.js qrcode-terminal csv-parser
   ```
2. Adicione os números de telefone no arquivo `contatos.csv` no formato:
   ```csv
   numero
   5511999999999
   5511888888888
   ...
   ```
3. Execute o script:
   ```bash
   node WhatsApp-Audit.js
   ```
4. Escaneie o QR code exibido no terminal com o WhatsApp.
5. O script irá listar os grupos disponíveis e validar os membros do grupo especificado.

## Principais funções
- `lerContatosCSV(caminhoArquivo)`: Lê e formata os números do arquivo CSV.
- `buscarIdDoGrupoPorNome(nomeGrupo)`: Busca o grupo pelo nome e retorna o ID.
- `validarGrupoPorId(idGrupo)`: Valida os membros do grupo, removendo e adicionando conforme necessário.

## Observações
- O script remove pastas de autenticação e cache ao final para garantir privacidade.
- Modifique o nome do grupo desejado diretamente no código (`nomeDoGrupo`).

## Licença
Este projeto é distribuído sob a licença MIT.