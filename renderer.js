// renderer.js - VERSÃO FINAL COM GERENCIAMENTO DE FOCO CENTRALIZADO

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM totalmente carregado. renderer.js em execução.');

  // --- CAPTURA DE ELEMENTOS ---
  const nomeSelect = document.getElementById('produto-nome');
  const quantidadeInput = document.getElementById('produto-quantidade');
  const precoInput = document.getElementById('produto-preco');
  const idInput = document.getElementById('produto-id');
  const addButton = document.getElementById('btn-add');
  const listButton = document.getElementById('btn-list');
  const productListDiv = document.getElementById('lista-produtos');
  const secaoLista = document.getElementById('secao-lista-produtos');
  const fechaLista = document.getElementById('btn-fechar-lista');
  const editModalElement = document.getElementById('editModal');
  const editModal = new bootstrap.Modal(editModalElement);
  const editIdInput = document.getElementById('edit-produto-id');
  const editNomeInput = document.getElementById('edit-produto-nome');
  const editQuantidadeInput = document.getElementById('edit-produto-quantidade');
  const editPrecoInput = document.getElementById('edit-produto-preco');
  const saveEditButton = document.getElementById('btn-salvar-edicao');
  const feedbackToastEl = document.getElementById('feedback-toast');
  const toastBody = document.getElementById('toast-body-content');
  const feedbackToast = new bootstrap.Toast(feedbackToastEl);

  let produtos = [];

  // --- FUNÇÕES AUXILIARES ---

  function mostrarFeedback(mensagem, tipo = 'success') {
    toastBody.textContent = mensagem;
    const toastHeader = feedbackToastEl.querySelector('.toast-header');
    toastHeader.classList.remove('bg-success', 'bg-danger', 'text-white');
    if (tipo === 'success') {
      toastHeader.classList.add('bg-success', 'text-white');
    } else if (tipo === 'error') {
      toastHeader.classList.add('bg-danger', 'text-white');
    }
    feedbackToast.show();
  }
  
  // Função centralizada e robusta para resetar o formulário e o foco
  function resetarFormulario() {
    console.log('Resetando o formulário e o foco da janela.');

    nomeSelect.disabled = false;
    quantidadeInput.disabled = false;
    precoInput.disabled = false;

    idInput.value = '';
    nomeSelect.selectedIndex = 0;
    quantidadeInput.value = '';
    precoInput.value = '';

    addButton.textContent = 'Adicionar Produto';
    addButton.classList.remove('btn-success');
    addButton.classList.add('btn-primary');

    // Retire o foco da lista de produtos
    document.activeElement.blur();

    // Aguarde o DOM estabilizar antes de tentar focar
    setTimeout(() => {
      nomeSelect.focus();
    }, 100); // 100ms geralmente é suficiente
  }


  async function renderizarListaProdutos() {
    produtos = await window.api.getProduct(); 
    secaoLista.classList.remove('d-none');
    productListDiv.innerHTML = '';

    if (produtos.length === 0) {
      productListDiv.innerHTML = '<p class="text-center text-muted">Nenhum produto cadastrado.</p>';
      return;
    }

    produtos.forEach(produto => {
      const precoFormatado = parseFloat(produto.preco).toFixed(2).replace('.', ',');
      const qtdFormatada = parseFloat(produto.quantidade).toFixed(3).replace('.', ',');
      const dataFormatada = new Date(produto.data_criacao).toLocaleDateString('pt-BR');
      const itemHtml = `
        <div class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">${produto.nome}</h5>
            <small class="text-muted">Adicionado em: ${dataFormatada} | Quantidade: ${qtdFormatada} kg | Preço: R$ ${precoFormatado}</small>
          </div>
          <div>
            <button class="btn btn-sm btn-warning btn-editar" data-id="${produto.id}">Editar</button>
            <button class="btn btn-sm btn-danger btn-excluir" data-id="${produto.id}">Excluir</button>
          </div>
        </div>
      `;
      productListDiv.innerHTML += itemHtml;
    });
  }

  // --- OUVINTES DE EVENTO ---

  addButton.addEventListener('click', async () => {
    const nome = nomeSelect.value;
    const quantidade = quantidadeInput.value;
    const preco = precoInput.value;
    if (nome.trim().length === 0 || quantidade.trim().length === 0 || preco.trim().length === 0) {
      mostrarFeedback('Todos os campos são obrigatórios.', 'error');
      return;
    }
    await window.api.addProduct(nome, parseFloat(quantidade), parseFloat(preco.replace(',', '.')));
    mostrarFeedback('Produto adicionado com sucesso!');
    await renderizarListaProdutos();
    resetarFormulario();
  });

  listButton.addEventListener('click', renderizarListaProdutos);

  fechaLista.addEventListener('click', () => {
    secaoLista.classList.add('d-none');
  });

  // OUVINTE PARA CLIQUES NA LISTA (EDITAR/EXCLUIR)
