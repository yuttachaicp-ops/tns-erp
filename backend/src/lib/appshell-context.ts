import { createContext, useContext } from 'react'
interface AppShellCtx { isMobile: boolean; onMenuToggle: () => void }
export const AppShellContext = createContext<AppShellCtx>({ isMobile: false, onMenuToggle: () => {} })
export const useAppShell = () => useContext(AppShellContext)