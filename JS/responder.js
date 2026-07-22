/**
 * Lógica da tela pública de resposta (responder.html)
 * Acessada via link com ?formularioId={id}. Consome /formularios, /perguntas e /respostas.
 * Nota: filtragem por query string (?campo=valor) em campos terminados em "Id" não
 * funciona no json-server 1.0.0-beta instalado neste projeto — por isso buscamos a
 * coleção inteira e filtramos aqui no JavaScript.
 */

const apiUrl = 'http://localhost:3000';

const LIMITE_TEXTO_CURTO = 200;

const ROTULOS_TIPO_PERGUNTA = {
    multipla_escolha: 'múltipla escolha',
    checkbox: 'checkbox',
    texto_curto: 'texto curto',
    texto_longo: 'texto longo'
};

// ===================================================================
// REFERÊNCIAS DE ELEMENTOS
// ===================================================================
const formularioEyebrow = document.getElementById('formulario-eyebrow');
const formularioTituloExibicao = document.getElementById('formulario-titulo-exibicao');
const formularioDescricaoExibicao = document.getElementById('formulario-descricao-exibicao');

const alertaFormularioIndisponivel = document.getElementById('alerta-formulario-indisponivel');
const textoFormularioIndisponivel = document.getElementById('texto-formulario-indisponivel');
const cartaoFormularioResposta = document.getElementById('cartao-formulario-resposta');

const alertaErroObrigatorias = document.getElementById('alerta-erro-obrigatorias');
const tituloErroObrigatorias = document.getElementById('titulo-erro-obrigatorias');
const listaErrosObrigatorias = document.getElementById('lista-erros-obrigatorias');
const alertaEnvioSucesso = document.getElementById('alerta-envio-sucesso');

const formResposta = document.getElementById('form-resposta');
const respondenteNome = document.getElementById('respondente-nome');
const respondenteEmail = document.getElementById('respondente-email');
const erroRespondenteNome = document.getElementById('erro-respondente-nome');
const erroRespondenteEmail = document.getElementById('erro-respondente-email');

const perguntasRespostaContainer = document.getElementById('perguntas-resposta-container');
const btnEnviarResposta = document.getElementById('btn-enviar-resposta');

// ===================================================================
// ESTADO
// ===================================================================
let formulario = null;
let perguntasDoFormulario = [];

// ===================================================================
// CHAMADAS À API — cada uma devolve { ok, data, error } para o chamador decidir o que fazer
// ===================================================================

