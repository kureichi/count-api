const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'count_db',
    port: process.env.MYSQLPORT || 3306
};

let db;

(async () => {
    try {
        db = await mysql.createConnection(dbConfig);
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS counts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code TEXT NOT NULL,
                date VARCHAR(255) NOT NULL
            )
        `);
        console.log("Database MySQL Connected & Ready!");
    } catch (err) {
        console.error("Gagal konek database:", err);
    }
})();

app.post('/count/create', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ statusCode: 400, message: "Field 'code' wajib diisi" });

    const date = new Date().toISOString();
    await db.execute('INSERT INTO counts (code, date) VALUES (?, ?)', [code, date]);

    res.json({
        statusCode: 200,
        message: "Sukses membuat data",
        data: { code, date }
    });
});

app.get('/count/detail', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ statusCode: 400, message: "Query param 'code' dibutuhkan" });

    const [rows] = await db.execute('SELECT code, date FROM counts WHERE code = ? LIMIT 1', [code]);
    const data = rows[0];

    if (!data) return res.status(404).json({ statusCode: 404, message: "Data tidak ditemukan" });

    res.json({
        statusCode: 200,
        message: "Sukses mengambil data",
        data: data
    });
});

app.get('/count', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM counts');

    res.json({
        statusCode: 200,
        message: "Sukses mengambil data",
        data: rows
    });
});

app.delete('/count/delete', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ statusCode: 400, message: "Field 'code' wajib diisi" });

    const [result] = await db.execute('DELETE FROM counts WHERE code = ?', [code]);

    if (result.affectedRows === 0) {
        return res.status(404).json({ statusCode: 404, message: "Data tidak ditemukan untuk dihapus" });
    }

    res.json({ 
        statusCode: 200,
        message: "Sukses menghapus data", 
        data: { code } 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
