import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const { Pool } = pg;

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

const rl = readline.createInterface({ input, output });
const login = (await rl.question("Login admin: ")).trim().toLowerCase();
const email = (await rl.question("Email admin: ")).trim().toLowerCase();
const nom = (await rl.question("Nom affiché: ")).trim();
const password = await rl.question("Mot de passe: ", { hideEchoBack: true });
rl.close();

if (!login || !email || !nom || password.length < 10) {
  throw new Error("Login, email, nom requis et mot de passe de 10 caractères minimum.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const passwordHash = hashPassword(password);
  const result = await pool.query(
    `INSERT INTO administrateurs (nom, email, login, mot_de_passe, role, statut, date_maj)
     VALUES ($1, $2, $3, $4, 'super_admin', 'actif', NOW())
     RETURNING id, nom, email, login, role, statut, date_maj`,
    [nom, email, login, passwordHash],
  );

  console.log("Administrateur créé:", result.rows[0]);
} finally {
  await pool.end();
}
