import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale, ThemeMode } from '@/types'

interface UiState {
  theme: ThemeMode
  locale: Locale
  sidebarOpen: boolean
  searchOpen: boolean
  setTheme: (theme: ThemeMode) => void
  setLocale: (locale: Locale) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSearchOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'es',
      sidebarOpen: false,
      searchOpen: false,
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
    }),
    { name: 'casa-ui', partialize: (s) => ({ theme: s.theme, locale: s.locale }) },
  ),
)
