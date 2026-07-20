import { query } from "../db/connection";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  created_at?: Date;
}

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    const res = await query<User>("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  },

  async findById(id: number): Promise<Omit<User, "password_hash"> | null> {
    const res = await query<Omit<User, "password_hash">>(
      "SELECT id, email, role, created_at FROM users WHERE id = $1",
      [id]
    );
    return res.rows[0] || null;
  },

  async createUser(email: string, passwordHash: string, role: string = "user"): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();
    await query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)",
      [normalizedEmail, passwordHash, role]
    );
    const res = await query<User>(
      "SELECT * FROM users WHERE id = LAST_INSERT_ID()"
    );
    return res.rows[0];
  }
};
