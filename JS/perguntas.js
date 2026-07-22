/**
 * Lógica da tela de Banco de Perguntas (perguntas.html)
 * Consome a API fake do json-server nos recursos /perguntas e /respostas.
 */

const apiUrl = 'http://localhost:3000';

const LIMITES_ALTERNATIVAS = {
    multipla_escolha: { minimo: 2, maximo: 10 },
    checkbox: { minimo: 3, maximo: 15 }
};

const ROTULOS_TIPO = {
    multipla_escolha: 'Múltipla escolha',
    checkbox: 'Checkbox',
    texto_curto: 'Texto curto',
    texto_longo: 'Texto longo'
};

// ===================================================================
// REFERÊNCIAS DE ELEMENTOS
// ===================================================================
const listaPerguntas = document.getElementById('lista-perguntas');
const perguntasVazio = document.getElementById('perguntas-vazio');
const buscaPerguntas = document.getElementById('busca-perguntas');
const filtroPerguntasTipo = document.getElementById('filtro-perguntas-tipo');

const modalPergunta = document.getElementById('modal-pergunta');
const modalPerguntaTitulo = document.getElementById('modal-pergunta-titulo');
const formPergunta = document.getElementById('form-pergunta');
const perguntaId = document.getElementById('pergunta-id');
const perguntaEnunciado = document.getElementById('pergunta-enunciado');
const perguntaTipoSelect = document.getElementById('pergunta-tipo-select');
const perguntaObrigatoria = document.getElementById('pergunta-obrigatoria');
const perguntaAlternativasContainer = document.getElementById('pergunta-alternativas-container');
const perguntaAlternativasLista = document.getElementById('pergunta-alternativas-lista');
const btnAddAlternativa = document.getElementById('btn-add-alternativa');
const erroPerguntaEnunciado = document.getElementById('erro-pergunta-enunciado');
const erroPerguntaAlternativas = document.getElementById('erro-pergunta-alternativas');

const btnNovaPergunta = document.getElementById('btn-nova-pergunta');
const btnFecharModalPergunta = document.getElementById('btn-fechar-modal-pergunta');
const btnCancelarPergunta = document.getElementById('btn-cancelar-pergunta');

const modalConfirmarExclusao = document.getElementById('modal-confirmar-exclusao-pergunta');
const btnFecharModalExclusao = document.getElementById('btn-fechar-modal-exclusao-pergunta');
const btnCancelarExclusao = document.getElementById('btn-cancelar-exclusao-pergunta');
const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao-pergunta');

const modalConfirmarSalvar = document.getElementById('modal-confirmar-salvar-pergunta');
const textoConfirmarSalvar = document.getElementById('texto-confirmar-salvar-pergunta');
const btnFecharModalConfirmarSalvar = document.getElementById('btn-fechar-modal-confirmar-salvar-pergunta');
const btnCancelarSalvar = document.getElementById('btn-cancelar-salvar-pergunta');
const btnConfirmarSalvar = document.getElementById('btn-confirmar-salvar-pergunta');

// ===================================================================
// ESTADO
// ===================================================================
let perguntas = [];
let perguntaIdParaExcluir = null;
let perguntaPendenteDeConfirmacao = null;

// ===================================================================
// CHAMADAS À API — cada uma devolve { ok, data, error } para o chamador decidir o que fazer
// ===================================================================

