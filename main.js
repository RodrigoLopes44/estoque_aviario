const { app, BrowserWindow, ipcMain } = require('electron');
const { Pool } = require('pg');
const path = require('node:path');
let win;

// Bloco de conexao //
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'aviario_db',
    password: 'admin',
    port: 5432,
});

const testConnection = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('Conexao com o PostgreSQL bem sucedida.');
    } catch (err) {
        console.error('Erro ao conectar com o PostgreSQL:', err.stack);
    }
};

testConnection();
// Fim do bloco de conexao //

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), //__dirname funciona para validar o path de multiplos SO`s, sem ter q definir manualmente
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    win.loadFile('index.html');
    win.webContents.openDevTools(); // para debugar agora, apagar depois
}

app.whenReady().then(() => {
    createWindow();

    const { session } = require('electron');

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["script-src 'self' https://cdn.jsdelivr.net"]
            }
        });
    });
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

ipcMain.on('add-product', async (event, nome, quantidade, preco) => { // ipcMain.on -> para recepcao de instrucoes send, assincrona para esperar resposta do BD
    console.log('Dados do produto:', nome, quantidade, preco);
    try {
        const query = 'INSERT INTO produtos (nome, quantidade, preco) VALUES ($1, $2, $3)';
        const values = [nome, quantidade, preco];
        
        await pool.query(query, values);
        
        console.log('Produto inserido com sucesso no BD!');
        
    } catch (err) {
        console.error('ERRO AO INSERIR DADOS NO BANCO:', err);
    }
});

// handle para recepcao de invokes (do preload)
ipcMain.handle('get-products', async () => { // novamente funcao assincrona para esperar resposta do BD
    console.log('Requisição recebida no canal get-products.');
    
    try {
        const query = 'SELECT * FROM produtos ORDER BY id DESC';

        const { rows } = await pool.query(query);
        console.log('Produtos encontrados: ', rows);
        
        return rows
    
    } catch (err) {
        console.log('Erro ao buscar produtos: ', err);
    
        return []
    }
});

ipcMain.handle('delete-products', async (event, id) => {
  try {
    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    return { success: true };
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    return { success: false, message: err.message };
  }
});


ipcMain.handle('update-products', async (event, id, product) => {
    try {
        const query = 'UPDATE produtos SET nome = $1, quantidade = $2, preco = $3 WHERE id = $4';
        const values = [product.nome, product.quantidade, product.preco, parseInt(id, 10)];
        await pool.query(query, values);
        return {success: true}
    } catch (err) {
        console.error('Erro ao alterar o produto:', err);
        return { success: false, message: 'Ocorreu um erro no servidor.' };
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('focus-window', () => {
    if (win) {
        win.webContents.focus();
    }
});