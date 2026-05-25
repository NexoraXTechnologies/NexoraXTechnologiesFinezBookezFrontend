import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, LogOut, IdCard, Users, FileCheck, ListTodo, Settings, ChevronDown, ChevronRight, Key, Building2, Wallet, PackageSearch, ReceiptIndianRupee, BookCheck, Contact, BookUser, UserPlus, FileArchive, CloudUpload, Sliders, CloudCog, Scale, BanknoteArrowDown, Download, ListRestart, IndianRupee, BookText, LayoutDashboard } from 'lucide-react';
import ConfirmTooltip from './common/ConfirmTooltip';
// import { useDispatch } from "react-redux";
import EZLogo from '../assets/Logo.EZ.png'
import FinEzLogo from '../assets/FinEZ.png';

const ProfessionalSidebar = ({ onMenuItemsChange }: any) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [openMenus, setOpenMenus] = useState({});
  const navigate = useNavigate();
  // const dispatchP = useDispatch();
  const [confirm, setConfirm] = useState<{ show: boolean, x: number | null, y: number | null }>({ show: false, x: null, y: null });
  /* open tooltip at click position */
  const openConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget.getBoundingClientRect();
    const gap = 8; // vertical gap
    const tooltipW = 176; // w-44
    const tooltipH = 64; // measured or estimated

    let top = btn.top - gap - tooltipH; // 8 px above button
    let left = btn.right - tooltipW; // right edges aligned

    /* keep inside viewport */
    const pad = 4;
    top = Math.max(pad, Math.min(top, window.innerHeight - tooltipH - pad));
    left = Math.max(pad, Math.min(left, window.innerWidth - tooltipW - pad));

    setConfirm({ show: true, x: left, y: top });
  };

  const professionalHeaders = JSON.parse(localStorage.getItem('professionalHeaders'));
  const canShowUsers = professionalHeaders?.['x-db-name'] == professionalHeaders?.loginuser;

  const menuItems = [
    { name: 'Dashboard', path: '/professional', icon: <LayoutDashboard size={20} /> },
    {
      name: 'Company Master',
      path: '/professional/master/company',
      icon: <Building2 size={20} />,
    },
    {
      name: 'BookEZ',
      icon: <BookText size={20} />,
      children: [
        // {
        //   name: 'Company Master',
        //   path: '/professional/master/company',
        //   icon: <Building2 size={14} />,
        // },
        {
          name: 'Account Master',
          path: '/professional/master/account',
          icon: <Wallet size={14} />,
        },
        {
          name: 'Product Master',
          path: '/professional/master/product',
          icon: <PackageSearch size={14} />,
        },
      ],
    },
    {
      name: 'TaxEZ',

      icon: <IndianRupee size={20} />,
      children: [
        // {
        //   name: 'Company Master',
        //   path: '/professional/master/company',
        //   icon: <Building2 size={14} />,
        // },
        {
          name: 'Document Management',
          path: '/professional/documentmngt',
          icon: <FileCheck size={20} />,
        },
        {
          name: 'Task Management',
          path: '/professional/taskmngt',
          icon: <ListTodo size={20} />,
        },
        {
          name: 'Income Tax Law',
          path: '/professional/incometx',
          icon: <Scale size={20} />,
        },
        {
          name: 'Income Tax',
          path: '/professional/incometax',
          icon: <ReceiptIndianRupee size={20} />,
          children: [
            {
              name: 'Add Tax Payer',
              path: '/professional/incometax/addtaxpayer',
              icon: <UserPlus size={14} />,
            },
            {
              name: 'File ITR',
              path: '/professional/incometax/fileitrlist',
              // IMPORTANT
              matchPaths: ['/professional/incometax/fileitr', '/professional/incometax/fileitrlist'],
              icon: <FileArchive size={14} />,
            },

            {
              name: 'Form 26AS',
              path: '/professional/incometax/form26as',
              icon: <BookCheck size={14} />,
            },
            {
              name: 'Annual Information Statement', // FULL TITLE
              label: 'AIS', // SIDEBAR TEXT
              path: '/professional/incometax/ais',
              icon: <Contact size={14} />,
            },
            {
              name: 'Taxpayer Information Summary',
              label: 'TIS',
              path: '/professional/incometax/tis',
              icon: <BookUser size={14} />,
            },

            {
              name: 'Check Your Refund Status',
              label: 'Refund Status',
              path: '/professional/incometax/refund',
              icon: <BanknoteArrowDown size={14} />,
            },
            {
              name: 'Reset Your IncomeTax Password',
              label: 'Reset Password',
              path: '/professional/incometax/resetitrpassword',
              icon: <ListRestart size={14} />,
            },
            {
              name: 'Upload Form 16',
              path: '/professional/incometax/uploadform16',
              icon: <CloudUpload size={14} />,
            },
            {
              name: 'Download ITRs',
              path: '/professional/incometax/downloaditr',
              icon: <Download size={14} />,
            },
          ],
        },
      ],
    },
    {
      name: 'Settings',
      icon: <Settings size={20} />,
      children: [
        ...(canShowUsers
          ? [
            {
              name: 'Add Team/Employee',
              path: '/professional/users',
              icon: <Users size={14} />,
            },
          ]
          : []),
        {
          name: 'Profile',
          path: '/professional/profile',
          icon: <IdCard size={14} />,
        },
        ...(canShowUsers
          ? [
            {
              name: 'Configuration',
              icon: <Sliders size={14} />,
              path: '/professional/configuration',
            },
          ]
          : []),
        ...(canShowUsers
          ? [
            {
              name: 'Automation',
              icon: <CloudCog size={14} />,
              path: '/professional/automation',
            },
          ]
          : []),
      ],
    },
  ];

  // Logout (Professional)
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
      localStorage.removeItem("professionalHeaders");
      localStorage.removeItem('professionalUser');

      // 4) redirect
      navigate("/login");
    }
  };

  const SidebarItem = ({ item, level = 0, isExpanded, openMenus, setOpenMenus, }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const hasChildren = item.children?.length > 0;

    // ACTIVE CHECK
    const isActive = location.pathname === item.path || item.matchPaths?.includes(location.pathname);

    // PARENT ACTIVE CHECK
    const isParentActive = item.children?.some((child) => location.pathname.startsWith(child.path || '') || child.matchPaths?.includes(location.pathname));
    const isOpen = openMenus[item.name] || false;

    // TOGGLE MENU
    const handleClick = () => {
      if (hasChildren) {
        setOpenMenus((prev) => ({
          ...prev,
          [item.name]: !prev[item.name],
        }));
      } else if (item.path) {
        navigate(item.path);
      }
    };

    return (
      <div>
        {/* MENU ITEM */}
        <div
          onClick={handleClick}
          style={{ paddingLeft: `${20 + level * 14}px` }}
          className={` flex items-center cursor-pointer py-3 px-2 mx-2 mb-1 rounded transition-all duration-200 select-none group ${isActive || isParentActive
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-[#F5F5F5] hover:bg-indigo-100 hover:text-indigo-700'
            }
        `}
        >
          {/* ICON */}
          <div className="flex items-center justify-center w-5 h-5 shrink-0">{item.icon}</div>
          {/* LABEL */}
          {isExpanded && (
            <span className="ml-3 text-sm truncate">
              {item.label || item.name}
            </span>
          )}

          {/* CHEVRON */}
          {hasChildren && isExpanded && (
            <div className="ml-auto">
              {isOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </div>
          )}
        </div>

        {/* CHILDREN */}
        {hasChildren && isOpen && isExpanded && (
          <div className="space-y-1">
            {item.children.map((child) => (
              <SidebarItem
                key={child.name}
                item={child}
                level={level + 1}
                isExpanded={isExpanded}
                openMenus={openMenus}
                setOpenMenus={setOpenMenus}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Notify parent
  useEffect(() => {
    if (onMenuItemsChange) onMenuItemsChange(menuItems);
  }, []);

  return (
    <div
      id="professional-sidebar" className={`h-screen border-r bg-[#2D1B69] border-slate-200 shadow-lg border-r border-gray-200 transition-all duration-300 flex flex-col ${isExpanded ? 'w-64' : 'w-20'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}>
      {/* Logo */}
      <div className="flex items-center justify-center h-16">
        <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{isExpanded ? <img src={FinEzLogo} alt="FinEZ Logo" className="w-30 h-10" /> : <img src={EZLogo} alt="EZ Logo" className="w-8 h-8" />}</h1>
      </div>

      {/* Menu */}
      <div className="flex-1 mt-4 overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.name}
            item={item}
            isExpanded={isExpanded}
            openMenus={openMenus}
            setOpenMenus={setOpenMenus}
          />
        ))}
      </div>

      <div className="border-t border-gray-800 py-4 px-4">
        <div onClick={openConfirm} className="flex items-center gap-3 text-gray-700 cursor-pointer hover:bg-red-50 px-2 py-2 rounded-lg transition-all">
          <LogOut size={20} className="text-red-500" />
          {isExpanded && <span className="text-sm font-medium text-red-500">Logout</span>}
        </div>
      </div>

      {/* ---- reusable tooltip ---- */}
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
  );
};

export default ProfessionalSidebar;


