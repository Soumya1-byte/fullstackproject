import { useEffect, useState } from 'react';
import { BarChart3, ClipboardCheck, FileText, GraduationCap, LayoutDashboard, LineChart, Sparkles, UserRound, BookOpenCheck, ShieldCheck } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import Breadcrumbs from '../components/layout/Breadcrumbs';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/courses', label: 'Courses', icon: BookOpenCheck },
  { to: '/admin/forms', label: 'Forms', icon: FileText },
  { to: '/admin/form-builder', label: 'Form Builder', icon: ClipboardCheck },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/export', label: 'Reports', icon: LineChart },
  { to: '/admin/myadmins', label: 'My Admins', icon: ShieldCheck },
  { to: '/profile', label: 'Profile', icon: UserRound }
];

const studentLinks = [
  { to: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/student/courses', label: 'Courses', icon: GraduationCap },
  { to: '/student/feedback', label: 'Submit Feedback', icon: ClipboardCheck },
  { to: '/student/insights', label: 'Insights', icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: UserRound }
];

export default function DashboardLayout() {
  const { role } = useAuth();
  const location = useLocation();
  const links = role === 'student' ? studentLinks : adminLinks;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isAdminRoute = role === 'admin' && location.pathname.startsWith('/admin');
  const searchPlaceholder = location.pathname.startsWith('/admin/myadmins')
    ? 'Search admin requests by student, email, status, or notes...'
    : 'Search courses, forms, students, and reports...';

  useEffect(() => {
    setSearchQuery('');
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[var(--surface-canvas)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(37,99,235,0.22),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(14,165,233,0.14),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.08),transparent_26%)]" />

      <Sidebar
        links={links}
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`relative mx-auto max-w-[1400px] space-y-5 px-4 py-4 lg:px-6 lg:py-6 ${collapsed ? 'lg:pl-[132px]' : 'lg:pl-[334px]'}`}>
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={isAdminRoute}
          searchPlaceholder={searchPlaceholder}
        />

        <nav className="glass flex gap-2 overflow-x-auto rounded-2xl border border-[var(--line-soft)] bg-[color-mix(in_oklab,var(--surface-card)_88%,transparent)] p-2 lg:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--brand-700)] to-[var(--accent-500)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Breadcrumbs />

        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="space-y-6">
          <Outlet context={{ dashboardSearchQuery: searchQuery }} />
        </motion.main>
      </div>
    </div>
  );
}
