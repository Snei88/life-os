//C:\Users\SneiderCM\Desktop\life-os\server\db.ts
import pkg from "pg";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "lifeos",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

export async function initDB() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schema);

  const { rows } = await pool.query("SELECT id FROM users LIMIT 1");
  if (rows.length === 0) {
    const hash = await bcrypt.hash("lifeos2024", 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, gym_target_kcal, rest_target_kcal, protein_target, savings_goal, emergency_fund_goal, main_goal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ["Sneider", "sneider@lifeos.local", hash, 1950, 1700, 126, 25, 5000000, ""]
    );
    console.log("✅ Usuario creado. Contraseña: lifeos2024");
  }
}
