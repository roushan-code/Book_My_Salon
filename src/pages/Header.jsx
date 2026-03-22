import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../assets/Logo.png'
import { useDispatch, useSelector } from 'react-redux'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { server } from '../constants/config'
import { expireLoginToken, getTokenFromStorage } from '../utils/features'
import { setUser } from '../redux/api/auth'
import axios from 'axios'


const Header = () => {
    const { user } = useSelector((state) => state.auth);

    const [open, setOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);
    const dispatch = useDispatch();

    const logoutHandler = async () => {
        try {
            await axios.get(`${server}/api/v1/user/logout`, {
                headers: {
                    "authorization": `Bearer ${getTokenFromStorage()}`,
                },
                withCredentials: true,
            });
            expireLoginToken();
            dispatch(setUser(null));
        } catch (error) {
            // console.error('Logout error:', error);
        }
    };

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        axios.get(`${server}/api/v1/user/me`, {
            headers: {
                "authorization": `Bearer ${getTokenFromStorage()}`,
            },
            withCredentials: true,
        })
            .then(({ data }) => {
                return dispatch(setUser(data?.data))
            })
            .catch((error) => {
                return dispatch(setUser(null));
            });

        return () => document.removeEventListener('mousedown', handleOutsideClick);

    }, [dispatch]);

    return (
        <nav className='sticky top-0 z-40 flex justify-between items-center gap-3 px-3 sm:px-5 py-3 border-b brand-shadow' style={{ backgroundColor: '#f7f1ea', borderColor: 'rgba(159,126,100,0.25)' }}>

            <div>
                <Link to="/">
                    <div className=' flex gap-2 items-center'>
                        <img src={Logo} alt="" loading="lazy" className='w-13 h-10  rounded-full' />
                        <div>
                            <h1 className='text-xl sm:text-2xl font-bold text-[#2f261e]'>ELITE </h1>
                            <p className='text-xs sm:text-sm -mt-1 text-[#334155]'>Barber Shop</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Hairstyle AI + Auth */}
            <div className="flex items-center gap-3">
                <Link
                    to="/HairStyleAI"
                    className="hidden sm:flex text-[#2f261e] font-semibold bg-white/80 border border-[#dbcab8] rounded-[10px] items-center gap-2 hover:bg-white cursor-pointer transition-colors px-4 py-2"
                >
                    Hairstyle AI
                </Link>

                {!user ? (
                    <Link
                        to="/login"
                        className="flex text-white font-bold bg-[#6f4e37] rounded-[10px] items-center gap-2 hover:bg-[#9a6c4b] cursor-pointer transition-colors px-4 py-2"
                    >
                        Login/SignUp
                    </Link>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setOpen((v) => !v)}
                                className="flex items-center gap-2 cursor-pointer bg-transparent border-0"
                                aria-haspopup="true"
                                aria-expanded={open}
                            >
                                {user ? (
                                    <img
                                        src={user.profileUrl}
                                        alt={user.name || 'User'}
                                        loading="lazy"
                                        width={32}
                                        height={32}
                                        className="rounded-full"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#9a6c4b] flex items-center justify-center text-white text-sm">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                                <span className="hidden md:inline text-sm font-medium">
                                    {user.name}
                                </span>
                                {open ? <ChevronDown className="w-4 h-4 transform rotate-180" /> : <ChevronDown className='w-4 h-4' />}
                            </button>

                        {/* Dropdown menu (click to toggle) */}
                        <div
                            className={`absolute right-0 mt-2 w-52 bg-white border border-[#dbcab8] rounded-md shadow-lg transition-all duration-200 z-50 ${open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="py-2">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                                {
                                    user && user.role === 'barber' ? (
                                        <>
                                        <Link
                                            to="/barber/dashboard"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f7efe6]"
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                    onClick={logoutHandler}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#f7efe6] flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                                </>
                                    ) : user.role === 'admin'? (
                                        <>
                                        <Link
                                            to="/admin/dashboard"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f7efe6]"
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                    onClick={logoutHandler}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#f7efe6] flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={logoutHandler}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#f7efe6] flex items-center gap-2"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    )
                                }
                            </div>
                        </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Header

