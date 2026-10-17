import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AOS from 'aos';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { FloatingButtons } from './FloatingButtons';

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 650,
      once: true,
      easing: 'ease-out-cubic',
      offset: 60,
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    AOS.refresh();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#172B4D] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <FloatingButtons />
    </div>
  );
};