productListDiv.addEventListener('click', async (event) => {
  const target = event.target;

  // Lógica de Exclusão
  if (target.classList.contains('btn-excluir')) {
    const id = target.dataset.id;
    const confirmacao = confirm('Tem certeza que deseja excluir este produto?');

    if (confirmacao) {
      const result = await window.api.deleteProduct(id);
      if (result.success) {
        await renderizarListaProdutos();        
        // A CURA FINAL: Damos um "respiro" para o motor de renderização
        setTimeout(() => {
          resetarFormulario();
        }, 50);

        mostrarFeedback('Produto excluído com sucesso!');
      } else {
        mostrarFeedback(`Falha ao excluir produto: ${result.message}`, 'error');
      }
    }
  }

    if (target.classList.contains('btn-editar')) {
      const id = target.dataset.id;
      const produtoParaEditar = produtos.find(p => p.id == id);
      if (produtoParaEditar) {
        editIdInput.value = produtoParaEditar.id;
        editNomeInput.value = produtoParaEditar.nome;
        editQuantidadeInput.value = produtoParaEditar.quantidade;
        editPrecoInput.value = parseFloat(produtoParaEditar.preco).toFixed(2);
        editModal.show();
      }
    }
  });

  saveEditButton.addEventListener('click', async () => {
    const id = editIdInput.value;
    const quantidade = editQuantidadeInput.value;
    const preco = editPrecoInput.value;

    if (quantidade.trim().length === 0 || preco.trim().length === 0) {
      mostrarFeedback('Quantidade e Preço são obrigatórios.', 'error');
      return;
    }

    const productData = {
      nome: editNomeInput.value,
      quantidade: parseFloat(quantidade),
      preco: parseFloat(preco.replace(',', '.')),
    };

    const result = await window.api.updateProduct(id, productData);
    if (result.success) {
      editModal.hide();
      mostrarFeedback('Produto atualizado com sucesso!');
      await renderizarListaProdutos();
      resetarFormulario();
    } else {
      mostrarFeedback(`Falha ao atualizar produto: ${result.message}`, 'error');
    }
  });

  // Removemos o ouvinte 'hidden.bs.modal' pois a função de reset já é chamada
  // nos fluxos de sucesso de edição e exclusão, tornando-o redundante e
  // garantindo que o foco só seja resetado após uma ação bem-sucedida.

// --- BLOCO DE TESTE DE LABORATÓRIO PARA O DELETE ---

// const testDeleteButton = document.getElementById('test-delete-button');

// testDeleteButton.addEventListener('click', async () => {
//   console.clear(); // Limpa o console para uma análise limpa
//   console.log('--- INICIANDO TESTE DE EXCLUSÃO ISOLADO ---');
  
//   const idParaDeletar = 63; // ID fixo para o teste
  
//   const confirmacao = confirm(`TESTE: Tem certeza que deseja excluir o produto com ID ${idParaDeletar}?`);

//   if (confirmacao) {
//     console.log(`[PASSO 1] Confirmação recebida. Chamando window.api.deleteProduct com ID: ${idParaDeletar}`);
//     const result = await window.api.deleteProduct(idParaDeletar);
//     console.log('[PASSO 2] Resposta recebida do main.js:', result);

//     if (result.success) {
//       console.log('[PASSO 3] Exclusão bem-sucedida. Chamando renderizarListaProdutos()...');
//       await renderizarListaProdutos();
//       console.log('[PASSO 4] renderizarListaProdutos() concluído. Chamando resetarFormulario()...');
      
//       setTimeout(() => {
//         resetarFormulario();
//       }, 50); // Um pequeno atraso de 50 milissegundos
      
//       console.log('[PASSO 5] resetarFormulario() concluído. Foco deveria estar no formulário.');
//       mostrarFeedback('TESTE: Produto excluído com sucesso!');
//     } else {
//       console.error('[ERRO NO TESTE] Falha ao excluir produto:', result.message);
//       mostrarFeedback(`TESTE: Falha ao excluir produto: ${result.message}`, 'error');
//     }
//   } else {
//     console.log('TESTE CANCELADO PELO USUÁRIO.');
//   }
//   console.log('--- FIM DO TESTE DE EXCLUSÃO ---');
// });

});