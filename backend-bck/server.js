require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bsv = require('bsv'); // ✅ Correção aqui!

const app = express();
const PORT = 3001;

app.use(express.json());
//app.use(cors({ origin: 'http://localhost:3000' }));
app.use(cors());

const PRIVATE_KEY_WIF = 'L1zhVFj1dJ2mS32EiysMYpMEmXE31tnTY7bwtyicGVTRwvyqVm1x';

try {
    const key = new bsv.PrivKey().fromWif(PRIVATE_KEY_WIF);
    console.log("✅ Chave privada carregada com sucesso!");
} catch (error) {
    console.error("❌ Erro ao carregar a chave privada:", error.message);
}

// Função para criar a transação OP_RETURN
const sendToWhatsOnChain = async (pacienteData) => {
    try {
        const key = new bsv.PrivKey().fromWif(PRIVATE_KEY_WIF);
        const address = bsv.Address.fromPrivKey(key).toString();
        console.log("✅ Endereço da carteira:", address);

        // Buscar UTXOs
        const { data: utxos } = await axios.get(`https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`);
        if (utxos.length === 0) {
            throw new Error("❌ Sem saldo suficiente na carteira.");
        }

        const utxo = utxos[0];
        console.log("✅ UTXO selecionado:", utxo);

        const tx = new bsv.Tx()
            .addTxIn(new bsv.TxIn({
                txHashBuf: Buffer.from(utxo.tx_hash, 'hex'),
                txOutNum: utxo.tx_pos,
                script: bsv.Script.fromPubKeyHash(address),
                valueBn: new bsv.Bn(utxo.value),
            }))
            .addTxOut(new bsv.TxOut({
                script: bsv.Script.fromSafeData(Buffer.from(JSON.stringify(pacienteData), 'utf8')),
                valueBn: new bsv.Bn(0),
            }))
            .sign(key);

        console.log("✅ Transação assinada!");

        // Enviar para WhatsOnChain
        const rawTx = tx.toHex();
        console.log("📤 Enviando transação para WhatsOnChain...");

        const { data: txid } = await axios.post('https://api.whatsonchain.com/v1/bsv/main/tx/raw', { txhex: rawTx });

        console.log("✅ Transação enviada com sucesso! TXID:", txid);
        return txid;
    } catch (error) {
        console.error('❌ Erro ao enviar transação:', error.message);
        throw new Error('Falha ao enviar para WhatsOnChain');
    }
};

// Rota para enviar transação
app.post('/api/enviar-transacao', async (req, res) => {
    try {
        const pacienteData = req.body;
        console.log("📥 Recebendo dados para transação:", pacienteData);

        const txid = await sendToWhatsOnChain(pacienteData);
        res.json({ success: true, txid });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});
