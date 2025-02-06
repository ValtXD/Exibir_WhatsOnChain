import React, { useState } from 'react';
import Select from 'react-select';
import './Adicionar.css';

const doencasOptions = [
    { value: 'Hipertensão', label: 'Hipertensão' },
    { value: 'Diabetes tipo I', label: 'Diabetes tipo I' },
    { value: 'Diabetes tipo II', label: 'Diabetes tipo II' },
    { value: 'Hipotensão', label: 'Hipotensão' },
    { value: 'Outros', label: 'Outros' },
];

const alergiasOptions = [
    { value: 'Glúten', label: 'Glúten' },
    { value: 'Leite', label: 'Leite' },
    { value: 'Ovo', label: 'Ovo' },
    { value: 'Amendoim', label: 'Amendoim' },
    { value: 'Outros', label: 'Outros' },
];

const Adicionar = () => {
    const [paciente, setPaciente] = useState({
        nome: '',
        cpf: '',
        dataNascimento: '',
        dataConsulta: '',
        relato: '',
        doencasPreexistentes: [],
        alergias: [],
        medicacoes: '',
        diagnostico: '',
        examesSolicitados: '',
        anotacoesRetorno: '',
    });

    const [erro, setErro] = useState(''); // Estado para mensagens de erro

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPaciente((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleMultiSelectChange = (selectedOptions, name) => {
        setPaciente((prev) => ({
            ...prev,
            [name]: selectedOptions ? selectedOptions.map(option => option.value) : [],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação básica dos campos obrigatórios
        if (!paciente.nome || !paciente.cpf || !paciente.dataConsulta) {
            setErro("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        // Limpa mensagens de erro anteriores
        setErro('');

        const pacienteData = {
            ...paciente,
            doencasPreexistentes: paciente.doencasPreexistentes,
            alergias: paciente.alergias,
        };

        console.log("Dados a serem enviados:", pacienteData); // Depuração

        try {
            const response = await fetch('http://localhost:3001/api/enviar-transacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pacienteData),
            });

            const data = await response.json();
            console.log("Resposta do servidor:", data); // Depuração

            if (data.success) {
                alert(`Dados enviados com sucesso! TXID: ${data.txid}`);
                // Limpa os campos após o envio
                setPaciente({
                    nome: '', cpf: '', dataNascimento: '', dataConsulta: '',
                    relato: '', doencasPreexistentes: [], alergias: [],
                    medicacoes: '', diagnostico: '', examesSolicitados: '',
                    anotacoesRetorno: ''
                });
            } else {
                setErro("Erro ao enviar transação. Verifique os dados e tente novamente.");
            }
        } catch (error) {
            console.error("Erro ao enviar transação:", error);
            setErro("Erro ao conectar ao servidor. Tente novamente mais tarde.");
        }
    };

    return (
        <form className="formulario-paciente" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Nome Completo:</label>
                <input
                    type="text"
                    name="nome"
                    value={paciente.nome}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>CPF:</label>
                <input
                    type="text"
                    name="cpf"
                    value={paciente.cpf}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Data de nascimento:</label>
                <input
                    type="date"
                    name="dataNascimento"
                    value={paciente.dataNascimento}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label>Data da consulta:</label>
                <input
                    type="date"
                    name="dataConsulta"
                    value={paciente.dataConsulta}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="form-group">
                <label>Relato:</label>
                <textarea
                    name="relato"
                    value={paciente.relato}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label>Doenças preexistentes:</label>
                <Select
                    isMulti
                    options={doencasOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={(selectedOptions) => handleMultiSelectChange(selectedOptions, 'doencasPreexistentes')}
                />
            </div>
            <div className="form-group">
                <label>Alergias:</label>
                <Select
                    isMulti
                    options={alergiasOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={(selectedOptions) => handleMultiSelectChange(selectedOptions, 'alergias')}
                />
            </div>
            <div className="form-group">
                <label>Medicações em uso:</label>
                <input
                    type="text"
                    name="medicacoes"
                    value={paciente.medicacoes}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label>Diagnóstico:</label>
                <input
                    type="text"
                    name="diagnostico"
                    value={paciente.diagnostico}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label>Exames Solicitados:</label>
                <input
                    type="text"
                    name="examesSolicitados"
                    value={paciente.examesSolicitados}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <label>Anotações de Retorno:</label>
                <textarea
                    name="anotacoesRetorno"
                    value={paciente.anotacoesRetorno}
                    onChange={handleChange}
                />
            </div>
            {erro && <div className="erro-mensagem">{erro}</div>}
            <button type="submit" className="submit-button">Enviar</button>
        </form>
    );
};

export default Adicionar;