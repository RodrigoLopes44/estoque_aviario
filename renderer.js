// renderer.js (organizado por seções de responsabilidade)

window.addEventListener('DOMContentLoaded', () => {
  // 📌 Referências a elementos do DOM
  const nomeSelect = document.getElementById('produto-name');
  const quantidadeInput = document.getElementById('produto-quantidade');
  const precoInput = document.getElementById('produto-preco');
  const idInput = document.getElementById('produto-id');
  const addButton = document.getElementById('btn-add');
  const listButton = document.getElementById('btn-list');
  const productListDiv = document.getElementById('lista-produtos');
  const secaoLista = document.getElementById('secao-lista-produtos');
  const fechaLista = document.getElementById('btn-fechar-lista');
  const filtroProdutos = document.getElementById('filtro-produtos');

  const editModal = new bootstrap.Modal(document.getElementById('editModal'));
  const editIdInput = document.getElementById('edit-produto-id');
  const editNomeInput = document.getElementById('edit-produto-nome');
  const editQuantidadeInput = document.getElementById('edit-produto-quantidade');
  const editPrecoInput = document.getElementById('edit-produto-preco');

  const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
  const confirmModalBody = document.getElementById('confirmModalBody');
  const confirmYesBtn = document.getElementById('confirmYes');
  const confirmNoBtn = document.getElementById('confirmNo');

  const feedbackToastEl = document.getElementById('feedback-toast');
  const toastBody = document.getElementById('toast-body-content');
  const feedbackToast = new bootstrap.Toast(feedbackToastEl);

  // 🔧 Estado
  const nomesUnicos = new Set();
  let produtos = [];
  let pendingDeleteId = null;

  // ✅ Validação de campos numéricos
  [quantidadeInput, precoInput, editQuantidadeInput, editPrecoInput].forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^\d,.]/g, '').replace(/,+/g, ',').replace(/\.+/g, '.');
      if (input.value.includes(',')) input.value = input.value.replace(',', '.');
      const isValid = /^\d*(\.\d*)?$/.test(input.value);
      input.classList.toggle('is-invalid', !isValid);
    });
  });

  // 📢 Toast de feedback
  function mostrarFeedback(mensagem, tipo = 'success') {
    toastBody.textContent = mensagem;
    const header = feedbackToastEl.querySelector('.toast-header');
    header.classList.remove('bg-success', 'bg-danger', 'text-white');
    header.classList.add(tipo === 'success' ? 'bg-success' : 'bg-danger', 'text-white');
    feedbackToast.show();
  }

  // 🧼 Limpeza de formulário
  function resetarFormulario() {
    nomeSelect.disabled = false;
    quantidadeInput.disabled = false;
    precoInput.disabled = false;
    idInput.value = '';
    nomeSelect.selectedIndex = 0;
    quantidadeInput.value = '';
    precoInput.value = '';
    addButton.innerHTML = '<i class="bi bi-plus-circle"></i> Adicionar Produto';
    addButton.classList.remove('btn-primary');
    addButton.classList.add('btn-success');
    nomeSelect.focus();
  }

  // 🔄 Atualização do filtro de nomes
  function atualizarFiltroSelect() {
    filtroProdutos.innerHTML = '<option value="">Filtrar por nome...</option>';
    Array.from(nomesUnicos).sort().forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      filtroProdutos.appendChild(opt);
    });
  }

  // 🧾 Renderizar a lista de produtos
  async function renderizarListaProdutos() {
    nomesUnicos.clear();
    produtos = await window.api.getProduct();
    produtos.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
    secaoLista.classList.remove('d-none');
    productListDiv.innerHTML = '';

    if (produtos.length === 0) {
      productListDiv.innerHTML = '<p class="text-center text-muted">Nenhum produto cadastrado.</p>';
      atualizarFiltroSelect();
      return;
    }

    produtos.forEach(produto => {
      nomesUnicos.add(produto.nome);
      productListDiv.innerHTML += criarCardProduto(produto);
    });

    atualizarFiltroSelect();
  }

  // 🧱 Componente visual de item
  function criarCardProduto(produto) {
    const precoFormatado = parseFloat(produto.preco).toFixed(2).replace('.', ',');
    const qtdFormatada = parseFloat(produto.quantidade).toFixed(3).replace('.', ',');
    const dataFormatada = new Date(produto.data_criacao).toLocaleString('pt-BR');
    return `
      <div class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-1">${produto.nome}</h5>
          <small class="text-muted">Adicionado em: ${dataFormatada} | Quantidade: ${qtdFormatada} kg | Preço: R$ ${precoFormatado}</small>
        </div>
        <div>
          <button class="btn btn-sm btn-warning btn-editar" data-id="${produto.id}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger btn-excluir" data-id="${produto.id}"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `;
  }

  // ➕ Adicionar produto
  addButton.addEventListener('click', async () => {
    secaoLista.classList.remove('d-none');
    const nome = nomeSelect.value.trim();
    filtroProdutos.value = '';
    const quantidade = quantidadeInput.value.trim();
    const preco = precoInput.value.trim();

    if (!nome || !quantidade || !preco) {
      mostrarFeedback('❌ Todos os campos são obrigatórios.', 'error');
      return;
    }

    try {
      await window.api.addProduct(nome, parseFloat(quantidade.replace(',', '.')), parseFloat(preco.replace(',', '.')));
      mostrarFeedback('✅ Produto adicionado com sucesso!');
      await renderizarListaProdutos();
      resetarFormulario();
    } catch (error) {
      mostrarFeedback('❌ Erro ao adicionar produto.', 'error');
    }
  });

  // 📋 Listar todos
  listButton.addEventListener('click', renderizarListaProdutos);
  fechaLista.addEventListener('click', () => secaoLista.classList.add('d-none'));

  // 🔎 Filtro por nome
  filtroProdutos.addEventListener('change', async e => {
    const termo = e.target.value;
    if (termo === '') {
      await renderizarListaProdutos();
      return;
    }

    const produtosFiltrados = produtos.filter(p => p.nome === termo);
    productListDiv.innerHTML = '';

    if (produtosFiltrados.length === 0) {
      productListDiv.innerHTML = '<p class="text-center text-muted">Nenhum produto encontrado.</p>';
      return;
    }

    produtosFiltrados.forEach(produto => {
      productListDiv.innerHTML += criarCardProduto(produto);
    });
  });

  // 🖊️ Edição e exclusão via lista
  productListDiv.addEventListener('click', async (event) => {
    const target = event.target.closest('button');
    const id = target?.dataset.id;

    if (target.classList.contains('btn-editar')) {
      const produto = produtos.find(p => p.id == id);
      if (produto) {
        editIdInput.value = produto.id;
        editNomeInput.value = produto.nome;
        editQuantidadeInput.value = produto.quantidade;
        editPrecoInput.value = parseFloat(produto.preco).toFixed(2);
        editModal.show();
      }
    }

    if (target.classList.contains('btn-excluir')) {
      pendingDeleteId = id;
      confirmModalBody.textContent = 'Tem certeza que deseja excluir este produto?';
      confirmModal.show();
    }
  });

  // ✅ Confirma exclusão
  confirmYesBtn.addEventListener('click', async () => {
    if (pendingDeleteId) {
      try {
        const result = await window.api.deleteProduct(pendingDeleteId);
        if (result.success) {
          await renderizarListaProdutos();
          resetarFormulario();
          mostrarFeedback('🗑 Produto excluído com sucesso!');
        } else {
          mostrarFeedback(`❌ Erro ao excluir: ${result.message}`, 'error');
        }
      } catch (error) {
        mostrarFeedback('❌ Erro ao excluir produto.', 'error');
      }
    }
    confirmModal.hide();
    pendingDeleteId = null;
  });

  // ❌ Cancela exclusão
  confirmNoBtn.addEventListener('click', () => {
    pendingDeleteId = null;
    confirmModal.hide();
  });

  // 💾 Salvar edição
  saveEditButton.addEventListener('click', async () => {
    const id = editIdInput.value;
    const nome = editNomeInput.value.trim();
    const quantidade = editQuantidadeInput.value.trim();
    const preco = editPrecoInput.value.trim();

    if (!quantidade || !preco) {
      mostrarFeedback('❌ Quantidade e Preço são obrigatórios.', 'error');
      return;
    }

    try {
      const result = await window.api.updateProduct(id, {
        nome,
        quantidade: parseFloat(quantidade.replace(',', '.')),
        preco: parseFloat(preco.replace(',', '.')),
      });

      if (result.success) {
        editModal.hide();
        mostrarFeedback('✏️ Produto atualizado com sucesso!');
        await renderizarListaProdutos();
        resetarFormulario();
      } else {
        mostrarFeedback(`❌ Erro ao atualizar: ${result.message}`, 'error');
      }
    } catch (error) {
      mostrarFeedback('❌ Erro ao atualizar produto.', 'error');
    }
  });
});