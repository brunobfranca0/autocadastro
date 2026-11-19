import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { isFirebaseConfigured } from "./firebase-config.js";
import { db } from "./firebase.js";

const COLECAO = "automoveis";

const form = document.getElementById("form-automovel");
const formTitulo = document.getElementById("form-titulo");
const btnCancelar = document.getElementById("btn-cancelar");
const btnSalvar = document.getElementById("btn-salvar");
const feedback = document.getElementById("feedback");
const listaEl = document.getElementById("lista-automoveis");
const listaContagem = document.getElementById("lista-contagem");
const avisoConfig = document.getElementById("aviso-config");

const campos = {
  marca: document.getElementById("marca"),
  modelo: document.getElementById("modelo"),
  cor: document.getElementById("cor"),
  placa: document.getElementById("placa"),
  ano: document.getElementById("ano"),
  km: document.getElementById("km"),
};

const placaPreview = document.getElementById("placa-preview");
const placaLegenda = document.getElementById("placa-legenda");

/** @type {string | null} */
let editandoId = null;

function mostrarFeedback(mensagem, tipo) {
  feedback.hidden = false;
  feedback.textContent = mensagem;
  feedback.className = `feedback feedback-${tipo === "ok" ? "ok" : "err"}`;
}

function limparFeedback() {
  feedback.hidden = true;
  feedback.textContent = "";
  feedback.className = "feedback";
}

function anoMaximo() {
  return new Date().getFullYear() + 1;
}

function limparErrosCampo() {
  for (const input of Object.values(campos)) {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
  document.querySelectorAll(".field-error").forEach((el) => {
    el.hidden = true;
    el.textContent = "";
  });
}

function mostrarErroCampo(campo, mensagem) {
  const input = campos[campo];
  const erro = document.getElementById(`erro-${campo}`);
  if (!input || !erro) {
    mostrarFeedback(mensagem, "err");
    return;
  }
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", erro.id);
  erro.hidden = false;
  erro.textContent = mensagem;
  input.focus();
}

function atualizarPlaca() {
  const placa = campos.placa.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  placaPreview.textContent = placa || "·······";
  placaPreview.classList.toggle("is-empty", !placa);
  const nome = [campos.marca.value.trim(), campos.modelo.value.trim()].filter(Boolean).join(" ");
  placaLegenda.textContent = nome || "Marca e modelo";
}

function formularioSujo() {
  return Object.values(campos).some((el) => el.value.trim() !== "");
}

/**
 * @returns {{ ok: true, data: object } | { ok: false, field: string, error: string }}
 */
function lerFormulario() {
  const marca = campos.marca.value.trim();
  const modelo = campos.modelo.value.trim();
  const cor = campos.cor.value.trim();
  const placa = campos.placa.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  const anoTexto = campos.ano.value.trim();
  const kmTexto = campos.km.value.trim();
  const ano = Number(anoTexto);
  const km = Number(kmTexto);

  if (!marca) return { ok: false, field: "marca", error: "Informe a marca." };
  if (!modelo) return { ok: false, field: "modelo", error: "Informe o modelo." };
  if (!cor) return { ok: false, field: "cor", error: "Informe a cor." };
  if (!placa) return { ok: false, field: "placa", error: "Informe a placa." };
  if (placa.length !== 7) {
    return { ok: false, field: "placa", error: "A placa tem 7 caracteres, como ABC1D23." };
  }

  if (!anoTexto || !Number.isInteger(ano) || ano < 1900 || ano > anoMaximo()) {
    return {
      ok: false,
      field: "ano",
      error: `Use um ano entre 1900 e ${anoMaximo()}.`,
    };
  }

  if (!kmTexto || !Number.isFinite(km) || km < 0 || !Number.isInteger(km)) {
    return {
      ok: false,
      field: "km",
      error: "Use um número inteiro a partir de zero.",
    };
  }

  return {
    ok: true,
    data: {
      marca,
      modelo,
      cor,
      placa,
      anoFabricacao: ano,
      kmRodada: km,
      atualizadoEm: serverTimestamp(),
    },
  };
}

function limparFormulario() {
  form.reset();
  editandoId = null;
  formTitulo.textContent = "Ficha";
  btnCancelar.hidden = true;
  btnSalvar.textContent = "Guardar ficha";
  limparErrosCampo();
  atualizarPlaca();
  marcarLinhaEdicao();
}

function entrarModoEdicao(id, dados) {
  editandoId = id;
  campos.marca.value = dados.marca ?? "";
  campos.modelo.value = dados.modelo ?? "";
  campos.cor.value = dados.cor ?? "";
  campos.placa.value = dados.placa ?? "";
  campos.ano.value = dados.anoFabricacao ?? "";
  campos.km.value = dados.kmRodada ?? "";
  formTitulo.textContent = "Correção da ficha";
  btnCancelar.hidden = false;
  btnSalvar.textContent = "Guardar correção";
  limparFeedback();
  limparErrosCampo();
  atualizarPlaca();
  marcarLinhaEdicao();
  campos.marca.focus();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function marcarLinhaEdicao() {
  listaEl.querySelectorAll("[data-id]").forEach((item) => {
    const ativa = Boolean(editandoId) && item.dataset.id === editandoId;
    item.classList.toggle("is-editing", ativa);
    if (ativa) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  });
}

function formatarKm(valor) {
  return Number(valor).toLocaleString("pt-BR");
}

function textoContagem(total) {
  if (total === 1) return "1 carro";
  return `${total} carros`;
}

function renderLista(docs) {
  listaContagem.textContent = textoContagem(docs.length);

  if (docs.length === 0) {
    listaEl.innerHTML = `<li class="yard-empty">Nenhum carro nesta ficha.</li>`;
    marcarLinhaEdicao();
    return;
  }

  listaEl.innerHTML = docs
    .map(({ id, data }) => {
      const safe = (v) =>
        String(v ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");

      return `
        <li
          class="yard-item"
          data-id="${safe(id)}"
          data-marca="${safe(data.marca)}"
          data-modelo="${safe(data.modelo)}"
          data-cor="${safe(data.cor)}"
          data-placa="${safe(data.placa)}"
          data-ano="${safe(data.anoFabricacao)}"
          data-km="${safe(data.kmRodada)}"
        >
          <span class="mini-plate" translate="no">${safe(data.placa)}</span>
          <div>
            <p class="car-name">${safe(data.marca)} ${safe(data.modelo)}</p>
            <p class="car-meta">${safe(data.cor)} · ${safe(data.anoFabricacao)} · ${safe(formatarKm(data.kmRodada))} km</p>
          </div>
          <button type="button" class="btn-edit" data-action="editar">Corrigir</button>
        </li>
      `;
    })
    .join("");

  marcarLinhaEdicao();
}

function iniciarListener() {
  const q = query(collection(db, COLECAO), orderBy("atualizadoEm", "desc"));

  onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
      renderLista(docs);
    },
    (error) => {
      console.error(error);
      mostrarFeedback(
        "A lista não carregou. Veja as regras do Firestore e a conexão, e abra a página de novo.",
        "err"
      );
    }
  );
}

listaEl.addEventListener("click", (event) => {
  const botao = event.target.closest('[data-action="editar"]');
  if (!botao) return;

  const item = botao.closest("[data-id]");
  if (!item) return;

  entrarModoEdicao(item.dataset.id, {
    placa: item.dataset.placa,
    marca: item.dataset.marca,
    modelo: item.dataset.modelo,
    cor: item.dataset.cor,
    anoFabricacao: item.dataset.ano,
    kmRodada: item.dataset.km,
  });
});

btnCancelar.addEventListener("click", () => {
  limparFormulario();
  limparFeedback();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !editandoId) return;
  limparFormulario();
  limparFeedback();
});

