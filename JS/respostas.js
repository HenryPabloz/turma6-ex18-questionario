/**
 * Lógica da tela de Respostas (respostas.html)
 * Consome a API fake do json-server nos recursos /formularios, /perguntas e /respostas.
 * Nota: filtragem por query string (?campo=valor) em campos terminados em "Id" não
 * funciona no json-server 1.0.0-beta instalado neste projeto — por isso buscamos a
 * coleção inteira e filtramos aqui no JavaScript.
 */

const apiUrl = 'http://localhost:3000';

// ===================================================================
// REFERÊNCIAS DE ELEMENTOS
// ===================================================================
const selectFormularioRespostas = document.getElementById('select-formulario-respostas');
const buscaRespostas = document.getElementById('busca-respostas');
const respostasResumo = document.getElementById('respostas-resumo');
const listaRespostas = document.getElementById('lista-respostas');
const respostasVazio = document.getElementById('respostas-vazio');

// ===================================================================
// ESTADO
// ===================================================================
let formularios = [];
let mapaPerguntas = {};
let respostasDoFormularioAtual = [];

// ===================================================================
// CHAMADAS À API — cada uma devolve { ok, data, error } para o chamador decidir o que fazer
// ===================================================================

const getFormularios = async () => {
    try {
        const response = await fetch(`${apiUrl}/formularios`, { method: 'GET' });

        if (!response.ok) {
            throw new Error('Não foi possível carregar os formulários.');
        }

        return { ok: true, data: await response.json(), error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const getPerguntasBanco = async () => {
    try {
        const response = await fetch(`${apiUrl}/perguntas`, { method: 'GET' });

        if (!response.ok) {
            throw new Error('Não foi possível carregar o banco de perguntas.');
        }

        return { ok: true, data: await response.json(), error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

/**
 * Busca todas as respostas e filtra por formularioId no JavaScript.
 * O json-server desta versão (1.0.0-beta) não filtra corretamente por
 * query string em campos terminados em "Id" — ver nota no topo do arquivo.
 */
const getRespostasPorFormulario = async (idFormulario) => {
    try {
        const response = await fetch(`${apiUrl}/respostas`, { method: 'GET' });

        if (!response.ok) {
            throw new Error('Não foi possível carregar as respostas deste formulário.');
        }

        const todasRespostas = await response.json();
        const respostasDoFormulario = todasRespostas.filter((resposta) => String(resposta.formularioId) === String(idFormulario));

        return { ok: true, data: respostasDoFormulario, error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

// ===================================================================
// SELEÇÃO DO FORMULÁRIO (select + query string da URL)
// ===================================================================

const lerFormularioIdDaUrl = () => {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get('formularioId');
};

const atualizarUrlComFormulario = (idFormulario) => {
    const novaUrl = `${window.location.pathname}?formularioId=${idFormulario}`;
    window.history.replaceState(null, '', novaUrl);
};

const popularSelectFormularios = () => {
    const idDaUrl = lerFormularioIdDaUrl();
    let idParaSelecionar = idDaUrl;

    const idDaUrlExiste = formularios.some((formulario) => String(formulario.id) === String(idDaUrl));
    if (!idDaUrlExiste && formularios.length > 0) {
        idParaSelecionar = formularios[0].id;
    }

    selectFormularioRespostas.innerHTML = formularios
        .map((formulario) => `<option value="${formulario.id}">${Utils.Texto.escaparHtml(formulario.titulo)}</option>`)
        .join('');

    selectFormularioRespostas.value = idParaSelecionar;
};

// ===================================================================
// CARREGAMENTO E RENDERIZAÇÃO DOS REGISTROS
// ===================================================================

const carregarRespostasDoFormularioSelecionado = async () => {
    const idFormulario = selectFormularioRespostas.value;
    if (!idFormulario) {
        return;
    }

    atualizarUrlComFormulario(idFormulario);

    const resultado = await getRespostasPorFormulario(idFormulario);
    if (!resultado.ok) {
        window.alert(resultado.error);
        return;
    }

    respostasDoFormularioAtual = resultado.data.slice().sort((a, b) => new Date(b.enviadoEm) - new Date(a.enviadoEm));
    aplicarFiltro();
};

/** Filtra as respostas carregadas pelo nome ou e-mail digitado na busca */
const aplicarFiltro = () => {
    const termoBusca = buscaRespostas.value.trim().toLowerCase();

    const respostasFiltradas = respostasDoFormularioAtual.filter((resposta) => {
        const nomeCombina = resposta.nome.toLowerCase().includes(termoBusca);
        const emailCombina = resposta.email.toLowerCase().includes(termoBusca);
        return nomeCombina || emailCombina;
    });

    renderizarRespostas(respostasFiltradas);
};

const atualizarResumo = (quantidade) => {
    if (quantidade === 0) {
        respostasResumo.textContent = 'Nenhuma resposta encontrada.';
        return;
    }

    let textoQuantidade = `${quantidade} pessoas responderam`;
    if (quantidade === 1) {
        textoQuantidade = '1 pessoa respondeu';
    }

    respostasResumo.textContent = `${textoQuantidade} a este formulário.`;
};

/** Monta o HTML do valor de uma resposta — trata texto simples, lista (checkbox) e resposta em branco */
const criarHtmlValorResposta = (valor) => {
    const ehLista = Array.isArray(valor);

    if (ehLista && valor.length > 0) {
        const itens = valor.map((item) => `<span>${Utils.Texto.escaparHtml(item)}</span>`).join('');
        return `<p class="registro__valor registro__valor--lista">${itens}</p>`;
    }

    if (ehLista || valor === '' || valor == null) {
        return '<p class="registro__valor"><em>Não respondida</em></p>';
    }

    return `<p class="registro__valor">${Utils.Texto.escaparHtml(valor)}</p>`;
};

const criarHtmlItemResposta = (itemResposta) => {
    const pergunta = mapaPerguntas[itemResposta.perguntaId];

    let enunciado = 'Pergunta removida do banco';
    if (pergunta) {
        enunciado = pergunta.enunciado;
    }

    return `
        <div class="registro__item">
            <p class="registro__pergunta">${Utils.Texto.escaparHtml(enunciado)}</p>
            ${criarHtmlValorResposta(itemResposta.valor)}
        </div>
    `;
};

const criarHtmlRegistro = (resposta) => {
    const itensHtml = resposta.respostas.map((itemResposta) => criarHtmlItemResposta(itemResposta)).join('');

    return `
        <details class="registro" data-resposta-id="${resposta.id}">
            <summary class="registro__resumo">
                <div class="registro__pessoa">
                    <span class="registro__nome">${Utils.Texto.escaparHtml(resposta.nome)}</span>
                    <span class="registro__email">${Utils.Texto.escaparHtml(resposta.email)}</span>
                </div>
                <span class="registro__data">${Utils.Data.formatarDataHoraBr(resposta.enviadoEm)}</span>
                <span class="registro__seta" aria-hidden="true">›</span>
            </summary>
            <div class="registro__detalhe">
                ${itensHtml}
            </div>
        </details>
    `;
};

/** Desenha os registros filtrados, ou o estado vazio quando não há nenhum */
const renderizarRespostas = (lista) => {
    atualizarResumo(lista.length);

    if (lista.length === 0) {
        listaRespostas.innerHTML = '';
        respostasVazio.hidden = false;
        listaRespostas.hidden = true;
        return;
    }

    respostasVazio.hidden = true;
    listaRespostas.hidden = false;
    listaRespostas.innerHTML = lista.map((resposta) => criarHtmlRegistro(resposta)).join('');
};

// ===================================================================
// EVENTOS
// ===================================================================
selectFormularioRespostas.addEventListener('change', carregarRespostasDoFormularioSelecionado);
buscaRespostas.addEventListener('input', aplicarFiltro);

// ===================================================================
// INICIALIZAÇÃO
// ===================================================================
const inicializar = async () => {
    const resultadoFormularios = await getFormularios();
    if (!resultadoFormularios.ok) {
        window.alert(resultadoFormularios.error);
        return;
    }
    formularios = resultadoFormularios.data;

    const resultadoPerguntas = await getPerguntasBanco();
    if (!resultadoPerguntas.ok) {
        window.alert(resultadoPerguntas.error);
        return;
    }
    mapaPerguntas = Object.fromEntries(resultadoPerguntas.data.map((pergunta) => [String(pergunta.id), pergunta]));

    popularSelectFormularios();
    await carregarRespostasDoFormularioSelecionado();
};

inicializar();
