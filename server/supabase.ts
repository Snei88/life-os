//server/supabase.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

console.log("[supabase] SUPABASE_URL", url ? "OK" : "MISSING");
console.log("[supabase] SUPABASE_SERVICE_KEY", key ? "OK" : "MISSING");

if (!url || !key) {
  throw new Error("SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar en .env");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function setupUser() {
  const { data } = await supabase.from("users").select("id").limit(1);
  if (!data?.length) {
    const hash = await bcrypt.hash("lifeos2024", 10);
    const { error } = await supabase.from("users").insert({
      name: "Sneider",
      email: "sneider@lifeos.local",
      password_hash: hash,
      gym_target_kcal: 1950,
      rest_target_kcal: 1700,
      protein_target: 126,
      savings_goal: 25,
      emergency_fund_goal: 5000000,
      main_goal: "",
    });
    if (error) {
      console.error("Error creando usuario:", error.message);
    } else {
      console.log("✅ Usuario creado. Contraseña: lifeos2024");
    }
  }
}
