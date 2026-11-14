import { createBrowserRouter, RouterProvider, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import PostView from './pages/PostView'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

/** Remounts the editor when switching between posts or from edit → new, resetting its state. */
function EditorRoute() {
  const { id } = useParams()
  return (
    <ProtectedRoute>
      <Editor key={id ?? 'new'} />
    </ProtectedRoute>
  )
}

// A data router is required for useBlocker (Editor's unsaved-changes guard).
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/posts/:id', element: <PostView /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: '/editor', element: <EditorRoute /> },
      { path: '/editor/:id', element: <EditorRoute /> },
      { path: '/users/:id', element: <Profile /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  )
}
