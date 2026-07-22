/**
 * Lógica da tela de Formulários (formularios.html)
 * Consome a API fake do json-server nos recursos /formularios, /perguntas e /respostas.
 * Nota: filtragem por query string (?campo=valor) em campos terminados em "Id" não
 * funciona no json-server 1.0.0-beta instalado neste projeto — por isso buscamos a
 * coleção inteira e filtramos aqui no JavaScript.
 */

const apiUrl = 'http://localhost:3000';

const ROTULOS_STATUS = {
    rascunho: 'Rascunho',
    publicado: 'Publicado',
    encerrado: 'Encerrado'
};

// ===================================================================
// REFERÊNCIAS DE ELEMENTOS
// ===================================================================
const listaFormularios = document.getElementById('lista-formularios');
const formulariosVazio = document.getElementById('formularios-vazio');
const buscaFormularios = document.getElementById('busca-formularios');
const filtroFormulariosStatus = document.getElementById('filtro-formularios-status');

const modalFormulario = document.getElementById('modal-formulario');
const modalFormularioTitulo = document.getElementById('modal-formulario-titulo');
const formFormulario = document.getElementById('form-formulario');
const formularioId = document.getElementById('formulario-id');
const formularioTitulo = document.getElementById('formulario-titulo');
const formularioDescricao = document.getElementById('formulario-descricao');
const formularioStatusSelect = document.getElementById('formulario-status-select');
const formularioDataInicio = document.getElementById('formulario-data-inicio');
const formularioDataFim = document.getElementById('formulario-data-fim');
const formularioPerguntasDisponiveis = document.getElementById('formulario-perguntas-disponiveis');
const buscaPerguntasDisponiveis = document.getElementById('busca-perguntas-disponiveis');
const erroFormularioTitulo = document.getElementById('erro-formulario-titulo');
const erroFormularioPerguntas = document.getElementById('erro-formulario-perguntas');

const btnNovoFormulario = document.getElementById('btn-novo-formulario');
const btnFecharModalFormulario = document.getElementById('btn-fechar-modal-formulario');
const btnCancelarFormulario = document.getElementById('btn-cancelar-formulario');

const modalConfirmarExclusaoFormulario = document.getElementById('modal-confirmar-exclusao-formulario');
const textoConfirmarExclusaoFormulario = document.getElementById('texto-confirmar-exclusao-formulario');
const btnFecharModalExclusaoFormulario = document.getElementById('btn-fechar-modal-exclusao-formulario');
const btnCancelarExclusaoFormulario = document.getElementById('btn-cancelar-exclusao-formulario');
const btnConfirmarExclusaoFormulario = document.getElementById('btn-confirmar-exclusao-formulario');

const modalConfirmarSalvarFormulario = document.getElementById('modal-confirmar-salvar-formulario');
const textoConfirmarSalvarFormulario = document.getElementById('texto-confirmar-salvar-formulario');
const btnFecharModalConfirmarSalvarFormulario = document.getElementById('btn-fechar-modal-confirmar-salvar-formulario');
const btnCancelarSalvarFormulario = document.getElementById('btn-cancelar-salvar-formulario');
const btnConfirmarSalvarFormulario = document.getElementById('btn-confirmar-salvar-formulario');

// ===================================================================
// ESTADO
// ===================================================================
let formularios = [];
let perguntasBanco = [];
let formularioIdParaRemover = null;
let acaoConfirmadaFormulario = ''; // 'excluir' ou 'encerrar'
let formularioPendenteDeConfirmacao = null;

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

