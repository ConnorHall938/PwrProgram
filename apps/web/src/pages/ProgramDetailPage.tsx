import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button, Card, CardContent, CardHeader } from '@/components/ui';
import type { Program, ApiError } from '@/types';
import styles from './ProgramDetailPage.module.css';

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProgram(id);
    }
  }, [id]);

  const loadProgram = async (programId: string) => {
    try {
      setIsLoading(true);
      const data = await api.getProgram(programId);
      setProgram(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load program');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!program || !window.confirm('Are you sure you want to delete this program?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.deleteProgram(program.id);
      navigate('/programs');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete program');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading program...</div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Program not found'}</div>
        <Link to="/programs">
          <Button variant="secondary">← Back to Programs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/programs" className={styles.backLink}>
          ← Back to Programs
        </Link>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>{program.name}</h1>
            {program.description && (
              <p className={styles.description}>{program.description}</p>
            )}
          </div>
          <div className={styles.actions}>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </header>

      <Card className={styles.infoCard}>
        <CardHeader>
          <h2 className={styles.sectionTitle}>Program Structure</h2>
        </CardHeader>
        <CardContent>
          <p className={styles.infoText}>
            This is where you can view and manage cycles, blocks, sessions, and exercises.
            The full program structure management UI will be implemented as the application grows.
          </p>
          <div className={styles.structure}>
            <div className={styles.structureItem}>
              <span className={styles.structureIcon}>🔄</span>
              <div>
                <h4>Cycles</h4>
                <p>Major training phases</p>
              </div>
            </div>
            <div className={styles.structureItem}>
              <span className={styles.structureIcon}>📦</span>
              <div>
                <h4>Blocks</h4>
                <p>Weekly training blocks</p>
              </div>
            </div>
            <div className={styles.structureItem}>
              <span className={styles.structureIcon}>📅</span>
              <div>
                <h4>Sessions</h4>
                <p>Individual workouts</p>
              </div>
            </div>
            <div className={styles.structureItem}>
              <span className={styles.structureIcon}>💪</span>
              <div>
                <h4>Exercises</h4>
                <p>Movements and sets</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
