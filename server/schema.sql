CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  gym_target_kcal INTEGER DEFAULT 1950,
  rest_target_kcal INTEGER DEFAULT 1700,
  protein_target INTEGER DEFAULT 126,
  savings_goal INTEGER DEFAULT 25,
  emergency_fund_goal BIGINT DEFAULT 5000000,
  main_goal TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) DEFAULT 'circle',
  color VARCHAR(50) DEFAULT 'orange',
  target_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  UNIQUE(habit_id, date)
);

CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  calories INTEGER DEFAULT 0,
  protein NUMERIC(8,2) DEFAULT 0,
  carbs NUMERIC(8,2) DEFAULT 0,
  fat NUMERIC(8,2) DEFAULT 0,
  meal_type VARCHAR(50) DEFAULT 'snack',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_routines (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) DEFAULT 'strength',
  exercises JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  routine_id INTEGER REFERENCES workout_routines(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  type VARCHAR(255) DEFAULT '',
  notes TEXT DEFAULT '',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_volume NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_exercises (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  target_sets INTEGER DEFAULT 4,
  target_reps INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  completed_sets JSONB DEFAULT '[]',
  is_completed BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS exercise_baselines (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  current_weight NUMERIC(8,2) DEFAULT 0,
  last_updated DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, exercise_name)
);

CREATE TABLE IF NOT EXISTS gym_streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  total_workouts INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  deadline DATE,
  progress INTEGER DEFAULT 0,
  level VARCHAR(10) NOT NULL CHECK (level IN ('90d', '6m', '2y')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  affirmation TEXT DEFAULT '',
  journal_text TEXT DEFAULT '',
  gratitude TEXT[] DEFAULT '{}',
  reflection TEXT DEFAULT '',
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS brian_tracy_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  goal TEXT DEFAULT '',
  completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS schedule_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'clase',
  color VARCHAR(100) DEFAULT 'blue',
  is_fixed BOOLEAN DEFAULT true
);
