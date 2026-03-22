import './App.css'
import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './pages/Header'
// Lazy load the page components
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
import { Toaster } from 'react-hot-toast'
import { useSelector } from 'react-redux'
import Loader from './pages/Loader';
import HairStyleAI from './pages/HairStyleAI';
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const BarberDashboard = lazy(() => import('./pages/BarberDashboard'));
const BarberBookingsPage = lazy(() => import('./pages/BarberBookingsPage'));


function App() {
  const { user } = useSelector((state) => state.auth);
  return  (
    <>
      <Router>
        <Header/>
        <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/HairStyleAI" element={<HairStyleAI/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/barber/dashboard" element={user && user.role === 'barber' ? <BarberDashboard/> : <Login/>} />
          <Route path="/barber/bookings" element={user && user.role === 'barber' ? <BarberBookingsPage/> : <Login/>} />
          <Route path="/admin/dashboard" element={user && user.role === 'admin' ? <AdminDashboard/> : <Login/>} />
        </Routes>
        </Suspense>
        <Toaster position='bottom-center'/>
      </Router>
      
    </>
  )
}

export default App