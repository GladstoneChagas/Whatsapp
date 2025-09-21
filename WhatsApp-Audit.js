// 📦 Importa bibliotecas necessárias
const { Client, LocalAuth } = require('whatsapp-web.js'); // Cliente WhatsApp Web com autenticação local
const qrcode = require('qrcode-terminal'); // Geração de QR code no terminal
const fs = require('fs'); // Manipulação de arquivos
const csv = require('csv-parser'); // Leitura de arquivos CSV

// 🚀 Inicializa o cliente WhatsApp com autenticação persistente
const client = new Client({
  authStrategy: new LocalAuth() // Mantém a sessão ativa entre execuções
});

// 📲 Exibe QR code no terminal para login
client.on('qr', qr => {
  console.log('📱 Escaneie este QR code com seu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

// 📁 Função para ler números de telefone de um arquivo CSV
function lerContatosCSV(caminhoArquivo) {
    return new Promise((resolve, reject) => {
      const contatos = [];
  
      fs.createReadStream(caminhoArquivo)
        .pipe(csv())
        .on('data', (row) => {
          if (row.numero) {
            const numeroFormatado = row.numero.replace(/\D/g, ''); // Remove caracteres não numéricos
            console.log(`📥 Número encontrado: ${row.numero} → formatado: ${numeroFormatado}`);
            contatos.push(numeroFormatado);
          }
        })
        .on('end', () => {
          console.log(`📦 Lista final de números formatados:`, contatos);
          resolve(contatos); // Finaliza leitura e retorna os números
        })
        .on('error', reject); // Trata erro de leitura
    });
}

// 🔍 Função para buscar um grupo pelo nome
async function buscarIdDoGrupoPorNome(nomeGrupo) {
  const chats = await client.getChats(); // Obtém todos os chats
  const grupos = chats.filter(chat => chat.isGroup); // Filtra apenas os grupos

  // Busca grupo por nome (case insensitive)
  const grupo = grupos.find(g => g.name.toLowerCase() === nomeGrupo.toLowerCase());

  if (!grupo) {
    throw new Error(`Grupo "${nomeGrupo}" não encontrado.`);
  }

  const idGrupo = grupo.id._serialized;
  console.log(`✅ Grupo encontrado: ${grupo.name} | ID: ${idGrupo}`);

  return idGrupo;
}

async function validarGrupoPorId(idGrupo) {
  try {
    const numerosEsperados = await lerContatosCSV('contatos.csv');

    // ⚠️ Recarrega todos os chats para forçar atualização da instância
    await client.getChats(); // força sincronização interna

    // ⚡ Reobtém o grupo após sincronização
    const grupo = await client.getChatById(idGrupo);

    // ⚠️ Aguarda um tempo mínimo para garantir que a instância seja atualizada
    await new Promise(resolve => setTimeout(resolve, 1000));

    const participantes = grupo.participants.map(p => p.id.user);
    console.log(`📛 Membros atuais: ${participantes.join(', ')}`);

    const numerosParaRemover = participantes.filter(numero => !numerosEsperados.includes(numero));
    const numerosParaAdicionar = numerosEsperados.filter(numero => !participantes.includes(numero));

    const idsParaRemover = numerosParaRemover.map(numero => `${numero}@c.us`);
    const idsParaAdicionar = numerosParaAdicionar.map(numero => `${numero}@c.us`);

    if (idsParaRemover.length > 0) {
      console.log(`🚫 Removendo: ${idsParaRemover.join(', ')}`);
      await removeParticipants(grupo, idsParaRemover);
    } else {
      console.log('✅ Nenhum membro extra encontrado.');
    }

    if (idsParaAdicionar.length > 0) {
      console.log(`➕ Adicionando: ${idsParaAdicionar.join(', ')}`);
      await addParticipantsIfMissing(grupo, numerosParaAdicionar);
    } else {
      console.log('✅ Todos os contatos esperados já estão no grupo.');
    }

    console.log('🏁 Validação concluída.');
    await limpeza();
    process.exit();
  } catch (err) {
    console.error(`⚠️ Erro ao validar grupo: ${err.message}`);
    process.exit(1);
  }
}


async function removeParticipants(grupo, listaDeIdsRemover) {
    console.log(`🔍 Tentando remover ${listaDeIdsRemover.length} participantes...`);
  
    for (const id of listaDeIdsRemover) {
      const removenumber = `${id}`;
      console.log(`➡️ Removendo: ${removenumber}`);
      try {
        await grupo.removeParticipants([removenumber]); // tenta um por vez
        console.log(`✅ Removido com sucesso: ${removenumber}`);
      } catch (erro) {
        console.error(`⚠️ Falha ao remover ${removenumber}: ${erro.message}`);
      }
    }
  
    console.log('🏁 Remoção concluída.');
  }

async function addParticipantsIfMissing(grupo, listaDeIdsAdd) {
    console.log(`🔍 Verificando ${listaDeIdsAdd.length} números para adicionar...`);
  
    // Extrai os números atuais do grupo
    const numerosGrupo = grupo.participants.map(p => p.id.user);
  
    for (const numero of listaDeIdsAdd) {
      const id = `${numero}@c.us`;
  
      if (!numerosGrupo.includes(numero)) {
        try {
          console.log(`➕ Adicionando: ${id}`);
          await grupo.addParticipants([id]);
          console.log(`✅ Adicionado com sucesso: ${id}`);
        } catch (erro) {
          console.error(`⚠️ Falha ao adicionar ${id}: ${erro.message}`);
        }
      } else {
        console.log(`ℹ️ Já está no grupo: ${id}`);
      }
    }
  
    console.log('🏁 Adição concluída.');
  }

async function limpeza() {
  // 🧹 Remoção de pastas recursiva (síncrona)
  const path = require('path');

  const pastasParaRemover = [
    path.join(__dirname, '.wwebjs_auth'),
    path.join(__dirname, '.wwebjs_cache')
  ];

  for (const pasta of pastasParaRemover) {
    try {
      fs.rmSync(pasta, { recursive: true, force: true });
      console.log(`🧹 Pasta removida com sucesso: ${pasta}`);
    } catch (err) {
      console.error(`⚠️ Erro ao remover pasta ${pasta}: ${err.message}`);
    }
  }
}



client.on('ready', async () => {
    console.log('✅ Cliente conectado ao WhatsApp!');
  
    const chats = await client.getChats();
    const grupos = chats.filter(chat => chat.isGroup);
  
    console.log('📋 Grupos disponíveis:');
    grupos.forEach(grupo => {
      console.log(`- Nome: ${grupo.name} | ID: ${grupo.id._serialized}`);
    });
  
    const nomeDoGrupo = 'teste'; // ← nome do grupo desejado
  
    try {
      const idGrupo = await buscarIdDoGrupoPorNome(nomeDoGrupo); // ← recebe só o ID
      console.log(`🔎 ID do grupo "${nomeDoGrupo}": ${idGrupo}`);
      //await validarGrupoPorId(idGrupo); // ← usa o ID direto
    } catch (erro) {
      console.error(`❌ Erro ao localizar grupo: ${erro.message}`);
    }
  });
  


// 🔧 Inicializa o cliente WhatsApp
client.initialize();

// 🧹 Remoção de pastas recursiva (síncrona)
const path = require('path');

const pastasParaRemover = [
  path.join(__dirname, '.wwebjs_auth'),
  path.join(__dirname, '.wwebjs_cache')
];

for (const pasta of pastasParaRemover) {
  try {
    fs.rmSync(pasta, { recursive: true, force: true });
    console.log(`🧹 Limpando autenticação e cache `);
  } catch (err) {
    console.error(`⚠️ Erro ao fazer de limpeza autenticação e cache ${pasta}: ${err.message}`);
  }
}

//module.exports = {
//  client,
//  buscarIdDoGrupoPorNome,
//  validarGrupoPorId
//};

