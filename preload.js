const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addProduct: (nome, quantidade, preco) => ipcRenderer.send('add-product', nome, quantidade, preco),
  getProduct: () => ipcRenderer.invoke('get-products'),
  deleteProduct: (id) => ipcRenderer.invoke('delete-products', id),
  updateProduct: (id, product) => ipcRenderer.invoke('update-products', id, product),
  focusWindow: () => ipcRenderer.send('focus-window')
});
