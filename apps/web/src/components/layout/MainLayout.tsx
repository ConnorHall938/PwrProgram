import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import { Button } from '@/components/ui';
import styles from './MainLayout.module.css';

export function MainLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>💪</span>
            <span className={styles.logoText}>PwrProgram</span>
          </Link>
          
          <nav className={styles.nav}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className={styles.navLink}>
                  Dashboard
                </Link>
                <Link to="/programs" className={styles.navLink}>
                  Programs
                </Link>
              </>
            ) : null}
          </nav>

          <div className={styles.actions}>
            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <span className={styles.userName}>
                  {user?.firstName} {user?.lastName}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} PwrProgram. All rights reserved.</p>
      </footer>
    </div>
  );
}
