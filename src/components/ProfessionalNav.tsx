import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, Bell, X, Trash2, Menu } from "lucide-react";
import ConfirmTooltip from "./common/ConfirmTooltip";
// import * as OneSignal from "react-onesignal";
import { useDispatch, useSelector } from 'react-redux';


const ProfessionalNav = ({ menuItems = [], onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatchP = useDispatch();
  const [imageError, setImageError] = useState(false);

  const [confirm, setConfirm] = useState({ show: false, x: null, y: null });
  const { profile } = useSelector(
    (state) => state.professionalProfile
  );

  const openConfirm = (e) => {
    const btn = e.currentTarget.getBoundingClientRect();
    const gap = 4;
    const tipW = 176;
    const tipH = 64;

    let left = btn.left - tipW - gap;
    let top = btn.bottom + gap;

    const pad = 4;
    left = Math.max(pad, Math.min(left, window.innerWidth - tipW - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - tipH - pad));

    setConfirm({ show: true, x: left, y: top });
  };

  const storedUser = JSON.parse(localStorage.getItem("professionalUser")) || {};
  const user = {
    name: storedUser.name || "Professional User",
    type: storedUser.type || "Tax Expert",
    profilePic:
      storedUser.profilePic || "",
  };
  // const pic = profile?.profilePic || user?.profilePic ||"";

  const rawPic = profile?.profilePic || user?.profilePic || "";

  const isDefaultProfilePic =
    rawPic.includes("cdn-icons-png.flaticon.com") ||
    rawPic.includes("149071.png");

  const pic = rawPic && !isDefaultProfilePic ? rawPic : "";

  useEffect(() => {
    setImageError(false);
  }, [pic]);

  const flattenMenu = (items = []) => {
    return items.flatMap((item) => [
      item,
      ...(item.children ? flattenMenu(item.children) : []),
    ]);
  };

  const allMenuItems = flattenMenu(menuItems);

  const activeMenu =
    allMenuItems
      .filter((item) => {
        if (!item.path && !item.matchPaths) return false;

        if (item.matchPaths?.length) {
          return item.matchPaths.some((p) =>
            location.pathname.startsWith(p)
          );
        }

        return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
      })
      .sort((a, b) => {
        const aPath = a.matchPaths?.[0] || a.path || "";
        const bPath = b.matchPaths?.[0] || b.path || "";
        return bPath.length - aPath.length;
      })[0];

  const currentTitle = activeMenu ? activeMenu.name : "Professional Dashboard";

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    try {
      // 1) read headers (who is logged in)
      const headers = JSON.parse(localStorage.getItem('professionalHeaders') || '{}');

      const loginuser = headers?.loginuser; // userMobileNumberHash
      const dbName = headers?.['x-db-name'];
      const payload = {
        loginuser: String(loginuser),
        'x-db-name': String(dbName),
        isLogin: false,
      };
      // parentUserMobileNumber
    } catch (err) {
      // Don't block logout if API fails
      console.warn("Logout sync failed:", err?.message || err);
    } finally {
      // 3) clear local session always
      localStorage.removeItem('professionalHeaders');
      localStorage.removeItem('professionalUser');

      // 4) redirect
      navigate('/login');
    }
  };

  /* ------------------------- 🔔 NOTIFICATIONS -------------------------- */
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  // 🔥 Receive notifications from global OneSignal handler
  useEffect(() => {
    const handler = (e) => {
      const notification = e.detail;
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: notification.title,
          text: notification.body,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          read: false,
        },
        ...prev,
      ]);
    };

    // window.addEventListener("onesignal-notification", handler);
    // return () => window.removeEventListener("onesignal-notification", handler);
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Mark all as read when opened
  useEffect(() => {
    if (showNotifications) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ------------------------------------------------------------------ */

  return (
    <nav
      id="professional-nav"
      className="w-full h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 relative z-50"
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden text-gray-600 hover:text-blue-600 p-1 rounded"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate max-w-[160px] sm:max-w-xs md:max-w-sm">{currentTitle}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* 🔔 Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications((p) => !p)}
            className="relative text-gray-600 hover:text-blue-600"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">
                  Notifications
                </h3>

                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 border-b hover:bg-gray-50"
                    >
                      <p className="font-medium text-gray-800 text-sm">
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-700">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
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
            onClick={() => setShowProfileMenu((p) => !p)}
            className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded-lg"
          >
            {/* <img
              src={pic}
              alt="Profile"
              className="w-9 h-9 rounded-full border"
            /> */}

            {pic && !imageError ? (
              <img
                src={pic}
                alt="Profile"
                onError={() => setImageError(true)}
                className="w-9 h-9 rounded-full border object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div className="hidden sm:block text-left cursor-pointer">
              <p className="text-sm font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">{user.type}</p>
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform ${showProfileMenu ? "rotate-180" : ""
                }`}
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="py-2">
                <button
                  onClick={openConfirm}
                  className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 text-sm font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}

          <ConfirmTooltip
            x={confirm.x}
            y={confirm.y}
            message="Are you sure you want to logout?"
            confirmText="Yes"
            cancelText="No"
            onConfirm={() => {
              handleLogout();
              setConfirm({ show: false, x: null, y: null });
            }}
            onCancel={() => setConfirm({ show: false, x: null, y: null })}
          />
        </div>
      </div>
    </nav>
  );
};

export default ProfessionalNav;