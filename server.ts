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

  app.get("/api/health", (_req, res) => res.json({ status: "ok", db: "supabase" }));

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
