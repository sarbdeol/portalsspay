import { Menu, Bell, LogOut, Moon, Sun, UserRound, X } from 'lucide-react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { navigationByRole } from '../constants/navigation.js';
import { useAuthStore } from '../store/authStore.js';
import { useActivityLogs } from '../hooks/useCrm.js';
import { cn } from '../utils/cn.js';

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout, theme, toggleTheme } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = navigationByRole[user.role] || [];
  const crumbs = location.pathname.split('/').filter(Boolean);
  const { data: recentLogs = [] } = useActivityLogs();

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen text-slate-950 dark:text-white">
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-72 border-r border-white/50 bg-white/65 p-4 backdrop-blur-3xl transition lg:translate-x-0 dark:border-white/10 dark:bg-slate-950/70', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white dark:bg-white dark:text-slate-950">A</div>
            <div>
              <p className="text-base font-black">SSPay</p>
              <p className="text-xs font-semibold text-slate-500">Fintech CRM</p>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="rounded-xl p-2 lg:hidden"><X size={20} /></button>
        </div>
        <nav className="mt-8 space-y-2">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to.split('/').length <= 2} onClick={() => setOpen(false)} className={({ isActive }) => cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-white/80 dark:text-slate-300 dark:hover:bg-white/10', isActive && 'bg-slate-950 text-white shadow-ios dark:bg-white dark:text-slate-950')}>
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 rounded-3xl bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
          <p className="text-sm font-bold">{user.name}</p>
          <p className="mt-1 text-xs opacity-70">{user.role} workspace</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="surface mx-auto flex max-w-7xl items-center gap-3 rounded-3xl px-4 py-3 shadow-ios">
            <button onClick={() => setOpen(true)} className="rounded-2xl p-2 hover:bg-slate-900/5 lg:hidden dark:hover:bg-white/10"><Menu size={22} /></button>
            <div className="hidden text-sm font-semibold text-slate-500 sm:block">
              {crumbs.map((crumb, index) => <span key={crumb}>{index ? ' / ' : ''}{crumb}</span>)}
            </div>
            <button onClick={toggleTheme} className="ml-auto rounded-2xl p-2.5 hover:bg-slate-900/5 dark:hover:bg-white/10">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <HeadlessMenu as="div" className="relative">
              <HeadlessMenu.Button className="rounded-2xl p-2.5 hover:bg-slate-900/5 dark:hover:bg-white/10"><Bell size={20} /></HeadlessMenu.Button>
              <Transition as={Fragment} enter="transition ease-out duration-150" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <HeadlessMenu.Items className="glass absolute right-0 mt-3 w-80 rounded-3xl p-3">
                  {recentLogs.length === 0 ? (
                    <div className="rounded-2xl px-3 py-3 text-sm font-semibold text-slate-500">No recent activity</div>
                  ) : (
                    recentLogs.slice(0, 6).map((log) => (
                      <HeadlessMenu.Item key={log.id}>
                        <div className="rounded-2xl px-3 py-3 text-sm hover:bg-white/60 dark:hover:bg-white/10">
                          <p className="font-bold">{log.action}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{log.actor} • {log.target} • {log.time}</p>
                        </div>
                      </HeadlessMenu.Item>
                    ))
                  )}
                </HeadlessMenu.Items>
              </Transition>
            </HeadlessMenu>
            <HeadlessMenu as="div" className="relative">
              <HeadlessMenu.Button className="flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-2 text-white dark:bg-white dark:text-slate-950">
                <UserRound size={18} /><span className="hidden text-sm font-bold sm:inline">{user.name.split(' ')[0]}</span>
              </HeadlessMenu.Button>
              <Transition as={Fragment} enter="transition ease-out duration-150" enterFrom="opacity-0 translate-y-2" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <HeadlessMenu.Items className="glass absolute right-0 mt-3 w-56 rounded-3xl p-3">
                  <HeadlessMenu.Item><Link to="/profile" className="block rounded-2xl px-3 py-3 text-sm font-bold hover:bg-white/60 dark:hover:bg-white/10">Profile</Link></HeadlessMenu.Item>
                  <HeadlessMenu.Item><Link to="/change-password" className="block rounded-2xl px-3 py-3 text-sm font-bold hover:bg-white/60 dark:hover:bg-white/10">Change Password</Link></HeadlessMenu.Item>
                  <HeadlessMenu.Item><button onClick={doLogout} className="flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-sm font-bold text-rose-600 hover:bg-rose-500/10"><LogOut size={17} /> Logout</button></HeadlessMenu.Item>
                </HeadlessMenu.Items>
              </Transition>
            </HeadlessMenu>
          </div>
        </header>
        <motion.div className="mx-auto max-w-7xl px-4 pb-10 pt-3 sm:px-6">
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
