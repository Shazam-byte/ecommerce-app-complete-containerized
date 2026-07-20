"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const connection_1 = require("../db/connection");
exports.UserModel = {
    async findByEmail(email) {
        const res = await (0, connection_1.query)("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
        return res.rows[0] || null;
    },
    async findById(id) {
        const res = await (0, connection_1.query)("SELECT id, email, role, created_at FROM users WHERE id = $1", [id]);
        return res.rows[0] || null;
    },
    async createUser(email, passwordHash, role = "user") {
        const normalizedEmail = email.toLowerCase().trim();
        await (0, connection_1.query)("INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)", [normalizedEmail, passwordHash, role]);
        const res = await (0, connection_1.query)("SELECT * FROM users WHERE id = LAST_INSERT_ID()");
        return res.rows[0];
    }
};
