import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppBoot } from "./app-boot";
import { AppShell } from "./components/layout/app-shell";
import { UpdatePrompt } from "./components/layout/update-prompt";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { DashboardPage } from "./features/dashboard/dashboard-page";
import { GroceryPage } from "./features/grocery/grocery-page";
import { MealPlannerPage } from "./features/nutrition/meal-planner-page";
import { RecipeDetailPage } from "./features/nutrition/recipe-detail-page";
import { RecipeFormPage } from "./features/nutrition/recipe-form-page";
import { RecipesPage } from "./features/nutrition/recipes-page";
import { TemplatesPage } from "./features/nutrition/templates-page";
import { MeasurementsPage } from "./features/progress/measurements-page";
import { PhotosPage } from "./features/progress/photos-page";
import { ProgressPage } from "./features/progress/progress-page";
import { WeightPage } from "./features/progress/weight-page";
import { SettingsPage } from "./features/settings/settings-page";
import { ExerciseDetailPage } from "./features/workouts/exercise-detail-page";
import { ExerciseLibraryPage } from "./features/workouts/exercise-library-page";
import { HistoryPage } from "./features/workouts/history-page";
import { ProgramEditorPage } from "./features/workouts/program-editor-page";
import { SessionPage } from "./features/workouts/session-page";
import { TrainingPage } from "./features/workouts/training-page";

/**
 * Hash-routering: zo werkt de app op elke statische host (ook in een submap van
 * GitHub Pages) en blijft diep linken werken zonder server die URL's omschrijft.
 */
export function App() {
  return (
    <ThemeProvider>
      <AppBoot>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />

              <Route path="/training" element={<TrainingPage />} />
              <Route path="/training/schema" element={<ProgramEditorPage />} />
              <Route
                path="/training/oefeningen"
                element={<ExerciseLibraryPage />}
              />
              <Route
                path="/training/oefeningen/:exerciseId"
                element={<ExerciseDetailPage />}
              />
              <Route path="/training/historie" element={<HistoryPage />} />
              <Route
                path="/training/sessie/:sessionId"
                element={<SessionPage />}
              />

              <Route path="/voeding" element={<RecipesPage />} />
              <Route
                path="/voeding/recept/nieuw"
                element={<RecipeFormPage />}
              />
              <Route
                path="/voeding/recept/:recipeId"
                element={<RecipeDetailPage />}
              />
              <Route
                path="/voeding/recept/:recipeId/bewerken"
                element={<RecipeFormPage />}
              />
              <Route path="/voeding/planner" element={<MealPlannerPage />} />
              <Route path="/voeding/sjablonen" element={<TemplatesPage />} />

              <Route path="/boodschappen" element={<GroceryPage />} />

              <Route path="/voortgang" element={<ProgressPage />} />
              <Route path="/voortgang/gewicht" element={<WeightPage />} />
              <Route
                path="/voortgang/metingen"
                element={<MeasurementsPage />}
              />
              <Route path="/voortgang/fotos" element={<PhotosPage />} />

              <Route path="/instellingen" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <UpdatePrompt />
          <Toaster position="top-center" />
        </HashRouter>
      </AppBoot>
    </ThemeProvider>
  );
}