window.addEventListener("beforeunload", (event) => {
  if (!formularioSujo()) return;
  event.preventDefault();
  event.returnValue = "";
});

for (const [nome, input] of Object.entries(campos)) {
  input.addEventListener("input", () => {
    if (nome === "placa") {
      const cursor = input.selectionStart ?? input.value.length;
      const limpa = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
      const pos = Math.min(
        input.value.slice(0, cursor).toUpperCase().replace(/[^A-Z0-9]/g, "").length,
        limpa.length
      );
      input.value = limpa;
      input.setSelectionRange(pos, pos);
    }
    const erro = document.getElementById(`erro-${nome}`);
    if (erro && !erro.hidden) {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
      erro.hidden = true;
      erro.textContent = "";
    }
    if (nome === "marca" || nome === "modelo" || nome === "placa") atualizarPlaca();
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  limparFeedback();

  limparErrosCampo();

  if (!isFirebaseConfigured() || !db) {
    mostrarFeedback("A ficha não grava sem as chaves em js/firebase-config.js.", "err");
    return;
  }

  const resultado = lerFormulario();
  if (!resultado.ok) {
    mostrarErroCampo(resultado.field, resultado.error);
    return;
  }

  const eraEdicao = Boolean(editandoId);
  btnSalvar.disabled = true;
  btnSalvar.textContent = "Guardando…";
  btnSalvar.setAttribute("aria-busy", "true");

  try {
    if (editandoId) {
      await updateDoc(doc(db, COLECAO, editandoId), resultado.data);
      mostrarFeedback("Correção guardada.", "ok");
    } else {
      await addDoc(collection(db, COLECAO), resultado.data);
      mostrarFeedback("Ficha guardada.", "ok");
    }
    limparFormulario();
  } catch (error) {
    console.error(error);
    mostrarFeedback(
      "Não deu para gravar. Confira as credenciais, as regras do Firestore e a conexão.",
      "err"
    );
    btnSalvar.textContent = eraEdicao ? "Guardar correção" : "Guardar ficha";
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.removeAttribute("aria-busy");
    if (btnSalvar.textContent === "Guardando…") {
      btnSalvar.textContent = editandoId ? "Guardar correção" : "Guardar ficha";
    }
  }
});

function iniciar() {
  const ano = document.getElementById("ano");
  if (ano) ano.max = String(anoMaximo());

  if (!isFirebaseConfigured() || !db) {
    avisoConfig.hidden = false;
    btnSalvar.disabled = true;
    return;
  }

  avisoConfig.hidden = true;
  iniciarListener();
}

iniciar();
