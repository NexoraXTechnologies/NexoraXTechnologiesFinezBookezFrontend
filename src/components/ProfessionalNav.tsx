import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, Bell, X, Trash2, Menu } from "lucide-react";
// import * as OneSignal from "react-onesignal";
import { useSelector } from "react-redux";
import { LogoutModal } from "./modal";
import ThemeToggle from "./themeToggle";

const ProfessionalNav = ({ menuItems = [], onMobileMenuToggle }: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);

  const [confirm, setConfirm]: any = useState({ show: false, x: null, y: null });
  const { profile } = useSelector(
    (state: any) => state.professionalProfile
  );

  const openConfirm = () => setConfirm({ show: true });

  // @ts-ignore
  const storedUser = JSON.parse(localStorage.getItem("professionalUser")) || {};
  const user = {
    name: storedUser.name || "Professional User",
    type: storedUser.type || "Tax Expert",
    profilePic: storedUser.profilePic || "",
  };

  const rawPic = profile?.profilePic || user?.profilePic || "";

  const isDefaultProfilePic =
    rawPic.includes("cdn-icons-png.flaticon.com") ||
    rawPic.includes("149071.png");

  const pic = rawPic && !isDefaultProfilePic ? rawPic : "";

  useEffect(() => {
    setImageError(false);
  }, [pic]);

  const flattenMenu = (items: any = []) => {
    return items.flatMap((item: any) => [
      item,
      ...(item.children ? flattenMenu(item.children) : []),
    ]);
  };

  const allMenuItems = flattenMenu(menuItems);

  const activeMenu = allMenuItems.filter((item: any) => {
        if (!item.path && !item.matchPaths) return false;

        if (item.matchPaths?.length) {
          return item.matchPaths.some((p: any) =>
            location.pathname.startsWith(p)
          );
        }

        return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
      })
      .sort((a: any, b: any) => {
        const aPath = a.matchPaths?.[0] || a.path || "";
        const bPath = b.matchPaths?.[0] || b.path || "";
        return bPath.length - aPath.length;
      })[0];

  const currentTitle = activeMenu ? activeMenu.name : "Professional Dashboard";

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    localStorage.removeItem("professionalHeaders");
    localStorage.removeItem("professionalUser");
    navigate("/login");
  };

  /* ------------------------- 🔔 NOTIFICATIONS -------------------------- */
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef: any = useRef(null);

  useEffect(() => {
    // const handler = (e) => {
    //   const notification = e.detail;
    //   setNotifications((prev) => [
    //     {
    //       id: Date.now(),
    //       title: notification.title,
    //       text: notification.body,
    //       time: new Date().toLocaleTimeString([], {
    //         hour: "2-digit",
    //         minute: "2-digit",
    //       }),
    //       read: false,
    //     },
    //     ...prev,
    //   ]);
    // };

    // window.addEventListener("onesignal-notification", handler);
    // return () => window.removeEventListener("onesignal-notification", handler);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
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

  useEffect(() => {
    if (showNotifications) {
      setNotifications((prev: any) => prev.map((n: any) => ({ ...n, read: true })));
    }
  }, [showNotifications]);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  /* ------------------------------------------------------------------ */

  return (
    <nav
      id="professional-nav"
      className="
        w-full h-16 bg-card text-card-foreground shadow-sm border-b border-border
        flex items-center justify-between px-4 sm:px-6 relative z-50
      "
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden text-muted-foreground hover:text-primary p-1 rounded"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        <h2 className="text-base sm:text-lg font-semibold text-card-foreground truncate max-w-[160px] sm:max-w-xs md:max-w-sm">
          {currentTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <ThemeToggle />

        {/* 🔔 Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications((p) => !p)}
            className="relative text-muted-foreground hover:text-primary"
          >
            <Bell size={22} />

            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-danger text-danger-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
              <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-muted">
                <h3 className="text-sm font-semibold text-card-foreground">
                  Notifications
                </h3>

                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className="text-xs text-muted-foreground hover:text-danger flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Clear
                    </button>
                  )}

                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto custom-scroll">
                {notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 border-b border-border hover:bg-muted"
                    >
                      <p className="font-medium text-card-foreground text-sm">
                        {n.title}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {n.text}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {n.time}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-muted-foreground text-sm">
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
            className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-lg"
          >
            {pic && !imageError ? (
              <img
                src={pic}
                alt="Profile"
                onError={() => setImageError(true)}
                className="w-9 h-9 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border border-border bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}

            <div className="hidden sm:block text-left cursor-pointer">
              <p className="text-sm font-medium text-card-foreground">
                {user.name}
              </p>

              <p className="text-xs text-muted-foreground">
                {user.type}
              </p>
            </div>

            <ChevronDown
              size={18}
              className={`text-muted-foreground transition-transform ${showProfileMenu ? "rotate-180" : ""
                }`}
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-lg shadow-lg">
              <div className="py-2">
                <button
                  onClick={openConfirm}
                  className="w-full flex items-center gap-2 px-4 py-2 text-muted-foreground hover:bg-danger/10 hover:text-danger text-sm font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}

          <LogoutModal
            {...{
              show: confirm?.show,
              setShow: () =>
                setConfirm((pre: any) => ({ ...pre, show: !confirm?.show })),
              handleSubmit: handleLogout,
            }}
          />
        </div>
      </div>
    </nav>
  );
};

export default ProfessionalNav;