const getFormulario = async (idFormulario) => {
    try {
        const response = await fetch(`${apiUrl}/formularios/${idFormulario}`, { method: 'GET' });

        if (!response.ok) {
            throw new Error('Formulário não encontrado.');
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
            throw new Error('Não foi possível carregar as perguntas deste formulário.');
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
            throw new Error('Não foi possível verificar respostas anteriores.');
        }

        const todasRespostas = await response.json();
        const respostasDoFormulario = todasRespostas.filter((resposta) => String(resposta.formularioId) === String(idFormulario));

        return { ok: true, data: respostasDoFormulario, error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

const enviarResposta = async (novaResposta) => {
    try {
        const response = await fetch(`${apiUrl}/respostas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaResposta)
        });

        if (!response.ok) {
            throw new Error('Não foi possível enviar sua resposta. Tente novamente.');
        }

        return { ok: true, data: await response.json(), error: null };
    } catch (erro) {
        console.log('Ocorreu um erro: ' + erro);
        return { ok: false, data: null, error: erro.message };
    }
};

// ===================================================================
// DISPONIBILIDADE DO FORMULÁRIO
// ===================================================================

const mostrarIndisponivel = (mensagem) => {
    textoFormularioIndisponivel.textContent = mensagem;
    alertaFormularioIndisponivel.hidden = false;
    cartaoFormularioResposta.hidden = true;
};

/** Verifica a regra 3: status precisa ser "publicado" e a data atual dentro de dataInicio–dataFim */
const formularioEstaDisponivel = (formularioVerificado) => {
    if (formularioVerificado.status !== 'publicado') {
        return false;
    }

    const agora = new Date();

    const temInicio = formularioVerificado.dataInicio !== '' && formularioVerificado.dataInicio != null;
    if (temInicio && agora < new Date(formularioVerificado.dataInicio)) {
        return false;
    }

    const temFim = formularioVerificado.dataFim !== '' && formularioVerificado.dataFim != null;
    if (temFim && agora > new Date(formularioVerificado.dataFim)) {
        return false;
    }

    return true;
};

// ===================================================================
// RENDERIZAÇÃO DO CABEÇALHO E DAS PERGUNTAS
// ===================================================================

const textoVigencia = (formularioExibido) => {
    const temInicio = formularioExibido.dataInicio !== '' && formularioExibido.dataInicio != null;
    const temFim = formularioExibido.dataFim !== '' && formularioExibido.dataFim != null;

    if (temInicio && temFim) {
        return `vigente de ${Utils.Data.formatarDataBr(formularioExibido.dataInicio)} até ${Utils.Data.formatarDataBr(formularioExibido.dataFim)}`;
    }
    if (temFim) {
        return `vigente até ${Utils.Data.formatarDataBr(formularioExibido.dataFim)}`;
    }
    return 'formulário público';
};

const exibirCabecalho = (formularioExibido) => {
    document.title = `${formularioExibido.titulo} — Ateliê de Questionários`;
    formularioEyebrow.textContent = `Formulário público · ${textoVigencia(formularioExibido)}`;
    formularioTituloExibicao.textContent = formularioExibido.titulo;
    formularioDescricaoExibicao.textContent = formularioExibido.descricao;
};

const criarMarcadorObrigatorio = (pergunta) => {
    if (pergunta.obrigatoria) {
        return '<span class="campo__obrigatorio" aria-hidden="true">*</span>';
    }
    return '';
};

const criarHtmlMultiplaEscolha = (pergunta) => {
    const opcoes = pergunta.alternativas.map((alternativa, indice) => `
        <label class="opcao">
            <input type="radio" id="resposta-pergunta-${pergunta.id}-opcao-${indice}" name="resposta-pergunta-${pergunta.id}" value="${Utils.Texto.escaparHtml(alternativa)}" data-pergunta-id="${pergunta.id}">
            <span class="opcao__texto">${Utils.Texto.escaparHtml(alternativa)}</span>
        </label>
    `).join('');

    return `
        <p class="pergunta-resposta__enunciado" id="rotulo-pergunta-${pergunta.id}">
            ${Utils.Texto.escaparHtml(pergunta.enunciado)} ${criarMarcadorObrigatorio(pergunta)}
        </p>
        <div role="radiogroup" aria-labelledby="rotulo-pergunta-${pergunta.id}" aria-required="${pergunta.obrigatoria}">
            ${opcoes}
        </div>
        <span class="campo__erro" id="erro-pergunta-${pergunta.id}"></span>
    `;
};

const criarHtmlCheckbox = (pergunta) => {
    const opcoes = pergunta.alternativas.map((alternativa, indice) => `
        <label class="opcao">
            <input type="checkbox" id="resposta-pergunta-${pergunta.id}-opcao-${indice}" name="resposta-pergunta-${pergunta.id}[]" value="${Utils.Texto.escaparHtml(alternativa)}" data-pergunta-id="${pergunta.id}">
            <span class="opcao__texto">${Utils.Texto.escaparHtml(alternativa)}</span>
        </label>
    `).join('');

    return `
        <p class="pergunta-resposta__enunciado" id="rotulo-pergunta-${pergunta.id}">
            ${Utils.Texto.escaparHtml(pergunta.enunciado)} ${criarMarcadorObrigatorio(pergunta)}
        </p>
        <div role="group" aria-labelledby="rotulo-pergunta-${pergunta.id}">
            ${opcoes}
        </div>
        <span class="campo__erro" id="erro-pergunta-${pergunta.id}"></span>
    `;
};

const criarHtmlTextoCurto = (pergunta) => {
    return `
        <label class="pergunta-resposta__enunciado" for="resposta-pergunta-${pergunta.id}">
            ${Utils.Texto.escaparHtml(pergunta.enunciado)} ${criarMarcadorObrigatorio(pergunta)}
        </label>
        <input type="text" id="resposta-pergunta-${pergunta.id}" name="resposta-pergunta-${pergunta.id}" class="entrada" maxlength="${LIMITE_TEXTO_CURTO}" data-pergunta-id="${pergunta.id}" placeholder="Digite sua resposta…">
        <span class="contador-caracteres"><span id="contador-pergunta-${pergunta.id}">0</span>/${LIMITE_TEXTO_CURTO}</span>
        <span class="campo__erro" id="erro-pergunta-${pergunta.id}"></span>
    `;
};

const criarHtmlTextoLongo = (pergunta) => {
    return `
        <label class="pergunta-resposta__enunciado" for="resposta-pergunta-${pergunta.id}">
            ${Utils.Texto.escaparHtml(pergunta.enunciado)} ${criarMarcadorObrigatorio(pergunta)}
        </label>
        <textarea id="resposta-pergunta-${pergunta.id}" name="resposta-pergunta-${pergunta.id}" class="area-texto" rows="4" data-pergunta-id="${pergunta.id}" placeholder="Conte com suas palavras…"></textarea>
        <span class="campo__erro" id="erro-pergunta-${pergunta.id}"></span>
    `;
};

const criarHtmlPergunta = (pergunta) => {
    let conteudoInterno = '';

    if (pergunta.tipo === 'multipla_escolha') {
        conteudoInterno = criarHtmlMultiplaEscolha(pergunta);
    } else if (pergunta.tipo === 'checkbox') {
        conteudoInterno = criarHtmlCheckbox(pergunta);
    } else if (pergunta.tipo === 'texto_curto') {
        conteudoInterno = criarHtmlTextoCurto(pergunta);
    } else if (pergunta.tipo === 'texto_longo') {
        conteudoInterno = criarHtmlTextoLongo(pergunta);
    }

    return `
        <div class="pergunta-resposta" data-pergunta-id="${pergunta.id}" data-tipo="${pergunta.tipo}" data-obrigatoria="${pergunta.obrigatoria}">
            ${conteudoInterno}
        </div>
    `;
};

const renderizarPerguntas = () => {
    perguntasRespostaContainer.innerHTML = perguntasDoFormulario.map((pergunta) => criarHtmlPergunta(pergunta)).join('');
};

/** Atualiza o contador "N/200" enquanto a pessoa digita numa pergunta de texto curto */
perguntasRespostaContainer.addEventListener('input', (evento) => {
    const perguntaResposta = evento.target.closest('.pergunta-resposta');
    if (!perguntaResposta || perguntaResposta.dataset.tipo !== 'texto_curto') {
        return;
    }

    const idPergunta = perguntaResposta.dataset.perguntaId;
    const contador = document.getElementById(`contador-pergunta-${idPergunta}`);
    if (contador) {
        contador.textContent = evento.target.value.length;
    }
});

// ===================================================================
// VALIDAÇÃO
// ===================================================================

const limparErrosEnvio = () => {
    erroRespondenteNome.textContent = '';
    erroRespondenteEmail.textContent = '';
    respondenteNome.removeAttribute('aria-invalid');
    respondenteEmail.removeAttribute('aria-invalid');

    perguntasDoFormulario.forEach((pergunta) => {
        const erroSpan = document.getElementById(`erro-pergunta-${pergunta.id}`);
        if (erroSpan) {
            erroSpan.textContent = '';
        }
    });

    alertaErroObrigatorias.hidden = true;
    listaErrosObrigatorias.innerHTML = '';
};

const validarRespondente = () => {
    let valido = true;
    let primeiroCampoInvalido = null;

    if (!Utils.Texto.naoVazio(respondenteNome.value) || respondenteNome.value.trim().length < 2) {
        erroRespondenteNome.textContent = 'Informe seu nome completo (mínimo de 2 caracteres).';
        respondenteNome.setAttribute('aria-invalid', 'true');
        valido = false;
        primeiroCampoInvalido = respondenteNome;
    }

    if (!Utils.Texto.ehEmailValido(respondenteEmail.value)) {
        erroRespondenteEmail.textContent = 'Informe um e-mail em formato válido.';
        respondenteEmail.setAttribute('aria-invalid', 'true');
        valido = false;
        if (!primeiroCampoInvalido) {
            primeiroCampoInvalido = respondenteEmail;
        }
    }

    return { valido, primeiroCampoInvalido };
};

const coletarValorMultiplaEscolha = (pergunta) => {
    const selecionada = perguntasRespostaContainer.querySelector(`input[name="resposta-pergunta-${pergunta.id}"]:checked`);
    if (selecionada) {
        return selecionada.value;
    }
    return '';
};

const coletarValorCheckbox = (pergunta) => {
    const marcadas = perguntasRespostaContainer.querySelectorAll(`input[name="resposta-pergunta-${pergunta.id}[]"]:checked`);
    const valores = [];
    marcadas.forEach((checkbox) => valores.push(checkbox.value));
    return valores;
};

const coletarValorTexto = (pergunta) => {
    const campo = document.getElementById(`resposta-pergunta-${pergunta.id}`);
    return campo.value.trim();
};

/** Lê o valor respondido de uma pergunta na tela, no formato correto para cada tipo */
const coletarValorPergunta = (pergunta) => {
    if (pergunta.tipo === 'multipla_escolha') {
        return coletarValorMultiplaEscolha(pergunta);
    }
    if (pergunta.tipo === 'checkbox') {
        return coletarValorCheckbox(pergunta);
    }
    return coletarValorTexto(pergunta);
};

const validarPergunta = (pergunta, valor) => {
    const semResposta = valor === '' || (Array.isArray(valor) && valor.length === 0);

    if (pergunta.obrigatoria && semResposta) {
        return `“${pergunta.enunciado}” é obrigatória.`;
    }

    if (pergunta.tipo === 'texto_curto' && valor.length > LIMITE_TEXTO_CURTO) {
        return `“${pergunta.enunciado}” deve ter no máximo ${LIMITE_TEXTO_CURTO} caracteres.`;
    }

    return '';
};

const validarPerguntasDoFormulario = () => {
    const mensagensDeErro = [];

    perguntasDoFormulario.forEach((pergunta) => {
        const valor = coletarValorPergunta(pergunta);
        const mensagem = validarPergunta(pergunta, valor);

        if (mensagem !== '') {
            mensagensDeErro.push(mensagem);
            const erroSpan = document.getElementById(`erro-pergunta-${pergunta.id}`);
            if (erroSpan) {
                erroSpan.textContent = mensagem;
            }
        }
    });

    return mensagensDeErro;
};

const exibirErroEnvio = (titulo, mensagens) => {
    tituloErroObrigatorias.textContent = titulo;
    listaErrosObrigatorias.innerHTML = mensagens.map((mensagem) => `<li>${Utils.Texto.escaparHtml(mensagem)}</li>`).join('');
    alertaErroObrigatorias.hidden = false;
    alertaErroObrigatorias.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// ===================================================================
// ENVIO DA RESPOSTA
// ===================================================================

/** Regra 4: mesmo e-mail não pode responder o mesmo formulário duas vezes (comparação sem acento de caixa/espaço) */
const verificarDuplicidade = async (email) => {
    const resultado = await getRespostasDoFormulario(formulario.id);
    if (!resultado.ok) {
        return { ok: false, jaRespondeu: false };
    }

    const emailNormalizado = email.trim().toLowerCase();
    const jaRespondeu = resultado.data.some((resposta) => resposta.email.trim().toLowerCase() === emailNormalizado);

    return { ok: true, jaRespondeu };
};

const montarRespostasParaEnvio = () => {
    return perguntasDoFormulario.map((pergunta) => ({
        perguntaId: pergunta.id,
        valor: coletarValorPergunta(pergunta)
    }));
};

const exibirSucessoEnvio = () => {
    formResposta.hidden = true;
    alertaEnvioSucesso.hidden = false;
};

const enviarFormulario = async (evento) => {
    evento.preventDefault();
    limparErrosEnvio();

    const validacaoRespondente = validarRespondente();
    const mensagensPerguntas = validarPerguntasDoFormulario();

    if (!validacaoRespondente.valido || mensagensPerguntas.length > 0) {
        exibirErroEnvio('Faltam respostas obrigatórias', mensagensPerguntas);
        if (validacaoRespondente.primeiroCampoInvalido) {
            validacaoRespondente.primeiroCampoInvalido.focus();
        }
        return;
    }

    btnEnviarResposta.disabled = true;

    const duplicidade = await verificarDuplicidade(respondenteEmail.value);
    if (!duplicidade.ok) {
        btnEnviarResposta.disabled = false;
        exibirErroEnvio('Não foi possível confirmar o envio', ['Tente novamente em instantes.']);
        return;
    }

    if (duplicidade.jaRespondeu) {
        btnEnviarResposta.disabled = false;
        exibirErroEnvio('Você já respondeu este formulário', ['Cada e-mail pode responder uma única vez.']);
        respondenteEmail.focus();
        return;
    }

    const novaResposta = {
        formularioId: formulario.id,
        nome: respondenteNome.value.trim(),
        email: respondenteEmail.value.trim(),
        respostas: montarRespostasParaEnvio(),
        enviadoEm: new Date().toISOString()
    };

    const resultadoEnvio = await enviarResposta(novaResposta);
    btnEnviarResposta.disabled = false;

    if (!resultadoEnvio.ok) {
        exibirErroEnvio('Não foi possível enviar', [resultadoEnvio.error]);
        return;
    }

    exibirSucessoEnvio();
};

formResposta.addEventListener('submit', enviarFormulario);

// ===================================================================
// INICIALIZAÇÃO
// ===================================================================

const lerFormularioIdDaUrl = () => {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get('formularioId');
};

const inicializar = async () => {
    const idFormulario = lerFormularioIdDaUrl();
    if (!idFormulario) {
        mostrarIndisponivel('Este link não informa qual formulário abrir. Peça um novo link a quem te enviou.');
        return;
    }

    const resultadoFormulario = await getFormulario(idFormulario);
    if (!resultadoFormulario.ok) {
        mostrarIndisponivel('Não encontramos esse formulário. O link pode estar incorreto.');
        return;
    }

    formulario = resultadoFormulario.data;

    if (!formularioEstaDisponivel(formulario)) {
        mostrarIndisponivel('Este formulário foi encerrado ou ainda não está disponível para respostas. Fale com quem enviou o link para mais informações.');
        return;
    }

    const resultadoPerguntas = await getPerguntasBanco();
    if (!resultadoPerguntas.ok) {
        mostrarIndisponivel('Não foi possível carregar as perguntas deste formulário. Tente novamente mais tarde.');
        return;
    }

    const mapaPerguntas = Object.fromEntries(resultadoPerguntas.data.map((pergunta) => [String(pergunta.id), pergunta]));
    perguntasDoFormulario = formulario.perguntas
        .map((idPergunta) => mapaPerguntas[String(idPergunta)])
        .filter((pergunta) => pergunta != null);

    exibirCabecalho(formulario);
    renderizarPerguntas();
};

inicializar();
