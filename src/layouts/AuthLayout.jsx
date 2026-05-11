import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-950">
      <Outlet />
    </main>
  );
}
