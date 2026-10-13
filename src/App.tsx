import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router'
import { appConfig, isBackendConfigured, missingConfig } from './config'
import { AppLayout } from './components/layout/AppLayout'
import { RequireHost } from './components/layout/RequireHost'
import { ToastProvider } from './components/ui/Toast'
import { HomePage } from './pages/HomePage'
import { JoinPage } from './pages/JoinPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { LivePage } from './pages/LivePage'
import { SessionsPage } from './pages/SessionsPage'
import { HostDashboardPage } from './pages/host/HostDashboardPage'
import { HostSessionPage } from './pages/host/HostSessionPage'
import { HostSignInPage } from './pages/host/HostSignInPage'

function Root() {
  return (
    <ToastProvider>
      <ScrollRestoration />
      <Outlet />
    </ToastProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      // The prayer room is full-screen and has no site chrome.
      {
        path: '/s/:sessionId/room',
        lazy: () => import('./pages/RoomPage').then((m) => ({ Component: m.RoomPage })),
      },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'live', element: <LivePage /> },
          { path: 'sessions', element: <SessionsPage /> },
          { path: 's/:sessionId', element: <JoinPage /> },
          { path: 'host/sign-in', element: <HostSignInPage /> },
          {
            path: 'host',
            element: <RequireHost />,
            children: [
              { index: true, element: <HostDashboardPage /> },
              { path: 'sessions/:sessionId', element: <HostSessionPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

export function App() {
  if (!isBackendConfigured) return <SetupRequired />
  return <RouterProvider router={router} />
}

function SetupRequired() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream-50 px-6 py-16">
      <div className="max-w-lg rounded-[2rem] bg-white p-8 shadow-soft ring-1 ring-cream-200">
        <img src={appConfig.logoSrc} alt="" className="size-12" />
        <h1 className="mt-5 text-3xl font-medium text-ink-900">{appConfig.churchName} prayer rooms need setting up</h1>
        <p className="mt-3 text-ink-700">
          The app is not connected to its backend yet. Add these values to a <code>.env.local</code> file in the project
          folder, then restart the dev server:
        </p>
        <ul className="mt-4 flex flex-col gap-1.5">
          {missingConfig.map((key) => (
            <li key={key}>
              <code className="rounded-lg bg-cream-100 px-2 py-1 text-sm text-plum-800">{key}</code>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-ink-500">See the README for the full Supabase and LiveKit Cloud setup.</p>
      </div>
    </main>
  )
}