const getPerguntas = async () => {
    try {
        const response = await fetch(`${apiUrl}/perguntas`, { method: 'GET' });

        if (!response.ok) {
            throw new Error('Não foi possível carregar as perguntas.');
        }

        const data = await response.json();
        return { ok: true, data, error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const getRespostas = async () => {
    try {
        const response = await fetch(`${apiUrl}/respostas`, { method: 'GET' });

        if (!response.ok) {
            throw new Error('Não foi possível verificar as respostas vinculadas.');
        }

        const data = await response.json();
        return { ok: true, data, error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const criarPergunta = async (novaPergunta) => {
    try {
        const response = await fetch(`${apiUrl}/perguntas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaPergunta)
        });

        if (!response.ok) {
            throw new Error('Não foi possível salvar a pergunta.');
        }

        return { ok: true, data: await response.json(), error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const atualizarPergunta = async (id, perguntaAtualizada) => {
    try {
        const response = await fetch(`${apiUrl}/perguntas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...perguntaAtualizada })
        });

        if (!response.ok) {
            throw new Error('Não foi possível atualizar a pergunta.');
        }

        return { ok: true, data: await response.json(), error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const excluirPergunta = async (id) => {
    try {
        const response = await fetch(`${apiUrl}/perguntas/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            throw new Error('Não foi possível excluir a pergunta.');
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

const carregarPerguntas = async () => {
    const resultado = await getPerguntas();

    if (!resultado.ok) {
        window.alert(resultado.error);
        return;
    }

    perguntas = resultado.data;
    aplicarFiltros();
};

/** Filtra o array de perguntas em memória pela busca de texto e pelo tipo selecionado */
const aplicarFiltros = () => {
    const termoBusca = buscaPerguntas.value.trim().toLowerCase();
    const tipoSelecionado = filtroPerguntasTipo.value;

    const perguntasFiltradas = perguntas.filter((pergunta) => {
        const enunciadoCombina = pergunta.enunciado.toLowerCase().includes(termoBusca);

        let tipoCombina = true;
        if (tipoSelecionado !== '') {
            tipoCombina = pergunta.tipo === tipoSelecionado;
        }

        return enunciadoCombina && tipoCombina;
    });

    renderizaPerguntas(perguntasFiltradas);
};

const criarHtmlAlternativas = (alternativas) => {
    if (!alternativas || alternativas.length === 0) {
        return '';
    }

    const itens = alternativas.map((alternativa) => `<li>${Utils.Texto.escaparHtml(alternativa)}</li>`).join('');
    return `<ul class="ficha__alternativas">${itens}</ul>`;
};

const criarHtmlFicha = (pergunta) => {
    let textoObrigatoriedade = 'opcional';
    if (pergunta.obrigatoria) {
        textoObrigatoriedade = 'obrigatória';
    }

    return `
        <article class="ficha" data-tipo="${pergunta.tipo}" data-obrigatoria="${pergunta.obrigatoria}" data-pergunta-id="${pergunta.id}">
            <div class="ficha__cabecalho">
                <span class="ficha__etiqueta">${ROTULOS_TIPO[pergunta.tipo]}</span>
            </div>
            <p class="ficha__enunciado">${Utils.Texto.escaparHtml(pergunta.enunciado)}</p>
            ${criarHtmlAlternativas(pergunta.alternativas)}
            <div class="ficha__rodape">
                <span class="ficha__meta">${textoObrigatoriedade} · #${pergunta.id}</span>
                <div class="ficha__acoes">
                    <button type="button" class="ficha__acao btn-editar-pergunta" data-pergunta-id="${pergunta.id}" aria-label="Editar pergunta: ${Utils.Texto.escaparHtml(pergunta.enunciado)}">✎</button>
                    <button type="button" class="ficha__acao ficha__acao--perigo btn-excluir-pergunta" data-pergunta-id="${pergunta.id}" aria-label="Excluir pergunta: ${Utils.Texto.escaparHtml(pergunta.enunciado)}">✕</button>
                </div>
            </div>
        </article>
    `;
};

/** Desenha os cartões da lista filtrada, ou o estado vazio quando não há nenhum */
const renderizaPerguntas = (lista) => {
    if (lista.length === 0) {
        listaPerguntas.innerHTML = '';
        perguntasVazio.hidden = false;
        listaPerguntas.hidden = true;
        return;
    }

    perguntasVazio.hidden = true;
    listaPerguntas.hidden = false;
    listaPerguntas.innerHTML = lista.map((pergunta) => criarHtmlFicha(pergunta)).join('');
};

// Os botões de editar/excluir são recriados a cada renderização — por isso o clique é
// tratado por delegação, ouvindo o container em vez de cada botão individualmente.
listaPerguntas.addEventListener('click', (evento) => {
    const botaoEditar = evento.target.closest('.btn-editar-pergunta');
    if (botaoEditar) {
        abrirModalEdicao(botaoEditar.dataset.perguntaId);
        return;
    }

    const botaoExcluir = evento.target.closest('.btn-excluir-pergunta');
    if (botaoExcluir) {
        solicitarExclusao(botaoExcluir.dataset.perguntaId);
    }
});

// ===================================================================
// ALTERNATIVAS DINÂMICAS DO FORMULÁRIO
// ===================================================================

/** Mostra o bloco de alternativas só quando o tipo escolhido exigir (múltipla escolha / checkbox) */
const atualizarVisibilidadeAlternativas = () => {
    const tipoAtual = perguntaTipoSelect.value;
    const exigeAlternativas = tipoAtual === 'multipla_escolha' || tipoAtual === 'checkbox';
    perguntaAlternativasContainer.hidden = !exigeAlternativas;
};

const criarLinhaAlternativa = (valor) => {
    const indiceAtual = perguntaAlternativasLista.children.length;

    const linha = document.createElement('div');
    linha.className = 'campo campo--alternativa';
    linha.dataset.alternativaIndex = indiceAtual;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'entrada alternativa-input';
    input.name = 'pergunta-alternativa[]';
    input.placeholder = `Alternativa ${indiceAtual + 1}`;
    input.setAttribute('aria-label', `Alternativa ${indiceAtual + 1}`);
    input.value = valor;

    const botaoRemover = document.createElement('button');
    botaoRemover.type = 'button';
    botaoRemover.className = 'botao botao--fantasma btn-remover-alternativa';
    botaoRemover.setAttribute('aria-label', 'Remover esta alternativa');
    botaoRemover.textContent = '✕';
    botaoRemover.addEventListener('click', () => removerLinhaAlternativa(linha));

    linha.appendChild(input);
    linha.appendChild(botaoRemover);
    perguntaAlternativasLista.appendChild(linha);
};

const removerLinhaAlternativa = (linha) => {
    const limites = LIMITES_ALTERNATIVAS[perguntaTipoSelect.value];
    let minimoPermitido = 0;
    if (limites) {
        minimoPermitido = limites.minimo;
    }

    if (perguntaAlternativasLista.children.length <= minimoPermitido) {
        return;
    }
    linha.remove();
};

/** Regra 8: bloqueia a troca de tipo/alternativas de uma pergunta que já foi respondida */
const definirTravamentoTipoEAlternativas = (travar) => {
    perguntaTipoSelect.disabled = travar;
    btnAddAlternativa.disabled = travar;

    const camposAlternativa = perguntaAlternativasLista.querySelectorAll('.alternativa-input, .btn-remover-alternativa');
    camposAlternativa.forEach((campo) => {
        campo.disabled = travar;
    });

    if (travar) {
        erroPerguntaAlternativas.textContent = 'Esta pergunta já foi respondida em algum formulário — o tipo e as alternativas não podem mais ser alterados. Crie uma nova pergunta se precisar mudar isso.';
    } else {
        erroPerguntaAlternativas.textContent = '';
    }
};

const redefinirAlternativasParaPadrao = () => {
    perguntaAlternativasLista.innerHTML = '';
    criarLinhaAlternativa('');
    criarLinhaAlternativa('');
};

const coletarAlternativasDoFormulario = () => {
    const inputs = perguntaAlternativasLista.querySelectorAll('.alternativa-input');
    const valores = [];
    inputs.forEach((input) => valores.push(input.value.trim()));
    return valores;
};

perguntaTipoSelect.addEventListener('change', atualizarVisibilidadeAlternativas);

btnAddAlternativa.addEventListener('click', () => {
    const limites = LIMITES_ALTERNATIVAS[perguntaTipoSelect.value];
    if (limites && perguntaAlternativasLista.children.length >= limites.maximo) {
        return;
    }
    criarLinhaAlternativa('');
});

// ===================================================================
// ABRIR MODAIS (CRIAR / EDITAR)
// ===================================================================

const limparErrosFormulario = () => {
    erroPerguntaEnunciado.textContent = '';
    erroPerguntaAlternativas.textContent = '';
    perguntaEnunciado.removeAttribute('aria-invalid');
};

const abrirModalCriacao = () => {
    formPergunta.reset();
    perguntaId.value = '';
    limparErrosFormulario();
    redefinirAlternativasParaPadrao();
    atualizarVisibilidadeAlternativas();
    definirTravamentoTipoEAlternativas(false);
    modalPerguntaTitulo.textContent = 'Nova pergunta';
    modalPergunta.showModal();
};

const abrirModalEdicao = async (idSelecionado) => {
    const pergunta = perguntas.find((item) => String(item.id) === String(idSelecionado));
    if (!pergunta) {
        return;
    }

    formPergunta.reset();
    limparErrosFormulario();
    perguntaId.value = pergunta.id;
    perguntaEnunciado.value = pergunta.enunciado;
    perguntaTipoSelect.value = pergunta.tipo;
    perguntaObrigatoria.checked = pergunta.obrigatoria;

    perguntaAlternativasLista.innerHTML = '';
    if (pergunta.alternativas && pergunta.alternativas.length > 0) {
        pergunta.alternativas.forEach((alternativa) => criarLinhaAlternativa(alternativa));
    } else {
        criarLinhaAlternativa('');
        criarLinhaAlternativa('');
    }

    atualizarVisibilidadeAlternativas();

    const resultadoRespostas = await getRespostas();
    let possuiVinculo = false;
    if (resultadoRespostas.ok) {
        possuiVinculo = resultadoRespostas.data.some((registroResposta) => {
            return registroResposta.respostas.some((item) => String(item.perguntaId) === String(pergunta.id));
        });
    }
    definirTravamentoTipoEAlternativas(possuiVinculo);

    modalPerguntaTitulo.textContent = 'Editar pergunta';
    modalPergunta.showModal();
};

btnNovaPergunta.addEventListener('click', abrirModalCriacao);
btnFecharModalPergunta.addEventListener('click', () => modalPergunta.close());
btnCancelarPergunta.addEventListener('click', () => modalPergunta.close());

// ===================================================================
// VALIDAÇÃO
// ===================================================================

const validarAlternativas = (tipoAtual) => {
    const alternativas = coletarAlternativasDoFormulario();
    const alternativasPreenchidas = alternativas.filter((alternativa) => alternativa !== '');

    if (alternativasPreenchidas.length !== alternativas.length) {
        return { valido: false, mensagem: 'Nenhuma alternativa pode ficar vazia.' };
    }

    const limites = LIMITES_ALTERNATIVAS[tipoAtual];
    if (alternativasPreenchidas.length < limites.minimo || alternativasPreenchidas.length > limites.maximo) {
        return { valido: false, mensagem: `Informe entre ${limites.minimo} e ${limites.maximo} alternativas.` };
    }

    const alternativasNormalizadas = alternativasPreenchidas.map((alternativa) => alternativa.toLowerCase());
    const semRepeticao = new Set(alternativasNormalizadas).size === alternativasNormalizadas.length;
    if (!semRepeticao) {
        return { valido: false, mensagem: 'As alternativas não podem se repetir.' };
    }

    return { valido: true, mensagem: '' };
};

/** Valida enunciado e alternativas conforme as regras de cada tipo de pergunta */
const validarFormularioPergunta = () => {
    limparErrosFormulario();
    let formularioValido = true;

    if (!Utils.Texto.naoVazio(perguntaEnunciado.value)) {
        erroPerguntaEnunciado.textContent = 'O enunciado não pode ficar vazio.';
        perguntaEnunciado.setAttribute('aria-invalid', 'true');
        perguntaEnunciado.focus();
        formularioValido = false;
    }

    const tipoAtual = perguntaTipoSelect.value;
    const exigeAlternativas = tipoAtual === 'multipla_escolha' || tipoAtual === 'checkbox';

    if (exigeAlternativas) {
        const validacao = validarAlternativas(tipoAtual);
        if (!validacao.valido) {
            erroPerguntaAlternativas.textContent = validacao.mensagem;
            formularioValido = false;
        }
    }

    return formularioValido;
};

// ===================================================================
// SALVAR (CRIAR / EDITAR)
// ===================================================================

/** Valida o formulário e, se estiver tudo certo, abre a confirmação antes de gravar de fato */
const prepararConfirmacaoSalvar = (evento) => {
    evento.preventDefault();

    if (!validarFormularioPergunta()) {
        return;
    }

    const tipoAtual = perguntaTipoSelect.value;
    const exigeAlternativas = tipoAtual === 'multipla_escolha' || tipoAtual === 'checkbox';

    let alternativas = [];
    if (exigeAlternativas) {
        alternativas = coletarAlternativasDoFormulario().filter((alternativa) => alternativa !== '');
    }

    const dados = {
        enunciado: perguntaEnunciado.value.trim(),
        tipo: tipoAtual,
        obrigatoria: perguntaObrigatoria.checked,
        alternativas
    };

    const idExistente = perguntaId.value;
    perguntaPendenteDeConfirmacao = { dados, idExistente };

    if (idExistente === '') {
        textoConfirmarSalvar.textContent = `Criar a pergunta "${dados.enunciado}"?`;
    } else {
        textoConfirmarSalvar.textContent = `Salvar as alterações na pergunta "${dados.enunciado}"?`;
    }

    modalConfirmarSalvar.showModal();
};

/** Só grava na API depois que o usuário confirma no segundo modal */
const confirmarSalvarPergunta = async () => {
    if (!perguntaPendenteDeConfirmacao) {
        return;
    }

    const { dados, idExistente } = perguntaPendenteDeConfirmacao;

    btnConfirmarSalvar.disabled = true;

    let resultado = null;
    if (idExistente === '') {
        dados.criadaEm = new Date().toISOString();
        resultado = await criarPergunta(dados);
    } else {
        resultado = await atualizarPergunta(idExistente, dados);
    }

    btnConfirmarSalvar.disabled = false;
    perguntaPendenteDeConfirmacao = null;

    if (!resultado.ok) {
        modalConfirmarSalvar.close();
        window.alert(resultado.error);
        return;
    }

    modalConfirmarSalvar.close();
    modalPergunta.close();
    await carregarPerguntas();
};

const cancelarSalvarPergunta = () => {
    perguntaPendenteDeConfirmacao = null;
    modalConfirmarSalvar.close();
};

formPergunta.addEventListener('submit', prepararConfirmacaoSalvar);
btnFecharModalConfirmarSalvar.addEventListener('click', cancelarSalvarPergunta);
btnCancelarSalvar.addEventListener('click', cancelarSalvarPergunta);
btnConfirmarSalvar.addEventListener('click', confirmarSalvarPergunta);

// ===================================================================
// EXCLUSÃO (respeitando a regra de não apagar pergunta já respondida)
// ===================================================================

/** Verifica se a pergunta já foi respondida em algum formulário antes de permitir excluir */
const solicitarExclusao = async (idSelecionado) => {
    const resultado = await getRespostas();
    if (!resultado.ok) {
        window.alert(resultado.error);
        return;
    }

    const possuiVinculo = resultado.data.some((registroResposta) => {
        return registroResposta.respostas.some((item) => String(item.perguntaId) === String(idSelecionado));
    });

    if (possuiVinculo) {
        window.alert('Esta pergunta já possui respostas vinculadas e não pode ser excluída. Crie uma nova pergunta em vez de remover esta.');
        return;
    }

    perguntaIdParaExcluir = idSelecionado;
    modalConfirmarExclusao.showModal();
};

const confirmarExclusao = async () => {
    if (perguntaIdParaExcluir === null) {
        return;
    }

    const resultado = await excluirPergunta(perguntaIdParaExcluir);
    perguntaIdParaExcluir = null;

    if (!resultado.ok) {
        window.alert(resultado.error);
        modalConfirmarExclusao.close();
        return;
    }

    modalConfirmarExclusao.close();
    await carregarPerguntas();
};

const cancelarExclusao = () => {
    perguntaIdParaExcluir = null;
    modalConfirmarExclusao.close();
};

btnFecharModalExclusao.addEventListener('click', cancelarExclusao);
btnCancelarExclusao.addEventListener('click', cancelarExclusao);
btnConfirmarExclusao.addEventListener('click', confirmarExclusao);

// ===================================================================
// BUSCA E FILTRO
// ===================================================================
buscaPerguntas.addEventListener('input', aplicarFiltros);
filtroPerguntasTipo.addEventListener('change', aplicarFiltros);

// ===================================================================
// INICIALIZAÇÃO
// ===================================================================
carregarPerguntas();
