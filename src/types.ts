// ============================================================================
// FRONTBLOK-CRUD - TYPE DEFINITIONS
// ============================================================================
// Core TypeScript types used throughout the package.
// ============================================================================

// Field configuration from JSON schema.
// { "field_name": { "type": "string", "required": true, ... } }
export interface FieldConfig {
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  max_length?: number;
  precision?: number;
  scale?: number;
  enum?: string[];
  foreign_key?: string;
  nullable?: boolean;
  default?: unknown;
  description?: string;
  index?: boolean;
  on_delete?: 'cascade' | 'set_null' | 'restrict' | 'no_action';
  _id?: string; // Metadata for rename tracking (not a real field)
}

// Supported field types.
export type FieldType =
  | 'string'
  | 'text'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'datetime'
  | 'date'
  | 'uuid'
  | 'json';

// Entity configuration - the value side of ENTITIES registry.
// Maps field names to their configurations.
export type EntityConfig = Record<string, FieldConfig>;

// Complete schema - maps table names to entity configs.
// This is the FLAT format: { "tasks": { "title": {...}, "status": {...} } }
export type Schema = Record<string, EntityConfig>;

// Entity metadata for runtime use.
// Generated alongside TypeScript interfaces in entities.ts.
export interface EntityMetadata {
  singular: string;
  plural: string;
  fields: EntityConfig;
  displayFields?: string[]; // Fields to show in list views
  searchFields?: string[];  // Fields for search functionality
}

// Entity registry - the runtime counterpart to TypeScript interfaces.
// Generated as `export const entities = {...} as const` in entities.ts.
export type EntityRegistry = Record<string, EntityMetadata>;

// Base entity interface - all entities extend this.
// These fields are automatically added to every entity.
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Generic create input - excludes auto-generated fields.
export type CreateInput<T extends BaseEntity> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

// Generic update input - all fields optional.
export type UpdateInput<T extends BaseEntity> = Partial<CreateInput<T>>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

// Paginated response from list endpoints.
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// Error response from API.
export interface ApiError {
  detail: string;
  status?: number;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

// State for list queries.
export interface ListState<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// State for single entity queries.
export interface EntityState<T> {
  item: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// State for mutations (create/update/delete).
export interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// ============================================================================
// TYPE MAPPING UTILITIES
// ============================================================================

// Maps schema field types to TypeScript types.
// Used by the MCP generator to create entities.ts.
export const SCHEMA_TO_TS_TYPE: Record<FieldType, string> = {
  string: 'string',
  text: 'string',
  integer: 'number',
  decimal: 'number',
  boolean: 'boolean',
  datetime: 'string',
  date: 'string',
  uuid: 'string',
  json: 'Record<string, unknown>',
};

// Maps schema field types to JavaScript defaults.
// Used for form initialization.
export const SCHEMA_TO_DEFAULT: Record<FieldType, unknown> = {
  string: '',
  text: '',
  integer: 0,
  decimal: 0,
  boolean: false,
  datetime: '',
  date: '',
  uuid: '',
  json: {},
};
