// ============================================================================
// FRONTBLOK-CRUD - UNIVERSAL REACT HOOKS
// ============================================================================
// React hooks for data fetching that work with any entity type.
// Works dynamically with entities registered at runtime.
//
// USAGE:
// ```typescript
// import { useEntityList, useEntity, useMutation } from '@rationalbloks/frontblok-crud';
// import type { Task } from './entities';
// 
// function TaskList() {
//   const { items, loading, error, refetch } = useEntityList<Task>('tasks');
//   const { mutate, loading: saving } = useMutation<Task>('tasks');
//   
//   const handleCreate = async () => {
//     await mutate.create({ title: 'New Task' });
//     refetch();
//   };
// }
// ```
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { getApi } from './api.js';
import type { BaseEntity, ListState, EntityState, MutationState } from './types.js';

// ============================================================================
// useEntityList - LIST HOOK
// ============================================================================
// Fetches all entities of a type.

/**
 * Hook for fetching a list of entities.
 * 
 * @param entityName - The entity/table name (e.g., 'tasks', 'projects')
 * @param options - Optional query parameters (skip, limit, filters)
 * @returns List state with items, loading, error, and refetch
 * 
 * @example
 * function TaskList() {
 *   const { items, loading, error, refetch } = useEntityList<Task>('tasks');
 *   
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return (
 *     <ul>
 *       {items.map(task => <li key={task.id}>{task.title}</li>)}
 *     </ul>
 *   );
 * }
 */
export function useEntityList<T extends BaseEntity>(
  entityName: string,
  options?: { skip?: number; limit?: number; [key: string]: unknown }
): ListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getApi().getAll<T>(entityName, options);
      if (isMounted.current) {
        setItems(data);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [entityName, JSON.stringify(options)]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  return {
    items,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useEntity - SINGLE ENTITY HOOK
// ============================================================================
// Fetches a single entity by ID.

/**
 * Hook for fetching a single entity by ID.
 * 
 * @param entityName - The entity/table name
 * @param id - Entity UUID (can be undefined for create mode)
 * @returns Entity state with item, loading, error, and refetch
 * 
 * @example
 * function TaskDetail({ id }: { id: string }) {
 *   const { item, loading, error } = useEntity<Task>('tasks', id);
 *   
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *   if (!item) return <NotFound />;
 *   
 *   return <h1>{item.title}</h1>;
 * }
 */
export function useEntity<T extends BaseEntity>(
  entityName: string,
  id?: string
): EntityState<T> {
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<Error | null>(null);

  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getApi().getOne<T>(entityName, id);
      if (isMounted.current) {
        setItem(data);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setItem(null);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [entityName, id]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  return {
    item,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useMutation - CREATE/UPDATE/DELETE HOOK
// ============================================================================
// Provides methods for mutating entities.

/**
 * Mutation functions returned by useMutation.
 */
export interface MutationFunctions<T extends BaseEntity> {
  /** Create a new entity */
  create: (data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>) => Promise<T>;
  /** Update an existing entity */
  update: (id: string, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>) => Promise<T>;
  /** Delete an entity */
  remove: (id: string) => Promise<void>;
}

/**
 * Return type for useMutation hook.
 */
export interface UseMutationResult<T extends BaseEntity> extends MutationState<T> {
  mutate: MutationFunctions<T>;
}

/**
 * Hook for mutating entities (create, update, delete).
 * 
 * @param entityName - The entity/table name
 * @returns Mutation state and functions
 * 
 * @example
 * function TaskForm() {
 *   const { mutate, loading, error, reset } = useMutation<Task>('tasks');
 *   
 *   const handleSubmit = async (data: CreateTaskInput) => {
 *     try {
 *       await mutate.create(data);
 *       navigate('/tasks');
 *     } catch (err) {
 *       // Error is also available in the error state
 *     }
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <Alert severity="error">{error.message}</Alert>}
 *       <Button loading={loading}>Save</Button>
 *     </form>
 *   );
 * }
 */
export function useMutation<T extends BaseEntity>(
  entityName: string
): UseMutationResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const create = useCallback(
    async (input: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const result = await getApi().create<T>(entityName, input);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [entityName]
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
    ): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const result = await getApi().update<T>(entityName, id, input);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [entityName]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await getApi().remove(entityName, id);
        setData(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [entityName]
  );

  return {
    data,
    loading,
    error,
    reset,
    mutate: { create, update, remove },
  };
}

// ============================================================================
// useEntityForm - FORM STATE HOOK
// ============================================================================
// Combines useEntity and useMutation for form handling.
// Perfect for create/edit forms.

/**
 * Return type for useEntityForm hook.
 */
export interface UseEntityFormResult<T extends BaseEntity> {
  /** Current form data (null for create, entity for edit) */
  item: T | null;
  /** True while loading existing entity or saving */
  loading: boolean;
  /** True only while loading existing entity */
  loadingEntity: boolean;
  /** True only while saving (create/update) */
  saving: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** True if this is an edit (id provided) */
  isEdit: boolean;
  /** Save the form data (creates or updates based on isEdit) */
  save: (data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>) => Promise<T>;
  /** Delete the entity (only valid in edit mode) */
  remove: () => Promise<void>;
}

/**
 * Hook for handling entity forms (create and edit).
 * 
 * @param entityName - The entity/table name
 * @param id - Entity UUID (undefined for create mode)
 * @returns Form state and actions
 * 
 * @example
 * function TaskForm({ id }: { id?: string }) {
 *   const { item, loading, saving, error, isEdit, save } = useEntityForm<Task>('tasks', id);
 *   const [formData, setFormData] = useState({ title: '', status: 'pending' });
 *   
 *   // Populate form when editing
 *   useEffect(() => {
 *     if (item) {
 *       setFormData({ title: item.title, status: item.status });
 *     }
 *   }, [item]);
 *   
 *   const handleSubmit = async (e: FormEvent) => {
 *     e.preventDefault();
 *     await save(formData);
 *     navigate('/tasks');
 *   };
 *   
 *   if (loading) return <Loading />;
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input value={formData.title} onChange={...} />
 *       <button disabled={saving}>{isEdit ? 'Update' : 'Create'}</button>
 *     </form>
 *   );
 * }
 */
export function useEntityForm<T extends BaseEntity>(
  entityName: string,
  id?: string
): UseEntityFormResult<T> {
  const { item, loading: loadingEntity, error: loadError } = useEntity<T>(entityName, id);
  const { mutate, loading: saving, error: mutationError } = useMutation<T>(entityName);

  const isEdit = Boolean(id);
  const loading = loadingEntity || saving;
  const error = loadError || mutationError;

  const save = useCallback(
    async (data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<T> => {
      if (isEdit && id) {
        return mutate.update(id, data);
      }
      return mutate.create(data);
    },
    [isEdit, id, mutate]
  );

  const remove = useCallback(async (): Promise<void> => {
    if (!isEdit || !id) {
      throw new Error('Cannot delete: no entity ID provided');
    }
    return mutate.remove(id);
  }, [isEdit, id, mutate]);

  return {
    item,
    loading,
    loadingEntity,
    saving,
    error,
    isEdit,
    save,
    remove,
  };
}
