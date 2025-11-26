import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { Card, CardHeader, CardContent, Button } from '@/components/ui';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome back, {user?.firstName}!</h1>
        <p className={styles.subtitle}>
          Here's an overview of your fitness journey
        </p>
      </header>

      <div className={styles.grid}>
        <Card className={styles.card}>
          <CardHeader>
            <h2 className={styles.cardTitle}>📋 Programs</h2>
          </CardHeader>
          <CardContent>
            <p className={styles.cardText}>
              View and manage your workout programs
            </p>
            <Link to="/programs">
              <Button variant="secondary" size="sm">
                View Programs
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className={styles.card}>
          <CardHeader>
            <h2 className={styles.cardTitle}>🎯 Quick Stats</h2>
          </CardHeader>
          <CardContent>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>-</span>
                <span className={styles.statLabel}>Active Programs</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>-</span>
                <span className={styles.statLabel}>Total Sessions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.card}>
          <CardHeader>
            <h2 className={styles.cardTitle}>💡 Getting Started</h2>
          </CardHeader>
          <CardContent>
            <ul className={styles.list}>
              <li>Create your first program</li>
              <li>Add cycles to structure your training</li>
              <li>Design sessions with exercises</li>
              <li>Track your sets and progress</li>
            </ul>
          </CardContent>
        </Card>

        <Card className={styles.card}>
          <CardHeader>
            <h2 className={styles.cardTitle}>👤 Profile</h2>
          </CardHeader>
          <CardContent>
            <div className={styles.profileInfo}>
              <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
              <p><strong>Email:</strong> {user?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
