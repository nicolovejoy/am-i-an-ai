import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { colors, retro80sIcons, componentStyles, shadows } from '../designSystem';
import AppIcon from '../assets/AppIcon';

interface SidebarProps {
  isLoggedIn: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isLoggedIn }) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Navigation items with Atari-themed icons
  const navItems = [
    { path: '/', label: 'Home', icon: retro80sIcons.homeIcon, requiresAuth: false },
    { path: '/about', label: 'About', icon: retro80sIcons.aboutIcon, requiresAuth: false },
    { path: '/donate', label: 'Donate', icon: retro80sIcons.donateIcon, requiresAuth: false },
    { path: '/account', label: 'Terminal', icon: retro80sIcons.accountIcon, requiresAuth: true },
  ];

  // Additional 80s themed icons for decoration
  const decorativeIcons = [
    { icon: retro80sIcons.pacManIcon, color: colors.neonBlue },
    { icon: retro80sIcons.spaceInvadersIcon, color: colors.neonPink },
    { icon: retro80sIcons.tetrisIcon, color: colors.neonPurple },
    { icon: retro80sIcons.rubiksCubeIcon, color: colors.neonBlue },
    { icon: retro80sIcons.walkmanIcon, color: colors.neonPink },
    { icon: retro80sIcons.ghettoblasterIcon, color: colors.neonPurple },
  ];

  return (
    <div
      className="sidebar h-screen fixed left-0 top-0 bg-medium-blue border-r border-neon-blue overflow-y-auto"
      style={{
        width: componentStyles.sidebar.width,
        background: componentStyles.sidebar.background,
        borderRight: componentStyles.sidebar.borderRight,
      }}
    >
      {/* App Logo & Title */}
      <div className="p-4 flex flex-col items-center border-b border-neon-blue">
        <div className="relative w-24 h-24 mb-2">
          <AppIcon width={96} height={96} glowColor="var(--neon-blue)" />
        </div>
        <h1 className="text-2xl font-bold neon-text text-center">Am I an AI?</h1>
      </div>

      {/* Navigation Links */}
      <nav className="py-4">
        <ul className="space-y-2">
          {navItems
            .filter((item) => !item.requiresAuth || (item.requiresAuth && isLoggedIn))
            .map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    sidebar-link flex items-center px-4 py-2 transition-all duration-300
                    ${
                      isActive(item.path)
                        ? 'bg-opacity-30 bg-blue-900 border-l-4 border-neon-blue pl-2'
                        : 'border-l-4 border-transparent hover:border-l-4 hover:border-neon-blue hover:bg-opacity-10 hover:bg-blue-900 hover:pl-2'
                    }
                  `}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span
                    className="text-2xl mr-3"
                    style={{
                      textShadow:
                        hoveredItem === item.path || isActive(item.path)
                          ? shadows.glow(colors.neonBlue)
                          : 'none',
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className={`${isActive(item.path) ? 'neon-text' : 'text-white'}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>

      {/* Decorative section with retro icons */}
      <div className="mt-8 px-4 py-4 border-t border-neon-blue">
        <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-3 text-center">
          Retro References
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          {decorativeIcons.map((icon, index) => (
            <div
              key={index}
              className="p-2 rounded hover:bg-blue-900 hover:bg-opacity-30 transition-all duration-300"
              style={{ cursor: 'pointer' }}
            >
              <span
                className="text-2xl block"
                style={{
                  color: icon.color,
                  textShadow: `0 0 5px ${icon.color}`,
                }}
              >
                {icon.icon}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Retro scanlines effect overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(0deg, rgba(255, 255, 255, 0.1) 50%, transparent 50%)',
          backgroundSize: '100% 4px',
        }}
      ></div>
    </div>
  );
};

export default Sidebar;
