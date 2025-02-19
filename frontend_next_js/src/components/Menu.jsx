'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineReload } from "react-icons/ai";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { menuGroups } from '@/apirequests/sidebaritems';
import { useGlobalState } from '@/js/globaluser';

const DocumentComponent = ({ children }) => {
  const { user } = useGlobalState();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [subMenuVisible, setSubMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [subMenuPosition, setSubMenuPosition] = useState({ x: 0, y: 0 });
  const [subMenuItems, setSubMenuItems] = useState([]);

  const handleRightClick = (event) => {
    event.preventDefault();
    const scrollY = window.scrollY;
    setMenuPosition({ x: event.clientX, y: event.clientY + scrollY });
    setMenuVisible(true);
    setSubMenuVisible(false);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSubMenuVisible(false);
  };

  const openSubMenu = (event, children) => {
    const scrollY = window.scrollY;
    setSubMenuPosition({ x: event.clientX + 150, y: event.clientY + scrollY });
    setSubMenuItems(children);
    setSubMenuVisible(true);
  };

  const navigateTo = (link) => {
    router.push(link);
    closeMenu();
  };

  return (
    <div onContextMenu={handleRightClick} className='relative h-full w-full m-0'>
      {children}

      {menuVisible && (
        <div
          style={{
            position: 'absolute',
            top: menuPosition.y,
            left: menuPosition.x,
            background: 'white',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
            zIndex: 9999999,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: menuVisible ? 1 : 0,
            transform: menuVisible ? 'translateY(0)' : 'translateY(-10px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '10px 0',
              background: '#f0f0f0',
              borderBottom: '1px solid #ddd',
            }}
          >
            <FaArrowLeft
              style={{ color: 'black', fontSize: '1.5rem', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); router.back(); }}
            />
            <AiOutlineReload
              style={{ color: 'black', fontSize: '1.5rem', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); window.location.reload(); }}
            />
            <FaArrowRight
              style={{ color: 'black', fontSize: '1.5rem', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); router.forward(); }}
            />
          </div>

          {menuGroups[0].menuItems.map((item, index) => {
            return (
              user.permissions.includes(item.permission) &&
              <div
                key={index}
                onClick={(e) => {
                  if (!item.children) {
                    e.stopPropagation();
                    navigateTo(item.route);
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f9f9f9';
                  if (item.children) {
                    openSubMenu(e, item.children);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 75px 10px 20px',
                  cursor: 'pointer',
                  borderBottom: index < menuGroups[0].menuItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                  color: 'black',
                  backgroundColor: 'white',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
              >
                {item.icon}
                <span style={{ fontSize: '16px' }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {subMenuVisible && (
        <div
          style={{
            position: 'absolute',
            top: subMenuPosition.y,
            left: subMenuPosition.x,
            background: 'white',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
            zIndex: 9999999,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: subMenuVisible ? 1 : 0,
            transform: subMenuVisible ? 'translateY(0)' : 'translateY(-10px)',
          }}
        >
          {subMenuItems.map((item, index) => {
            return (
              user.permissions.includes(item.permission) &&
              <div
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(item.route);
                }}
                style={{
                  padding: '10px 75px 10px 20px',
                  cursor: 'pointer',
                  borderBottom: index < subMenuItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                  color: 'black',
                  backgroundColor: 'white',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#f9f9f9')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'white')}
              >
                <span style={{ fontSize: '16px' }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {menuVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 999,
          }}
          onClick={closeMenu}
        />
      )}
    </div>
  );
};

export default DocumentComponent;
