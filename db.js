const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure db directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(path.join(dbDir, 'ivhu.db'));

// Initialize database tables
db.serialize(() => {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        unit TEXT NOT NULL,
        img TEXT
    )`);

    // Gallery table
    db.run(`CREATE TABLE IF NOT EXISTS gallery (
        id TEXT PRIMARY KEY,
        src TEXT NOT NULL,
        caption TEXT
    )`);
});

// Products operations
const products = {
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM products', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    add: (product) => {
        return new Promise((resolve, reject) => {
            const { id, name, category, price, unit, img } = product;
            db.run(
                'INSERT INTO products (id, name, category, price, unit, img) VALUES (?, ?, ?, ?, ?, ?)',
                [id, name, category, price, unit, img],
                (err) => {
                    if (err) reject(err);
                    else resolve(product);
                }
            );
        });
    },

    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

// Gallery operations
const gallery = {
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM gallery', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    add: (item) => {
        return new Promise((resolve, reject) => {
            const { id, src, caption } = item;
            db.run(
                'INSERT INTO gallery (id, src, caption) VALUES (?, ?, ?)',
                [id, src, caption || ''],
                (err) => {
                    if (err) reject(err);
                    else resolve(item);
                }
            );
        });
    },

    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM gallery WHERE id = ?', [id], function(err) {
                if (err) {
                    console.error('Database deletion error:', err);
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('No gallery item found with the given ID'));
                } else {
                    resolve();
                }
            });
        });
    }
};

// Close database connection on process exit
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

module.exports = { products, gallery };