const getRespostasDoFormulario = async (idFormulario) => {
    try {
        const response = await fetch(`${apiUrl}/respostas`, { method: 'GET' });

        if (!response.ok) {
            throw new Error('Não foi possível verificar as respostas vinculadas.');
        }

        const todasRespostas = await response.json();
        const respostasDoFormulario = todasRespostas.filter((resposta) => String(resposta.formularioId) === String(idFormulario));

        return { ok: true, data: respostasDoFormulario, error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const criarFormulario = async (novoFormulario) => {
    try {
        const response = await fetch(`${apiUrl}/formularios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoFormulario)
        });

        if (!response.ok) {
            throw new Error('Não foi possível salvar o formulário.');
        }

        return { ok: true, data: await response.json(), error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const atualizarFormulario = async (id, formularioAtualizado) => {
    try {
        const response = await fetch(`${apiUrl}/formularios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...formularioAtualizado })
        });

        if (!response.ok) {
            throw new Error('Não foi possível atualizar o formulário.');
        }

        return { ok: true, data: await response.json(), error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const encerrarFormulario = async (id) => {
    try {
        const response = await fetch(`${apiUrl}/formularios/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'encerrado' })
        });

        if (!response.ok) {
            throw new Error('Não foi possível encerrar o formulário.');
        }

        return { ok: true, data: await response.json(), error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const excluirFormulario = async (id) => {
    try {
        const response = await fetch(`${apiUrl}/formularios/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error('Não foi possível excluir o formulário.');
        }

        return { ok: true, data: null, error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

// ===================================================================
// CARREGAMENTO E RENDERIZAÇÃO DA LISTA
// ===================================================================

const carregarFormularios = async () => {
    const resultado = await getFormularios();

    if (!resultado.ok) {
        window.alert(resultado.error);
        return;
    }

    formularios = resultado.data;
    aplicarFiltros();
};

/** Filtra o array de formulários em memória pelo título buscado e pelo status selecionado */
const aplicarFiltros = () => {
    const termoBusca = buscaFormularios.value.trim().toLowerCase();
    const statusSelecionado = filtroFormulariosStatus.value;

    const formulariosFiltrados = formularios.filter((formulario) => {
        const tituloCombina = formulario.titulo.toLowerCase().includes(termoBusca);

        let statusCombina = true;
        if (statusSelecionado !== '') {
            statusCombina = formulario.status === statusSelecionado;
        }

        return tituloCombina && statusCombina;
    });

    renderizaFormularios(formulariosFiltrados);
};

/** Descreve o período de vigência do formulário em texto curto, para o cartão da lista */
const textoVigencia = (formulario) => {
    const temInicio = formulario.dataInicio !== '' && formulario.dataInicio != null;
    const temFim = formulario.dataFim !== '' && formulario.dataFim != null;

    if (temInicio && temFim) {
        return `${Utils.Data.formatarDataBr(formulario.dataInicio)} – ${Utils.Data.formatarDataBr(formulario.dataFim)}`;
    }
    if (temInicio) {
        return `desde ${Utils.Data.formatarDataBr(formulario.dataInicio)}`;
    }
    return 'sem vigência definida';
};

/** Só formulários publicados aceitam resposta (regra 3) — por isso o atalho só aparece neles */
const criarLinkResponder = (formulario) => {
    if (formulario.status !== 'publicado') {
        return '';
    }

    return `<a class="ficha__acao" href="responder.html?formularioId=${formulario.id}" target="_blank" rel="noopener" data-formulario-id="${formulario.id}" aria-label="Responder: ${Utils.Texto.escaparHtml(formulario.titulo)}">↗</a>`;
};

const criarHtmlFicha = (formulario) => {
    const quantidadePerguntas = formulario.perguntas.length;

    let textoQuantidade = `${quantidadePerguntas} perguntas`;
    if (quantidadePerguntas === 1) {
        textoQuantidade = '1 pergunta';
    }

    return `
        <article class="ficha" data-status="${formulario.status}" data-formulario-id="${formulario.id}">
            <div class="ficha__cabecalho">
                <span class="selo-status selo-status--${formulario.status}">${ROTULOS_STATUS[formulario.status]}</span>
            </div>
            <p class="ficha__enunciado">${Utils.Texto.escaparHtml(formulario.titulo)}</p>
            <ul class="ficha__alternativas">
                <li>${textoQuantidade}</li>
                <li>${textoVigencia(formulario)}</li>
            </ul>
            <div class="ficha__rodape">
                <span class="ficha__meta">#${formulario.id}</span>
                <div class="ficha__acoes">
                    ${criarLinkResponder(formulario)}
                    <a class="ficha__acao" href="respostas.html?formularioId=${formulario.id}" data-formulario-id="${formulario.id}" aria-label="Ver respostas de: ${Utils.Texto.escaparHtml(formulario.titulo)}">▤</a>
                    <button type="button" class="ficha__acao btn-editar-formulario" data-formulario-id="${formulario.id}" aria-label="Editar formulário: ${Utils.Texto.escaparHtml(formulario.titulo)}">✎</button>
                    <button type="button" class="ficha__acao ficha__acao--perigo btn-remover-formulario" data-formulario-id="${formulario.id}" aria-label="Remover formulário: ${Utils.Texto.escaparHtml(formulario.titulo)}">✕</button>
                </div>
            </div>
        </article>
    `;
};

/** Desenha os cartões da lista filtrada, ou o estado vazio quando não há nenhum */
const renderizaFormularios = (lista) => {
    if (lista.length === 0) {
        listaFormularios.innerHTML = '';
        formulariosVazio.hidden = false;
        listaFormularios.hidden = true;
        return;
    }

    formulariosVazio.hidden = true;
    listaFormularios.hidden = false;
    listaFormularios.innerHTML = lista.map((formulario) => criarHtmlFicha(formulario)).join('');
};

// Os botões de editar/remover são recriados a cada renderização — por isso o clique é
// tratado por delegação, ouvindo o container em vez de cada botão individualmente.
listaFormularios.addEventListener('click', (evento) => {
    const botaoEditar = evento.target.closest('.btn-editar-formulario');
    if (botaoEditar) {
        abrirModalEdicao(botaoEditar.dataset.formularioId);
        return;
    }

    const botaoRemover = evento.target.closest('.btn-remover-formulario');
    if (botaoRemover) {
        solicitarRemocao(botaoRemover.dataset.formularioId);
    }
});

// ===================================================================
// LISTA DE PERGUNTAS SELECIONÁVEIS DENTRO DO MODAL
// ===================================================================

const ROTULOS_TIPO_PERGUNTA = {
    multipla_escolha: 'múltipla escolha',
    checkbox: 'checkbox',
    texto_curto: 'texto curto',
    texto_longo: 'texto longo'
};

const criarHtmlOpcaoPergunta = (pergunta, idsSelecionados) => {
    let marcada = '';
    if (idsSelecionados.includes(String(pergunta.id))) {
        marcada = 'checked';
    }

    return `
        <label class="opcao">
            <input type="checkbox" name="formulario-pergunta[]" value="${pergunta.id}" data-pergunta-id="${pergunta.id}" ${marcada}>
            <span class="opcao__texto">${Utils.Texto.escaparHtml(pergunta.enunciado)} <em>(${ROTULOS_TIPO_PERGUNTA[pergunta.tipo]})</em></span>
        </label>
    `;
};

const renderizarOpcoesPerguntas = (idsSelecionados) => {
    formularioPerguntasDisponiveis.innerHTML = perguntasBanco
        .map((pergunta) => criarHtmlOpcaoPergunta(pergunta, idsSelecionados))
        .join('');
};

/** Mostra/oculta cada opção conforme o texto buscado, sem perder a marcação dos checkboxes */
buscaPerguntasDisponiveis.addEventListener('input', () => {
    const termoBusca = buscaPerguntasDisponiveis.value.trim().toLowerCase();
    const opcoes = formularioPerguntasDisponiveis.querySelectorAll('.opcao');

    opcoes.forEach((opcao) => {
        const texto = opcao.querySelector('.opcao__texto').textContent.toLowerCase();
        opcao.hidden = !texto.includes(termoBusca);
    });
});

const idsPerguntasSelecionadas = () => {
    const checkboxesMarcados = formularioPerguntasDisponiveis.querySelectorAll('input:checked');
    const ids = [];
    checkboxesMarcados.forEach((checkbox) => ids.push(checkbox.value));
    return ids;
};

const definirTravamentoPerguntasEVigencia = (travar) => {
    const checkboxes = formularioPerguntasDisponiveis.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
        checkbox.disabled = travar;
    });
    formularioDataInicio.disabled = travar;
    formularioDataFim.disabled = travar;

    if (travar) {
        erroFormularioPerguntas.textContent = 'Este formulário já tem respostas registradas — as perguntas e a vigência não podem mais ser alteradas.';
    } else {
        erroFormularioPerguntas.textContent = '';
    }
};

// ===================================================================
// ABRIR MODAIS (CRIAR / EDITAR)
// ===================================================================

const limparErrosFormulario = () => {
    erroFormularioTitulo.textContent = '';
    erroFormularioPerguntas.textContent = '';
    formularioTitulo.removeAttribute('aria-invalid');
};

const converterDataParaCampo = (dataIso) => {
    if (dataIso === '' || dataIso == null) {
        return '';
    }
    return dataIso.substring(0, 10);
};

const abrirModalCriacao = () => {
    formFormulario.reset();
    formularioId.value = '';
    limparErrosFormulario();
    buscaPerguntasDisponiveis.value = '';
    renderizarOpcoesPerguntas([]);
    definirTravamentoPerguntasEVigencia(false);
    modalFormularioTitulo.textContent = 'Novo formulário';
    modalFormulario.showModal();
};

const abrirModalEdicao = async (idSelecionado) => {
    const formulario = formularios.find((item) => String(item.id) === String(idSelecionado));
    if (!formulario) {
        return;
    }

    formFormulario.reset();
    limparErrosFormulario();
    formularioId.value = formulario.id;
    formularioTitulo.value = formulario.titulo;
    formularioDescricao.value = formulario.descricao;
    formularioStatusSelect.value = formulario.status;
    formularioDataInicio.value = converterDataParaCampo(formulario.dataInicio);
    formularioDataFim.value = converterDataParaCampo(formulario.dataFim);

    buscaPerguntasDisponiveis.value = '';
    renderizarOpcoesPerguntas(formulario.perguntas);

    const resultadoRespostas = await getRespostasDoFormulario(formulario.id);
    let possuiRespostas = false;
    if (resultadoRespostas.ok) {
        possuiRespostas = resultadoRespostas.data.length > 0;
    }
    definirTravamentoPerguntasEVigencia(possuiRespostas);

    modalFormularioTitulo.textContent = 'Editar formulário';
    modalFormulario.showModal();
};

btnNovoFormulario.addEventListener('click', abrirModalCriacao);
btnFecharModalFormulario.addEventListener('click', () => modalFormulario.close());
btnCancelarFormulario.addEventListener('click', () => modalFormulario.close());

// ===================================================================
// VALIDAÇÃO
// ===================================================================

const validarFormulario = () => {
    limparErrosFormulario();
    let formularioValido = true;

    if (!Utils.Texto.naoVazio(formularioTitulo.value)) {
        erroFormularioTitulo.textContent = 'O título não pode ficar vazio.';
        formularioTitulo.setAttribute('aria-invalid', 'true');
        formularioTitulo.focus();
        formularioValido = false;
    }

    if (idsPerguntasSelecionadas().length === 0) {
        erroFormularioPerguntas.textContent = 'Selecione ao menos uma pergunta do banco.';
        formularioValido = false;
    }

    return formularioValido;
};

// ===================================================================
// SALVAR (CRIAR / EDITAR)
// ===================================================================

const converterCampoParaDataIso = (valorCampo) => {
    if (valorCampo === '') {
        return '';
    }
    return new Date(`${valorCampo}T00:00:00.000Z`).toISOString();
};

/** Valida o formulário e, se estiver tudo certo, abre a confirmação antes de gravar de fato */
const prepararConfirmacaoSalvarFormulario = (evento) => {
    evento.preventDefault();

    if (!validarFormulario()) {
        return;
    }

    const dados = {
        titulo: formularioTitulo.value.trim(),
        descricao: formularioDescricao.value.trim(),
        perguntas: idsPerguntasSelecionadas(),
        status: formularioStatusSelect.value,
        dataInicio: converterCampoParaDataIso(formularioDataInicio.value),
        dataFim: converterCampoParaDataIso(formularioDataFim.value)
    };

    const idExistente = formularioId.value;
    formularioPendenteDeConfirmacao = { dados, idExistente };

    if (idExistente === '') {
        textoConfirmarSalvarFormulario.textContent = `Criar o formulário "${dados.titulo}"?`;
    } else {
        textoConfirmarSalvarFormulario.textContent = `Salvar as alterações no formulário "${dados.titulo}"?`;
    }

    modalConfirmarSalvarFormulario.showModal();
};

/** Só grava na API depois que o usuário confirma no segundo modal */
const confirmarSalvarFormulario = async () => {
    if (!formularioPendenteDeConfirmacao) {
        return;
    }

    const { dados, idExistente } = formularioPendenteDeConfirmacao;

    btnConfirmarSalvarFormulario.disabled = true;

    let resultado = null;
    if (idExistente === '') {
        dados.criadoEm = new Date().toISOString();
        resultado = await criarFormulario(dados);
    } else {
        resultado = await atualizarFormulario(idExistente, dados);
    }

    btnConfirmarSalvarFormulario.disabled = false;
    formularioPendenteDeConfirmacao = null;

    if (!resultado.ok) {
        modalConfirmarSalvarFormulario.close();
        window.alert(resultado.error);
        return;
    }

    modalConfirmarSalvarFormulario.close();
    modalFormulario.close();
    await carregarFormularios();
};

const cancelarSalvarFormulario = () => {
    formularioPendenteDeConfirmacao = null;
    modalConfirmarSalvarFormulario.close();
};

formFormulario.addEventListener('submit', prepararConfirmacaoSalvarFormulario);
btnFecharModalConfirmarSalvarFormulario.addEventListener('click', cancelarSalvarFormulario);
btnCancelarSalvarFormulario.addEventListener('click', cancelarSalvarFormulario);
btnConfirmarSalvarFormulario.addEventListener('click', confirmarSalvarFormulario);

// ===================================================================
// REMOÇÃO (excluir de fato quando não há respostas; encerrar quando já há)
// ===================================================================

/** Decide, a partir dos dados reais, se o formulário pode ser excluído ou só encerrado */
const solicitarRemocao = async (idSelecionado) => {
    const formulario = formularios.find((item) => String(item.id) === String(idSelecionado));
    if (!formulario) {
        return;
    }

    const resultado = await getRespostasDoFormulario(idSelecionado);
    if (!resultado.ok) {
        window.alert(resultado.error);
        return;
    }

    const possuiRespostas = resultado.data.length > 0;

    if (possuiRespostas && formulario.status === 'encerrado') {
        window.alert('Este formulário já está encerrado e possui respostas vinculadas — o histórico é preservado e não pode ser excluído.');
        return;
    }

    formularioIdParaRemover = idSelecionado;

    if (possuiRespostas) {
        acaoConfirmadaFormulario = 'encerrar';
        textoConfirmarExclusaoFormulario.textContent = 'Este formulário já tem respostas vinculadas — não pode ser excluído fisicamente. Deseja encerrá-lo? As respostas recebidas continuam preservadas.';
    } else {
        acaoConfirmadaFormulario = 'excluir';
        textoConfirmarExclusaoFormulario.textContent = 'Este formulário ainda não tem nenhuma resposta vinculada. Deseja excluí-lo definitivamente?';
    }

    modalConfirmarExclusaoFormulario.showModal();
};

const confirmarRemocao = async () => {
    if (formularioIdParaRemover === null) {
        return;
    }

    let resultado = null;
    if (acaoConfirmadaFormulario === 'encerrar') {
        resultado = await encerrarFormulario(formularioIdParaRemover);
    } else {
        resultado = await excluirFormulario(formularioIdParaRemover);
    }

    formularioIdParaRemover = null;
    modalConfirmarExclusaoFormulario.close();

    if (!resultado.ok) {
        window.alert(resultado.error);
        return;
    }

    await carregarFormularios();
};

const cancelarRemocao = () => {
    formularioIdParaRemover = null;
    modalConfirmarExclusaoFormulario.close();
};

btnFecharModalExclusaoFormulario.addEventListener('click', cancelarRemocao);
btnCancelarExclusaoFormulario.addEventListener('click', cancelarRemocao);
btnConfirmarExclusaoFormulario.addEventListener('click', confirmarRemocao);

// ===================================================================
// BUSCA E FILTRO DA LISTA PRINCIPAL
// ===================================================================
buscaFormularios.addEventListener('input', aplicarFiltros);
filtroFormulariosStatus.addEventListener('change', aplicarFiltros);

// ===================================================================
// INICIALIZAÇÃO
// ===================================================================
const inicializar = async () => {
    const resultadoPerguntas = await getPerguntasBanco();
    if (resultadoPerguntas.ok) {
        perguntasBanco = resultadoPerguntas.data;
    } else {
        window.alert(resultadoPerguntas.error);
    }

    await carregarFormularios();
};

inicializar();
