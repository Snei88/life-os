import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { setupUser } from "./server/supabase.js";
import authRoutes from "./server/routes/auth.js";
import habitsRoutes from "./server/routes/habits.js";
import mealsRoutes from "./server/routes/meals.js";
import workoutsRoutes from "./server/routes/workouts.js";
import financeRoutes from "./server/routes/finance.js";
import goalsRoutes from "./server/routes/goals.js";
import mindsetRoutes from "./server/routes/mindset.js";
import scheduleRoutes from "./server/routes/schedule.js";
import usersRoutes from "./server/routes/users.js";
import foodItemsRouter from "./server/routes/foodItems.js";
import waterRouter from "./server/routes/water.js";
import nutritionRulesRouter from "./server/routes/nutritionRules.js";
import nutritionRouter from "./server/routes/nutrition.js";
import gptRouter from "./server/routes/gpt.js";

async function startServer() {
  await setupUser();

  const app = express();
  const port = Number(process.env.PORT) || 3008;

  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/habits", habitsRoutes);
  app.use("/api/meals", mealsRoutes);
  app.use("/api/workouts", workoutsRoutes);
  app.use("/api/finance", financeRoutes);
  app.use("/api/goals", goalsRoutes);
  app.use("/api/mindset", mindsetRoutes);
  app.use("/api/schedule", scheduleRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/food-items", foodItemsRouter);
  app.use("/api/water", waterRouter);
  app.use("/api/nutrition-rules", nutritionRulesRouter);
  app.use("/api/nutrition", nutritionRouter);
  app.use("/api/gpt", gptRouter);

  app.get("/api/health", (_req, res) => res.json({ status: "ok", db: "supabase" }));
  app.get("/privacy-policy", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Life OS - Politica de privacidad</title>
  </head>
  <body>
    <main style="font-family: system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 20px; line-height: 1.55;">
      <h1>Life OS - Politica de privacidad</h1>
      <p>Life OS usa la informacion que el usuario registra para mostrar y actualizar datos personales de bienestar, habitos, metas, nutricion, finanzas y diario dentro de la propia aplicacion.</p>
      <p>La accion de ChatGPT se conecta al backend de Life OS solo para consultar o guardar datos solicitados por el usuario. No vende datos personales ni los comparte con terceros para publicidad.</p>
      <p>ChatGPT puede enviar al endpoint de Life OS los parametros necesarios para ejecutar la accion seleccionada, como fechas, metas, habitos, transacciones o entradas de diario.</p>
      <p>Para solicitar eliminacion o cambios de datos, usa las funciones disponibles dentro de Life OS o contacta al responsable de la aplicacion.</p>
      <p>Ultima actualizacion: 2026-06-08.</p>
    </main>
  </body>
</html>`);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Life OS corriendo en http://localhost:${port}`);
  });
}

startServer();
