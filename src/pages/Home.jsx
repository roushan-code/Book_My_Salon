import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import HairCut from '../assets/haircut.jpg'
import HairColor from '../assets/haircolor.webp'
import Shaving from '../assets/shaving.jpg'
import FacialMassage from '../assets/massage.jpg'
import SpotlightCard from '../components/SpotlightCard';
import Carousel from '../components/Carousel';
import CustomerReviews from '../components/CustomerReviews';
import { FaFacebook } from "react-icons/fa";
import { AiFillInstagram } from "react-icons/ai";
import { useSelector } from 'react-redux'
import {
  BookingSkeleton,
  TeamSkeleton,
} from '../components/Skeleton'
import toast from 'react-hot-toast'
import BarberBookingsPage from './BarberBookingsPage'
import BookYourSlot from '../components/BookYourSlot'
import { CiMenuKebab } from 'react-icons/ci'
import { useLocation } from 'react-router-dom'
import {
  useGetCustomerBookingsQuery,
  useGetBookedSlotsQuery,
  useGetAdminInfoQuery,
  useCancelBookingMutation,
  useGetOurTeamQuery
} from '../redux/api/api'

const Home = () => {
  // Sample dynamic data - in real app this would come from API/state management
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Redux API hooks
  const {
    data: customerBookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings
  } = useGetCustomerBookingsQuery(undefined, {
    skip: !user || user.role !== 'customer'
  });

  const {
    data: bookedSlotsData,
    isLoading: slotsLoading,
    refetch: refetchSlots
  } = useGetBookedSlotsQuery();

  const {
    data: adminInfo,
    isLoading: adminInfoLoading
  } = useGetAdminInfoQuery();

  const {
    data: ourTeamData,
    isLoading: ourTeamLoading,
  } = useGetOurTeamQuery();


  const [cancelBooking] = useCancelBookingMutation();

  // Extract data from Redux responses
  const bookings = customerBookings?.data || [];
  const BookedSlots = bookedSlotsData?.data || [];
  const shopDetails = bookedSlotsData?.shopDetails || [];
  const shopInfo = adminInfo?.data || null;
  

  // Add CSS animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 26 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: 'easeOut' }
    }
  }

  const stagger = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2 }
    }
  }

  const headingAnimation = {
    hidden: { opacity: 0, y: 36, scale: 0.96, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.95, ease: [0.33, 1, 0.46, 1] }
    }
  }

  const paragraphAnimation = {
    hidden: { opacity: 0, y: 24, x: 16 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.9, delay: 0.2, ease: 'easeOut' }
    }
  }

  // Handle loading state
  useEffect(() => {
    if (!slotsLoading) {
      setLoading(false);
    }
  }, [slotsLoading]);

  // Refresh data function for BookYourSlot component
  const fetchBookings = () => {
    // Only refetch customer bookings if user is a customer
    if (user && user.role === 'customer') {
      refetchBookings();
    }
    refetchSlots();
  };  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const getDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  const [services] = useState([
    {
      id: 1,
      name: "Men's Haircut",
      img: HairCut,
      icon: "Cut",
      description: "Get your hair cut based on your face shape, professionally styled."
    },
    {
      id: 2,
      name: "Beard Trim",
      img: Shaving,
      icon: "",
      description: "Keep your beard looking fresh with a lot of extra attention with clippers."
    },
    {
      id: 3,
      name: "Treatment",
      img: FacialMassage,
      icon: "",
      description: "Leave it to us and our professional stylist to keep your hair healthy."
    },
    {
      id: 4,
      name: "Wash",
      img: HairColor,
      icon: "",
      description: "Nourish your hair and scalp with a full wash using our exclusive products."
    }
  ])

  const highlights = [
    { id: 1, title: 'Expert Stylists', desc: 'Experienced barbers and beauticians for every style.' },
    { id: 2, title: 'Hygiene First', desc: 'Clean tools, sanitized stations, and safe grooming.' },
    { id: 3, title: 'Easy Booking', desc: 'Fast slot booking with transparent service timings.' }
  ];

  const quickSteps = [
    { id: 1, step: 'Choose Barber', detail: 'Pick your preferred professional from our team.' },
    { id: 2, step: 'Select Services', detail: 'Combine haircut, beard trim, wash, and more.' },
    { id: 3, step: 'Book Slot', detail: 'Reserve your convenient time in seconds.' }
  ];

  const featuredShowcase = [
    { id: 1, title: 'Cut Studio', note: 'Precision Scissor Work', img: HairCut },
    { id: 2, title: 'Beard Lounge', note: 'Classic Razor Finish', img: Shaving },
    { id: 3, title: 'Treatment Bay', note: 'Relax And Restore', img: FacialMassage }
  ];

  // Generate time slots (10:00 to 21:00 with 15 min intervals)

  // Handle cancel booking
  const handleCancelBooking = async (bookingId, payment_status) => {
    try {
      setCancelling(true);
      const response = await cancelBooking({
        bookingId,
        payment_status
      }).unwrap();

      toast.success(response.message);

      // Refresh bookings and slots after successful cancellation
      refetchBookings();
      refetchSlots();

      setOpenDropdownId(null); // Close dropdown
    } catch (error) {
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  // Toggle dropdown menu
  const toggleDropdown = (bookingId) => {
    setOpenDropdownId(openDropdownId === bookingId ? null : bookingId);
  };


  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="home-reveal-section relative overflow-hidden rounded-[28px] border border-[#dccfbe] bg-[linear-gradient(140deg,#efe5da_0%,#f7f1ea_48%,#efe8de_100%)] p-4 sm:p-7 brand-shadow"
        >
          <div className="absolute -top-16 -right-10 h-44 w-44 rounded-full border border-[#d8c9b8]/60" />
          <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full border border-[#d8c9b8]/50" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-[#5a4a3b] text-sm font-semibold tracking-[0.16em] uppercase">Elite Barber House</p>
              <div className="flex gap-2">
                <span className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#e8dbcd] text-[#43362a] border border-[#d6c6b6]">Spaces</span>
                <span className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#e8dbcd] text-[#43362a] border border-[#d6c6b6]">Services</span>
              </div>
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end"
            >
              <div className="lg:col-span-7">
                <motion.h1
                  variants={headingAnimation}
                  initial="hidden"
                  animate="visible"
                  className="home-hero-heading font-['Georgia','Times_New_Roman',serif] text-[#2f261e] text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight"
                >
                  Clean Cuts
                  <br />
                  Quiet Luxury
                  <br />
                  Sharp Detail
                </motion.h1>
              </div>
              <div className="lg:col-span-5">
                <motion.p
                  variants={paragraphAnimation}
                  initial="hidden"
                  animate="visible"
                  className="home-hero-paragraph text-[#4d4034] text-sm sm:text-base leading-relaxed max-w-md lg:ml-auto"
                >
                  A simple, modern booking experience for premium grooming.
                  Choose your barber, reserve your slot, and walk in with confidence.
                </motion.p>
                <motion.div variants={stagger} className="mt-4 flex flex-wrap gap-2 lg:justify-end">
                  <motion.span variants={fadeUp} className="home-hero-box px-3 py-1 rounded-full text-xs bg-[#f8f3ec] border border-[#dbc9b7] text-[#4a3b2d]">Open 7 Days</motion.span>
                  <motion.span variants={fadeUp} className="home-hero-box px-3 py-1 rounded-full text-xs bg-[#f8f3ec] border border-[#dbc9b7] text-[#4a3b2d]">4.8 Rating</motion.span>
                  <motion.span variants={fadeUp} className="home-hero-box px-3 py-1 rounded-full text-xs bg-[#f8f3ec] border border-[#dbc9b7] text-[#4a3b2d]">Quick Slots</motion.span>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="home-reveal-grid grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {featuredShowcase.map((item) => (
                <motion.article variants={fadeUp} key={item.id} className="home-reveal-card overflow-hidden rounded-2xl bg-[#f6eee5] border border-[#dccab9]">
                  <img
                    src={item.img}
                    alt={item.title}
                    loading="lazy"
                    className="h-40 sm:h-48 w-full object-cover"
                  />
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#655446]">{item.note}</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#2f261e]">{item.title}</h3>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="home-reveal-section home-reveal-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {highlights.map((item) => (
            <motion.article variants={fadeUp} key={item.id} className="home-reveal-card rounded-2xl bg-[#f7f1e8] border border-[#b49777] p-5 brand-shadow">
              <p className="text-[11px] tracking-[0.14em] uppercase text-[#4b6387]">Feature</p>
              <h3 className="mt-2 text-xl font-semibold text-[#2f261e]">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </motion.article>
          ))}
        </motion.section>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="home-reveal-section brand-surface rounded-2xl p-4 sm:p-5 md:p-6 space-y-6 brand-shadow"
        >
        {/* Your Bookings Section */}
        <div>
          <h2 className="text-xl font-semibold brand-title mb-4 text-center">
            {user && user.role === 'customer' ? "Your Bookings" : "Customer Bookings"}
          </h2>
          <div>
            {user && user.role === 'barber' ? (
              // Show barber booking management component
              <BarberBookingsPage />
            ) : (
              // Show customer bookings
              <>
                {bookingsLoading ? (
                  // Show skeleton loading for bookings
                  <>
                    <BookingSkeleton />
                    <BookingSkeleton />
                    <BookingSkeleton />
                  </>
                ) : (
                  bookings.length === 0 ? (
                    <div key={1} className="flex gap-4 bg-[#f7f1e8] border-[#9a6c4b] rounded-lg p-4 brand-shadow mb-4 justify-center">
                      <div className="text-center text-gray-600">No bookings found.</div>
                    </div>
                  ) : (
                    user && user.role === 'customer' && bookings.map((booking) => (
                      <div key={booking._id} className="bg-[#9a6c4b] rounded-lg p-4 brand-shadow mb-4">
                        <div className="flex gap-4">
                          {/* Customer Profile */}
                          <div className="shrink-0">
                            <div className="w-12 h-12 rounded-full border-2 border-[#6f4e37] bg-[#6f4e37] flex items-center justify-center text-white font-semibold">
                              {booking.customerdetails?.customer_name ? booking.customerdetails?.customer_name.charAt(0).toUpperCase() : 'C'}
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex w-full sm:items-center items-start justify-between mb-2">
                              <div className='w-fit'>
                                <h3 className="font-semibold text-gray-800">
                                  {booking.customerdetails?.customer_name || 'Unknown Customer'}
                                </h3>
                                <p className="text-sm text-gray-600">{booking.customerdetails?.customer_phone || 'No phone'}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-sm bg-[#9a6c4b] text-white px-2 py-1 rounded-full">
                                    {getDate(booking.date)}
                                  </span>
                                </div>
                              </div>
                              <div className='w-fit relative dropdown-container'>
                                <button
                                  className='cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors'
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleDropdown(booking._id)
                                  }}
                                >
                                  <CiMenuKebab />
                                </button>

                                {/* Dropdown Menu */}
                                {openDropdownId === booking._id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg brand-shadow z-10">
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          handleCancelBooking(booking._id, booking.payment)
                                        }}
                                        disabled={cancelling}
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                      >
                                        {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Service Providers */}
                            {booking.serviceProviders && booking.serviceProviders.length > 0 ? (
                              <div className="space-y-3 mb-3">
                                {booking.serviceProviders.map((provider, index) => (
                                  <div key={provider._id || index} className="bg-[#f3f4f6] rounded-lg p-3">
                                    <div className="flex items-center gap-3 mb-2">
                                      <img
                                        src={provider.barber_id?.profileUrl || '/default-avatar.png'}
                                        alt={provider.barber_id?.name}
                                        className="w-10 h-10 rounded-full border-2 border-[#cfae90] object-cover"
                                        onError={(e) => { e.target.src = '/default-avatar.png' }}
                                      />
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800 text-sm">
                                          {provider.barber_id?.name || 'Unknown Barber'}
                                        </h4>
                                        {provider.start_time && provider.end_time && (
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            <span className="text-xs bg-[#9a6c4b] text-white px-2 py-1 rounded-full">
                                              {provider.start_time} - {provider.end_time}
                                            </span>
                                            <span className="text-xs bg-[#6f4e37] text-white px-2 py-1 rounded-full">
                                              {provider.service_time} min
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {provider.services && provider.services.map((service, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs bg-[#efe5d8] text-[#2f261e] px-2 py-1 rounded"
                                        >
                                          {service}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              // Fallback for old structure
                              booking.services && (
                                <div className="mb-3">
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {booking.services.map((service, index) => (
                                      <span key={index} className="text-xs bg-[#efe5d8] text-[#2f261e] px-2 py-1 rounded">
                                        {service}
                                      </span>
                                    ))}
                                  </div>
                                  {booking.start_time && (
                                    <span className="text-sm text-[#2f261e] bg-[#efe5d8] rounded-full w-fit px-2.5">
                                      {booking.start_time}
                                    </span>
                                  )}
                                </div>
                              )
                            )}

                            {/* Status */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className={`text-sm font-medium px-2 py-1 rounded-full w-fit ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'completed' ? 'bg-[#efe2d3] text-[#5b4635]' :
                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                              {booking.payment && (
                                <span className={`text-sm font-medium px-2 py-1 rounded-full w-fit ${booking.payment === 'pending' ? 'bg-gray-100 text-red-800' :
                                  'bg-[#efe2d3] text-[#5b4635]'
                                  }`}>
                                  {booking.payment.charAt(0).toUpperCase() + booking.payment.slice(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Notice Board Set By Admin */}
        {shopInfo && shopInfo.notice !== "" && (
          <div className="bg-red-100 p-4 rounded-lg shadow">
            <h2 className="text-lg text-center font-semibold brand-title mb-2">Notice Board</h2>
            <p className="text-gray-600 text-sm">* {shopInfo.notice}</p>
          </div>
        )}

        {/* Carousel Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="home-reveal-section"
        >
          <h2 className="text-xl font-semibold brand-title mb-4 text-center">Menu</h2>
          <Carousel />
        </motion.div>

        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="home-reveal-section home-reveal-grid"
        >
          <h2 className="text-xl font-semibold brand-title mb-4 text-center">How Booking Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickSteps.map((item) => (
              <motion.div variants={fadeUp} key={item.id} className="home-reveal-card bg-white rounded-xl p-4 brand-shadow border border-[#dbcab8]">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#6f4e37] text-white text-sm font-bold">{item.id}</span>
                <h3 className="mt-3 font-semibold text-[#2f261e]">{item.step}</h3>
                <p className="text-sm text-slate-600 mt-1">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Book Your Slot Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="home-reveal-section"
        >
          <BookYourSlot path={location.pathname} shopInfo={shopInfo} userRole={user && user.role} refechBooking={fetchBookings} />
        </motion.div>

        {/* Services Section */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="home-reveal-section home-reveal-grid"
        >
          <h2 className="text-2xl font-bold brand-title mb-6 text-center">Our Barber <span className="text-slate-600">Services</span></h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {services.map((service) => (
              <motion.div variants={fadeUp} key={service.id} className="home-reveal-card relative bg-[#efe5d8] rounded-xl brand-shadow hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] min-w-45">
                {/* Service Image Background */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    loading="lazy"
                    src={service.img}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0  bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300"></div>


                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-[#2f261e] mb-2 text-center text-sm">{service.name}</h3>
                  <p className="text-xs text-slate-600 text-center leading-relaxed">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Customer Reviews */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="home-reveal-section"
        >
          <CustomerReviews availableBarbers={BookedSlots || []} user={user} />
        </motion.div>

        {/* Team Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="home-reveal-section"
        >
          <h2 className="text-xl font-semibold brand-title mb-4 text-center">Our Team</h2>
          <div className='flex flex-col justify-center md:flex-row md:flex-wrap gap-4'>
            {loading ? (
              // Show skeleton loading for team
              <>
                <TeamSkeleton />
                <TeamSkeleton />
              </>
            ) : (
              ourTeamData && ourTeamData.data.map((barber) => (
                <SpotlightCard
                  key={barber.barberId} className="custom-spotlight-card" spotlightColor="rgba(0, 229, 255, 0.2)">
                  <div className="flex flex-col items-center min-w-30">
                    <img src={barber?.profileUrl} alt={barber.barberName} loading="lazy" className="w-20 h-20 object-cover rounded-full mb-2" />
                    <div className="text-md font-medium text-[#2f261e]">{barber?.barberName}</div>
                    <div className="text-sm text-gray-600">{barber?.rating > 0 ? `Rating: ${barber?.rating}` : ""}</div>
                  </div>
                </SpotlightCard>
              ))
            )}
          </div>
        </motion.div>


        {/* Contact Card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="home-reveal-section"
        >
          <ContactCard shopInfo={shopInfo} shop_address={shopDetails && shopDetails[0]?.shop_address} number={shopDetails && shopDetails[0]?.phone} />
        </motion.div>
      </motion.div>
      </div>
    </div>
  )
}



// ContactCard Component
const ContactCard = ({ shopInfo, shop_address, number }) => {
  return (
    <div className="brand-gradient rounded-lg p-6 brand-shadow text-white">
      <h2 className="text-2xl font-bold mb-2">Barber Shop</h2>
      <p className="text-[#efe0cf] mb-4 text-sm">
        Experience The Best New Hairstyles in Our Hair Salon. Just
        Book Your Desire Day from Now on and Easily Style Your Hair
      </p>

      {/* Social Icons */}
      <div className="flex space-x-3 mb-4">
        <div className="w-8 h-8 text-[#2f261e] bg-white rounded flex items-center justify-center"><FaFacebook /></div>
        <div className="w-8 h-8 text-[#2f261e] bg-white rounded flex items-center justify-center"><AiFillInstagram /></div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Contact Info</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span>Email:</span>
            <span>{shopInfo && shopInfo.shop_email || 'support@barber.com'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Phone:</span>
            <span>+91 {shopInfo && shopInfo.shop_phone || number} </span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Address:</span>
            <div>
              <span>{shopInfo && shopInfo.shop_address || shop_address}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-[#efe0cf]">
        Copyright 2025 barber shop. All rights reserved.
      </div>
    </div>
  )
}

export default Home


