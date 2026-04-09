import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBell, FaMoon, FaSun, FaBars } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext.jsx';
import API from '../utils/api';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await API.get('/api/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    await API.put(`/api/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await API.put('/api/notifications/read-all');
    fetchNotifications();
  };

  const handleNotificationClick = (n) => {
    markAsRead(n._id);
    setShowNotifications(false);
    navigate(`/interview/${n.interviewId}`);
  };

  const desktopLinkClass = ({ isActive }) =>
    `px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
      isActive
        ? "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
            InterviewHub
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={desktopLinkClass}>Home</NavLink>

            {user && (
              <>
                <NavLink to="/dashboard" className={desktopLinkClass}>
                  Dashboard
                </NavLink>
              </>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <FaBell />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden">
                      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                        <span className="font-semibold text-gray-900 dark:text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length ? (
                          notifications.map(n => (
                            <div
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0 transition"
                            >
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">{n.actorName}</span> commented on your post
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                            No notifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="focus:outline-none"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 rounded-full border border-gray-300 dark:border-gray-700 object-cover"
                    />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="font-semibold text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-transform hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <FaBars size={20} />
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-gray-200 dark:border-gray-800">
            <NavLink to="/" className={mobileLinkClass} onClick={() => setIsOpen(false)}>Home</NavLink>

            {user && (
              <>
                <NavLink to="/dashboard" className={mobileLinkClass} onClick={() => setIsOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/create-interview" className={mobileLinkClass} onClick={() => setIsOpen(false)}>
                  Share Experience
                </NavLink>
              </>
            )}

            <button
              onClick={() => {
                setDarkMode(!darkMode);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>

            {!user && (
              <Link
                to="/login"
                className="block w-full text-center px-4 py-3 mt-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;