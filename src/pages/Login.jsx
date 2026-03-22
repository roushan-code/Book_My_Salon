import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../utils/firebase'
import googleLogo from '../assets/google.png'
import { useDispatch } from 'react-redux'
import { setUser } from '../redux/api/auth'
import { setTokenToLocalstorage } from '../utils/features'
import toast from 'react-hot-toast'
import { useLoginMutation } from '../redux/api/api'

const Login = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  // RTK Query hook
  const [loginUser] = useLoginMutation()

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      provider.setCustomParameters({
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      try {
            const data = await loginUser({ email: user.email }).unwrap();
            // TODO: Implement user state management
            dispatch(setUser(data?.user))
            setTokenToLocalstorage(data?.token)
        } catch (error) {
            console.error('Login error:', error)
            toast.error(error.response?.data?.message || 'Login failed')
        } finally {
            // setIsLoading(false);
        }
      
      
      navigate('/')
      
    } catch (error) {
      console.error('Login error:', error)
      
      
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(155deg, #efe5da 0%, #f7f1ea 55%, #e5d8c8 100%)' }}>
      <div className="max-w-md w-full bg-white border border-[#dbcab8] rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src={googleLogo} alt="Google" loading="lazy" className="w-5 h-5" />
            {loading ? 'Signing in...' : 'SignIn with Google'}
          </button>

          {/* Divider */}
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div> */}

          {/* Email/Password Form (Placeholder for future) */}
          {/* <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#b48763] focus:border-transparent outline-none transition-all"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#b48763] focus:border-transparent outline-none transition-all"
                disabled
              />
            </div>
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 font-semibold py-3 px-4 rounded-xl cursor-not-allowed"
            >
              Sign In (Coming Soon)
            </button>
          </div>*/}

          {/* Forgot Password */}
          {/* <div className="text-center">
            <Link to="#" className="text-sm text-[#6f4e37] hover:text-[#9a6c4b] transition-colors">
              Forgot your password?
            </Link>
          </div>  */}

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600 mb-3">Don't have an account?</p>
            <Link
              to="/signup"
              className="inline-block bg-linear-to-r from-[#6f4e37] to-[#9a6c4b] text-white font-semibold py-3 px-8 rounded-xl hover:from-[#2f261e] hover:to-[#6f4e37] transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Create Account
            </Link>
          </div>

          {/* Back to Home */}
          <div className="text-center pt-4">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login


