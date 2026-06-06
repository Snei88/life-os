// server/routes/auth.ts
import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest, JWT_SECRET } from "../middleware/auth.js";

const router = Router();

type BodyGoal = "lose_fat" | "recomp" | "gain_muscle";
type ActivityLevel = "sedentary" | "moderate" | "active" | "very_active";

function toProfile(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    name: r.name,
    email: r.email,
    age: r.age,
    birthDate: r.birth_date,
    gender: r.gender,
    weight: r.weight,
    height: r.height,
    bodyGoal: r.body_goal,
    activityLevel: r.activity_level,
    bmi: r.bmi,
    bmiStatus: r.bmi_status,
    basalMetabolicRate: r.basal_metabolic_rate,
    dailyEnergyExpenditure: r.daily_energy_expenditure,
    calorieTarget: r.calorie_target,
    waterTargetLiters: r.water_target_liters,
    gymTargetKcal: r.gym_target_kcal,
    restTargetKcal: r.rest_target_kcal,
    proteinTarget: r.protein_target,
    currency: r.currency,
    savingsGoal: r.savings_goal,
    emergencyFundGoal: r.emergency_fund_goal,
    mainGoal: r.main_goal,
    emergencyFundCurrent: r.emergency_fund_current,
    createdAt: r.created_at,
  };
}

function calculateNutritionProfile(input: {
  age?: number;
  birthDate?: string;
  gender?: string;
  weight?: number;
  height?: number;
  bodyGoal?: string;
  activityLevel?: string;
}) {
  const age =
    Number(input.age) ||
    (input.birthDate
      ? Math.floor((Date.now() - new Date(input.birthDate).getTime()) / 31557600000)
      : 0);
  const weight = Number(input.weight);
  const height = Number(input.height);
  const gender = input.gender;
  const bodyGoal = input.bodyGoal as BodyGoal;
  const activityLevel = input.activityLevel as ActivityLevel;

  if (!age || !weight || !height || !gender || !bodyGoal || !activityLevel) {
    return null;
  }

  const heightM = height / 100;
  const bmi = Number((weight / (heightM * heightM)).toFixed(1));
  const bmiStatus =
    bmi < 18.5 ? "bajo_peso" : bmi < 25 ? "normal" : bmi < 30 ? "sobrepeso" : "obesidad";
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  const activityFactors: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    moderate: 1.375,
    active: 1.55,
    very_active: 1.725,
  };
  const tdee = Math.round(bmr * activityFactors[activityLevel]);
  const calorieAdjustment =
    bodyGoal === "lose_fat" ? -500 : bodyGoal === "gain_muscle" ? 300 : 0;
  const proteinFactor =
    bodyGoal === "lose_fat" ? 2.4 : bodyGoal === "recomp" ? 2.2 : 2;
  const calorieTarget = tdee + calorieAdjustment;

  return {
    age,
    bmi,
    bmiStatus,
    basalMetabolicRate: Math.round(bmr),
    dailyEnergyExpenditure: tdee,
    calorieTarget,
    gymTargetKcal: calorieTarget + 300,
    restTargetKcal: calorieTarget,
    proteinTarget: Math.round(weight * proteinFactor),
    waterTargetLiters: Number(((weight * 35) / 1000).toFixed(1)),
  };
}

