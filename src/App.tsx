import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthListener, useAuth } from '@/hooks/useAuth'
import { AuthGate, PublicOnly } from '@/contexts/AuthGate'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { AppShell } from '@/layouts/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ShoppingPage } from '@/pages/ShoppingPage'
import { TasksPage } from '@/pages/TasksPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { RemindersPage } from '@/pages/RemindersPage'
import { NotesPage } from '@/pages/NotesPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { StatsPage } from '@/pages/StatsPage'
import { ActivityPage } from '@/pages/ActivityPage'
import { SettingsPage } from '@/pages/SettingsPage'

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  useAuthListener()
  return <>{children}</>
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/inicio" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route element={<PublicOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route element={<AuthGate />}>
            <Route element={<AppShell />}>
              <Route path="inicio" element={<DashboardPage />} />
              <Route path="compras" element={<ShoppingPage />} />
              <Route path="tareas" element={<TasksPage />} />
              <Route path="calendario" element={<CalendarPage />} />
              <Route path="recordatorios" element={<RemindersPage />} />
              <Route path="notas" element={<NotesPage />} />
              <Route path="inventario" element={<InventoryPage />} />
              <Route path="gastos" element={<ExpensesPage />} />
              <Route path="estadisticas" element={<StatsPage />} />
              <Route path="actividad" element={<ActivityPage />} />
              <Route path="configuracion" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  )
}
