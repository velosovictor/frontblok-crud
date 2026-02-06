// ============================================================================
// FRONTBLOK-CRUD - MAIN EXPORT
// ============================================================================
// Universal CRUD API layer for RationalBloks frontends.
//
// USAGE:
// ```typescript
// // 1. Initialize API at app startup
// import { initApi } from '@rationalbloks/frontblok-crud';
// initApi(import.meta.env.VITE_DATABASE_API_URL);
//
// // 2. Use hooks in components
// import { useEntityList, useMutation } from '@rationalbloks/frontblok-crud';
// import type { Task } from './entities';
//
// function TaskList() {
//   const { items, loading } = useEntityList<Task>('tasks');
//   const { mutate } = useMutation<Task>('tasks');
//   // ...
// }
// ```
// ============================================================================

// Core API
export {
  UniversalApi,
  initApi,
  getApi,
  isApiInitialized,
  resetApi,
} from './api.js';
export type { AuthApiClient } from './api.js';

// React Hooks
export {
  useEntityList,
  useEntity,
  useMutation,
  useEntityForm,
} from './hooks.js';
export type {
  MutationFunctions,
  UseMutationResult,
  UseEntityFormResult,
} from './hooks.js';

// Generator (for MCP use)
export {
  generateEntitiesTs,
  validateSchema,
} from './generator.js';

// Types
export type {
  // Field and schema types
  FieldConfig,
  FieldType,
  EntityConfig,
  Schema,
  EntityMetadata,
  EntityRegistry,
  // Entity types
  BaseEntity,
  CreateInput,
  UpdateInput,
  // Response types
  PaginatedResponse,
  ApiError,
  // State types
  ListState,
  EntityState,
  MutationState,
} from './types.js';

export {
  SCHEMA_TO_TS_TYPE,
  SCHEMA_TO_DEFAULT,
} from './types.js';

// Utilities
export {
  // Naming utilities
  toPascalCase,
  toCamelCase,
  toSnakeCase,
  toSingular,
  toPlural,
  // Type utilities
  schemaTypeToTs,
  getFieldDefault,
  isUserForeignKey,
  // Entity utilities
  createEntityMetadata,
  getUserFkFields,
  // Form utilities
  getInitialFormData,
  getFormFieldConfig,
} from './utils.js';
