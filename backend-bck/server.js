const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bsv = require('bsv');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

const PRIVATE_KEY_WIF = 'L1zhVFj1dJ2mS32EiysMYpMEmXE31tnTY7bwtyicGVTRwvyqVm1x';

try {
    const key = bsv.PrivateKey.fromWIF(PRIVATE_KEY_WIF);
    console.log("✅ Chave privada carregada com sucesso!");
} catch (error) {
    console.error("❌ Erro ao carregar a chave privada:", error.message);
}

const sendToWhatsOnChain = async (pacienteData) => {
    try {
        const key = bsv.PrivateKey.fromWIF(PRIVATE_KEY_WIF);
        const address = key.toAddress().toString();
        console.log("✅ Endereço da carteira:", address);

        // Buscar UTXOs
        const { data: utxos } = await axios.get(`https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`);
        if (!utxos || utxos.length === 0) {
            throw new Error("❌ Sem saldo disponível na carteira.");
        }

        // Selecionar a UTXO com maior valor
        const utxo = utxos.reduce((prev, current) => (prev.value > current.value ? prev : current));
        console.log("✅ UTXO selecionado:", utxo);

        // Obter a transação completa
        const { data: txData } = await axios.get(`https://api.whatsonchain.com/v1/bsv/main/tx/${utxo.tx_hash}`);
        const scriptPubKey = txData?.vout?.[utxo.tx_pos]?.scriptPubKey?.hex;
        if (!scriptPubKey) {
            throw new Error("❌ scriptPubKey não encontrado ou inválido.");
        }
        console.log("🔑 scriptPubKey da saída selecionada:", scriptPubKey);

        // Criar OP_RETURN (dados reduzidos)
        const opReturnData = bsv.Script.buildDataOut([
            Buffer.from(pacienteData.nome, 'utf8').toString('hex'),
            Buffer.from(pacienteData.cpf, 'utf8').toString('hex')
        ]);

        // Criar a transação
        const tx = new bsv.Transaction()
            .from([{ txId: utxo.tx_hash, outputIndex: utxo.tx_pos, script: bsv.Script.fromHex(scriptPubKey), satoshis: utxo.value }])
            .addOutput(new bsv.Transaction.Output({ script: opReturnData, satoshis: 0 })) // OP_RETURN não pode ter valor
            .feePerKb(1500) // Aumentei a taxa para evitar erro 400
            .change(address) // Troco para a carteira original
            .sign(key);

        if (!tx.isFullySigned()) {
            throw new Error("❌ A transação não foi assinada corretamente.");
        }

        console.log("📝 Taxa estimada:", tx.getFee(), "satoshis");
        console.log("💰 Troco:", tx.getChangeOutput() ? tx.getChangeOutput().satoshis : 0, "satoshis");

        // Serializar e enviar
        const rawTx = tx.serialize();
        console.log("📜 Raw Transaction:", rawTx);

        const { data: txid } = await axios.post('https://api.whatsonchain.com/v1/bsv/main/tx/raw', { txhex: rawTx });

        console.log("✅ Transação enviada com sucesso! TXID:", txid);
        return txid;
    } catch (error) {
        console.error("❌ Erro ao enviar transação:", error.message);
        throw new Error("Falha ao enviar para WhatsOnChain");
    }
};

// Rota para envio de transação
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
