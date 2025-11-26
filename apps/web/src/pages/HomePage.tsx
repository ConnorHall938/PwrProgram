import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { Button } from '@/components/ui';
import styles from './HomePage.module.css';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Build Better Programs.
          <br />
          <span className={styles.highlight}>Achieve Better Results.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          PwrProgram helps you design, manage, and track comprehensive workout
          programs with a hierarchical structure for coaches and athletes.
        </p>
        <div className={styles.heroCta}>
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Everything You Need</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📊</span>
            <h3>Program Hierarchy</h3>
            <p>
              Structure your training with Programs → Cycles → Blocks →
              Sessions → Exercises → Sets
            </p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🔒</span>
            <h3>Secure & Private</h3>
            <p>
              Your data is protected with industry-standard security and
              encryption
            </p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📱</span>
            <h3>Easy to Use</h3>
            <p>
              Intuitive interface designed for quick program creation and
              management
            </p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🤝</span>
            <h3>Coach Integration</h3>
            <p>
              Built-in support for coach-athlete relationships and program
              sharing
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