// POST /auth/register - Crear nuevo usuario
router.post("/register", async (req, res: Response) => {
  try {
    const {
      name, email, password,
      age, birthDate, gender, weight, height,
      bodyGoal, activityLevel,
      gymTargetKcal, restTargetKcal, proteinTarget,
      calorieTarget, waterTargetLiters,
      currency, savingsGoal, emergencyFundGoal,
      mainGoal
    } = req.body;
    
    // Validaciones
    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ message: "Nombre, email y contraseña son requeridos" });
      return;
    }
    
    if (password.length < 6) {
      res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }
    
    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();
      
    if (existingUser) {
      res.status(400).json({ message: "Este email ya está registrado" });
      return;
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const nutritionProfile = calculateNutritionProfile({
      age,
      birthDate,
      gender,
      weight,
      height,
      bodyGoal,
      activityLevel,
    });
    
    // Crear usuario con valores por defecto
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: hashedPassword,
        age: nutritionProfile?.age || age || null,
        birth_date: birthDate || null,
        gender: gender || null,
        weight: weight || null,
        height: height || null,
        body_goal: bodyGoal || null,
        activity_level: activityLevel || null,
        bmi: nutritionProfile?.bmi || null,
        bmi_status: nutritionProfile?.bmiStatus || null,
        basal_metabolic_rate: nutritionProfile?.basalMetabolicRate || null,
        daily_energy_expenditure: nutritionProfile?.dailyEnergyExpenditure || null,
        calorie_target: nutritionProfile?.calorieTarget || calorieTarget || null,
        gym_target_kcal: nutritionProfile?.gymTargetKcal || gymTargetKcal || null,
        rest_target_kcal: nutritionProfile?.restTargetKcal || restTargetKcal || null,
        protein_target: nutritionProfile?.proteinTarget || proteinTarget || null,
        water_target_liters: nutritionProfile?.waterTargetLiters || waterTargetLiters || null,
        currency: currency || "COP",
        savings_goal: savingsGoal || 25,
        emergency_fund_goal: emergencyFundGoal || 5000000,
        emergency_fund_current: 0,
        main_goal: mainGoal || "",
      })
      .select()
      .single();
      
    if (error || !newUser) {
      console.error("Error creando usuario:", error);
      res.status(500).json({ message: "Error al crear el usuario" });
      return;
    }
    
    // Generar token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" });
    
    res.status(201).json({ 
      token, 
      user: toProfile(newUser),
      message: "Usuario creado exitosamente" 
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// POST /auth/login - Login con email y password
router.post("/login", async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ message: "Email y contraseña son requeridos" });
      return;
    }
    
    // Buscar usuario por email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();
      
    if (error || !user) {
      res.status(401).json({ message: "Email o contraseña incorrectos" });
      return;
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ message: "Email o contraseña incorrectos" });
      return;
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: toProfile(user) });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// POST /auth/reset-password - Solicitar reset (simulado sin email)
// En producción esto enviaría un email con un token temporal
router.post("/forgot-password", async (req, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ message: "Email requerido" });
      return;
    }
    
    // Verificar que el email existe
    const { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();
      
    if (error || !user) {
      // Por seguridad, no revelamos si el email existe o no
      res.json({ message: "Si el email existe, recibirás instrucciones" });
      return;
    }
    
    // En un caso real, aquí enviarías un email con un token
    // Por ahora, generamos un token de reset temporal válido por 1 hora
    const resetToken = jwt.sign({ userId: user.id, type: 'reset' }, JWT_SECRET, { expiresIn: "1h" });
    
    // En producción: enviar email con link: /reset-password?token=xyz
    // Por ahora devolvemos el token para demostración (en producción no harías esto)
    res.json({ 
      message: "Solicitud procesada. Usa el token para restablecer tu contraseña.",
      // Solo para desarrollo/demo - en producción quitar esta línea
      resetToken 
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// POST /auth/reset-password-confirm - Confirmar reset con token
router.post("/reset-password-confirm", async (req, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      res.status(400).json({ message: "Token y nueva contraseña requeridos" });
      return;
    }
    
    if (newPassword.length < 6) {
      res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }
    
    // Verificar token
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as { userId: number; type: string };
      if (payload.type !== 'reset') throw new Error('Invalid token type');
    } catch {
      res.status(400).json({ message: "Token inválido o expirado" });
      return;
    }
    
    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("id", payload.userId);
      
    if (error) {
      res.status(500).json({ message: "Error actualizando contraseña" });
      return;
    }
    
    res.json({ message: "Contraseña actualizada correctamente" });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error del servidor" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data: user, error } = await supabase.from("users").select("*").eq("id", req.userId).single();
    if (error || !user) { res.status(404).json({ message: "Usuario no encontrado" }); return; }
    res.json(toProfile(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error del servidor" });
  }
});

export default router;
