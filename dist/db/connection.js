"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.close = close;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log("DB_CONNECTION: Initializing MySQL Connection Pool...");
const pool = promise_1.default.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ecommerce",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
/**
 * Generic Raw SQL Query executor for MySQL
 */
async function query(text, params = []) {
    // Translate Postgres placeholders `$1, $2` to MySQL `?`
    let mysqlText = text.replace(/\$(\d+)/g, "?");
    // Translate ILIKE to case-insensitive LIKE (MySQL is case-insensitive by default with standard collations)
    if (mysqlText.includes("ILIKE")) {
        mysqlText = mysqlText.replace(/ILIKE/gi, "LIKE");
    }
    try {
        const [result] = await pool.query(mysqlText, params);
        let rows = [];
        let rowCount = 0;
        let insertId;
        if (Array.isArray(result)) {
            rows = result;
            rowCount = rows.length;
        }
        else if (result) {
            rowCount = result.affectedRows || 0;
            insertId = result.insertId;
        }
        return {
            rows,
            rowCount,
            insertId,
        };
    }
    catch (err) {
        console.error("MYSQL_QUERY_ERROR:", err.message, "SQL:", mysqlText, "PARAMS:", params);
        throw err;
    }
}
/**
 * Close database connections gracefully
 */
async function close() {
    console.log("DB_CONNECTION: Closing MySQL connection pool...");
    await pool.end();
    console.log("DB_CONNECTION: MySQL connection pool closed.");
}
