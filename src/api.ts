// ============================================================================
// FRONTBLOK-CRUD - UNIVERSAL CRUD API CLIENT
// ============================================================================
// Single class that handles all CRUD operations for any entity type.
// Uses frontblok-auth's BaseApi for HTTP requests.
//
// USAGE:
// ```typescript
// import { createAuthApi } from '@rationalbloks/frontblok-auth';
// import { initApi, getApi } from '@rationalbloks/frontblok-crud';
// 
// // Initialize once at app startup
// const authApi = createAuthApi(import.meta.env.VITE_DATABASE_API_URL);
// initApi(authApi);
// 
// // Use anywhere
// const tasks = await getApi().getAll<Task>('tasks');
// const task = await getApi().create<Task>('tasks', { title: 'New Task' });
// ```
// ============================================================================

import type { BaseEntity } from './types.js';

// ============================================================================
// BASEAPI INTERFACE
// ============================================================================
// We define the minimal interface we need from frontblok-auth's BaseApi.
// This avoids tight coupling and allows for testing.

// Minimal interface for the auth API client.
// Matches frontblok-auth's BaseApi.request() signature.
export interface AuthApiClient {
  request<T>(endpoint: string, options?: RequestInit): Promise<T>;
}

// ============================================================================
// UNIVERSAL CRUD API CLASS
// ============================================================================
// Single class that handles ALL CRUD operations for ANY entity type.
// Delegates HTTP to frontblok-auth's BaseApi - NO DUPLICATE HTTP LOGIC!

export class UniversalApi {
  private authApi: AuthApiClient;

  constructor(authApi: AuthApiClient) {
    this.authApi = authApi;
  }

  // ==========================================================================
  // UNIVERSAL CRUD OPERATIONS
  // ==========================================================================
  // These methods work with any entity - just pass the entity name.

  // Get all entities of a type.
  // const tasks = await api.getAll<Task>('tasks');
  // const activeTasks = await api.getAll<Task>('tasks', { status: 'active' });
  async getAll<T extends BaseEntity>(
    entityName: string,
    options?: { skip?: number; limit?: number; [key: string]: unknown }
  ): Promise<T[]> {
    // Build query string from options
    let query = '';
    if (options) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        query = `?${queryString}`;
      }
    }

    return this.authApi.request<T[]>(`/api/${this.pluralize(entityName)}/${query}`);
  }

  // Get a single entity by ID.
  // const task = await api.getOne<Task>('tasks', 'uuid-here');
  async getOne<T extends BaseEntity>(entityName: string, id: string): Promise<T> {
    return this.authApi.request<T>(`/api/${this.pluralize(entityName)}/${id}`);
  }

  // Create a new entity.
  // const task = await api.create<Task>('tasks', { title: 'New Task', status: 'pending' });
  async create<T extends BaseEntity>(
    entityName: string,
    data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<T> {
    return this.authApi.request<T>(`/api/${this.pluralize(entityName)}/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an existing entity.
  // const task = await api.update<Task>('tasks', 'uuid-here', { status: 'done' });
  async update<T extends BaseEntity>(
    entityName: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<T> {
    return this.authApi.request<T>(`/api/${this.pluralize(entityName)}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete an entity.
  // await api.remove('tasks', 'uuid-here');
  async remove(entityName: string, id: string): Promise<void> {
    await this.authApi.request<void>(`/api/${this.pluralize(entityName)}/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  // Smart pluralization for API endpoint paths.
  private pluralize(word: string): string {
    if (!word) return word;

    // Already ends with 's'? Don't add another one
    if (word.toLowerCase().endsWith('s')) {
      return word;
    }

    // Ends with 'y' preceded by consonant? Replace 'y' with 'ies'
    if (word.length > 1 && word.slice(-1).toLowerCase() === 'y') {
      const secondLast = word.slice(-2, -1).toLowerCase();
      if (!'aeiou'.includes(secondLast)) {
        return word.slice(0, -1) + 'ies';
      }
    }

    // Ends with 'ch', 'sh', 'x', 'z', 'o'? Add 'es'
    const esEndings = ['ch', 'sh', 'x', 'z', 'o'];
    for (const ending of esEndings) {
      if (word.toLowerCase().endsWith(ending)) {
        return word + 'es';
      }
    }

    // Default: just add 's'
    return word + 's';
  }
}

// ============================================================================
// SINGLETON INSTANCE MANAGEMENT
// ============================================================================
// Global API instance - initialized once, used everywhere.
// THE ONE WAY: initApi(authApi) with frontblok-auth's BaseApi instance.

let apiInstance: UniversalApi | null = null;

// Initialize the global CRUD API instance.
// Call this once at app startup (e.g., in main.tsx).
// // In main.tsx or App.tsx
// import { createAuthApi } from '@rationalbloks/frontblok-auth';
// import { initApi } from '@rationalbloks/frontblok-crud';
// const authApi = createAuthApi(import.meta.env.VITE_DATABASE_API_URL);
// initApi(authApi);
export function initApi(authApi: AuthApiClient): UniversalApi {
  apiInstance = new UniversalApi(authApi);
  return apiInstance;
}

// Get the global CRUD API instance.
// Throws if initApi hasn't been called.
// import { getApi } from '@rationalbloks/frontblok-crud';
// const tasks = await getApi().getAll<Task>('tasks');
export function getApi(): UniversalApi {
  if (!apiInstance) {
    throw new Error(
      'API not initialized. Call initApi(authApi) first, typically in main.tsx or App.tsx.\n' +
      'Example:\n' +
      '  import { createAuthApi } from "@rationalbloks/frontblok-auth";\n' +
      '  import { initApi } from "@rationalbloks/frontblok-crud";\n' +
      '  const authApi = createAuthApi(API_URL);\n' +
      '  initApi(authApi);'
    );
  }
  return apiInstance;
}

// Check if the API has been initialized.
// Useful for conditional rendering or lazy initialization.
export function isApiInitialized(): boolean {
  return apiInstance !== null;
}

// Reset the API instance (useful for testing).
export function resetApi(): void {
  apiInstance = null;
}
