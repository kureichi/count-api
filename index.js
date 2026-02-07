// code dibuat dengan gemini karena pengen cepet

const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = './data/database.db'; // Path sesuai permintaanmu untuk Railway persistence

let db;

// Inisialisasi Database
(async () => {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS counts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            date TEXT NOT NULL
        )
    `);
    console.log("Database ready at " + dbPath);
})();

// 1. POST /count/create
app.post('/count/create', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Field 'code' wajib diisi" });

    const date = new Date().toISOString();
    await db.run('INSERT INTO counts (code, date) VALUES (?, ?)', [code, date]);

    res.json({
        message: "Sukses membuat data",
        data: { code, date }
    });
});

// 2. GET /count/detail?code=xxx
app.get('/count/detail', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Query param 'code' dibutuhkan" });

    const data = await db.get('SELECT code, date FROM counts WHERE code = ?', [code]);

    if (!data) return res.status(404).json({ error: "Data tidak ditemukan" });

    res.json({
        message: "Sukses mengambil data",
        data: data
    });
});

// 3. DELETE /count/delete
app.delete('/count/delete', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Field 'code' wajib diisi" });

    const result = await db.run('DELETE FROM counts WHERE code = ?', [code]);

    if (result.changes === 0) {
        return res.status(404).json({ error: "Data tidak ditemukan untuk dihapus" });
    }

    res.json({ message: "Sukses menghapus data", code });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));