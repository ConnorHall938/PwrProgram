import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardContent, CardFooter } from '@/components/ui';
import type { Program, ApiError } from '@/types';
import styles from './ProgramsPage.module.css';

export function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPrograms();
      setPrograms(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load programs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgramClick = (programId: string) => {
    navigate(`/programs/${programId}`);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Programs</h1>
          <p className={styles.subtitle}>Manage your workout programs</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          + New Program
        </Button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {showCreateForm && (
        <CreateProgramForm
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false);
            loadPrograms();
          }}
        />
      )}

      {isLoading ? (
        <div className={styles.loading}>Loading programs...</div>
      ) : programs.length === 0 ? (
        <Card className={styles.emptyState}>
          <CardContent>
            <div className={styles.emptyContent}>
              <span className={styles.emptyIcon}>📋</span>
              <h3>No programs yet</h3>
              <p>Create your first program to get started!</p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Program
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.grid}>
          {programs.map((program) => (
            <Card
              key={program.id}
              className={styles.programCard}
              onClick={() => handleProgramClick(program.id)}
            >
              <CardContent>
                <h3 className={styles.programName}>{program.name}</h3>
                {program.description && (
                  <p className={styles.programDesc}>{program.description}</p>
                )}
              </CardContent>
              <CardFooter>
                <span className={styles.viewLink}>View Details →</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface CreateProgramFormProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateProgramForm({ onClose, onCreated }: CreateProgramFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.createProgram({
        name,
        description: description || undefined,
      });
      onCreated();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create program');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <Card className={styles.modal}>
        <CardHeader>
          <h2 className={styles.modalTitle}>Create New Program</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.formError}>{error}</div>}
            
            <Input
              label="Program Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Strength Building Phase 1"
              required
            />
            
            <Input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your program..."
            />
            
            <div className={styles.formActions}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Create Program
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
