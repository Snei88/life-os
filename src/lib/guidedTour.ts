export interface GuidedTourStep {
  id: string;
  tab: string;
  targetId: string;
  title: string;
  description: string;
  accent: string;
}

export const GUIDED_TOUR_STEPS: GuidedTourStep[] = [
  {
    id: "dashboard",
    tab: "dashboard",
    targetId: "tour-dashboard",
    title: "Dashboard",
    description: "Tu panel central. Aquí ves el estado general de hábitos, nutrición, gym, finanzas y foco diario.",
    accent: "orange",
  },
  {
    id: "ai-recommendations",
    tab: "ai-recommendations",
    targetId: "tour-ai-recommendations",
    title: "IA",
    description: "Este módulo te da recomendaciones accionables basadas en tus registros y tu progreso reciente.",
    accent: "orange",
  },
  {
    id: "habits",
    tab: "habits",
    targetId: "tour-habits",
    title: "Hábitos",
    description: "Gestiona tus hábitos diarios, semanales o únicos y revisa tu constancia en el tiempo.",
    accent: "orange",
  },
  {
    id: "nutrition",
    tab: "nutrition",
    targetId: "tour-nutrition",
    title: "Nutrición",
    description: "Registra comidas, calorías y macros para alinear tu alimentación con tu objetivo físico.",
    accent: "orange",
  },
  {
    id: "gym",
    tab: "gym",
    targetId: "tour-gym",
    title: "Gym",
    description: "Crea rutinas, inicia sesiones y sigue tu progreso de entrenamiento y volumen.",
    accent: "green",
  },
  {
    id: "finance",
    tab: "finance",
    targetId: "tour-finance",
    title: "Finanzas",
    description: "Controla ingresos, gastos, balance y fondo de emergencia desde un solo lugar.",
    accent: "orange",
  },
  {
    id: "routine",
    tab: "routine",
    targetId: "tour-routine",
    title: "Rutina",
    description: "Organiza tu semana con actividades fijas y revisa rápidamente qué toca hoy.",
    accent: "orange",
  },
  {
    id: "goals",
    tab: "goals",
    targetId: "tour-goals",
    title: "Metas",
    description: "Define objetivos a 90 días, 6 meses o 2 años y haz seguimiento de su avance.",
    accent: "purple",
  },
  {
    id: "mindset",
    tab: "mindset",
    targetId: "tour-mindset",
    title: "Mindset",
    description: "Refuerza tu enfoque diario con afirmaciones, gratitud, journaling y Brian Tracy.",
    accent: "orange",
  },
];

export const getGuidedTourCompletedKey = (userId: string) => `lifeos-guided-tour-completed:${userId}`;
export const getGuidedTourProgressKey = (userId: string) => `lifeos-guided-tour-progress:${userId}`;
