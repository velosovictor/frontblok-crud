// ============================================================================
// FRONTBLOK-CRUD - UTILITY FUNCTIONS
// ============================================================================
// Helper functions for working with entities and schemas.
// ============================================================================

import type { EntityConfig, FieldConfig, FieldType, EntityMetadata } from './types.js';

// ============================================================================
// NAMING UTILITIES
// ============================================================================

/**
 * Convert string to PascalCase.
 * Used for TypeScript interface names.
 * 
 * @example
 * toPascalCase('user_tasks') // 'UserTasks'
 * toPascalCase('task') // 'Task'
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert string to camelCase.
 * Used for variable and function names.
 * 
 * @example
 * toCamelCase('user_tasks') // 'userTasks'
 * toCamelCase('Task') // 'task'
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to snake_case.
 * Used for API endpoint paths (table names).
 * 
 * @example
 * toSnakeCase('UserTasks') // 'user_tasks'
 * toSnakeCase('task') // 'task'
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Get singular form of a word.
 * Simple implementation that handles common cases.
 * 
 * @example
 * toSingular('tasks') // 'task'
 * toSingular('categories') // 'category'
 * toSingular('users') // 'user'
 */
export function toSingular(str: string): string {
  if (str.endsWith('ies') && str.length > 3) {
    return str.slice(0, -3) + 'y';
  }
  if (str.endsWith('es') && str.length > 2) {
    // Check if it's a word that adds 'es' (boxes, dishes)
    const withoutEs = str.slice(0, -2);
    if (['ch', 'sh', 'ss', 'x', 'z', 'o'].some(e => withoutEs.endsWith(e))) {
      return withoutEs;
    }
    // Otherwise just remove 's' (e.g., 'plates' -> 'plate')
    return str.slice(0, -1);
  }
  if (str.endsWith('s') && str.length > 1) {
    return str.slice(0, -1);
  }
  return str;
}

/**
 * Smart pluralization for entity names.
 *
 * @example
 * toPlural('task') // 'tasks'
 * toPlural('category') // 'categories'
 * toPlural('status') // 'status' (already ends in s)
 */
export function toPlural(str: string): string {
  if (!str) return str;

  // Already ends with 's'? Don't add another one
  if (str.toLowerCase().endsWith('s')) {
    return str;
  }

  // Ends with 'y' preceded by consonant? Replace 'y' with 'ies'
  if (str.length > 1 && str.slice(-1).toLowerCase() === 'y') {
    const secondLast = str.slice(-2, -1).toLowerCase();
    if (!'aeiou'.includes(secondLast)) {
      return str.slice(0, -1) + 'ies';
    }
  }

  // Ends with 'ch', 'sh', 'x', 'z', 'o'? Add 'es'
  const esEndings = ['ch', 'sh', 'x', 'z', 'o'];
  for (const ending of esEndings) {
    if (str.toLowerCase().endsWith(ending)) {
      return str + 'es';
    }
  }

  // Default: just add 's'
  return str + 's';
}

// ============================================================================
// TYPE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert schema field type to TypeScript type string.
 * Used by the MCP generator to create entities.ts.
 */
export function schemaTypeToTs(fieldType: FieldType): string {
  const mapping: Record<FieldType, string> = {
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
  return mapping[fieldType] || 'unknown';
}

/**
 * Get default value for a field type.
 * Used for form initialization.
 */
export function getFieldDefault(field: FieldConfig): unknown {
  // If schema has explicit default, use it
  if (field.default !== undefined) {
    return field.default;
  }

  // Otherwise use type-based defaults
  const defaults: Record<FieldType, unknown> = {
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

  return defaults[field.type] ?? '';
}

/**
 * Check if a field is a foreign key to app_users.
 * Used for FK-based authorization.
 */
export function isUserForeignKey(field: FieldConfig): boolean {
  return Boolean(field.foreign_key?.startsWith('app_users.'));
}

// ============================================================================
// ENTITY METADATA UTILITIES
// ============================================================================

/**
 * Create entity metadata from schema.
 * Generates singular/plural names and extracts field info.
 */
export function createEntityMetadata(
  tableName: string,
  fields: EntityConfig
): EntityMetadata {
  const singular = toSingular(tableName);
  const plural = toPlural(tableName);

  // Get display fields (first 6 non-internal fields)
  const displayFields = Object.keys(fields)
    .filter(f => !f.startsWith('_') && f !== 'user_id')
    .slice(0, 6);

  // Get searchable fields (string and text types)
  const searchFields = Object.entries(fields)
    .filter(([key, config]) => 
      !key.startsWith('_') && 
      (config.type === 'string' || config.type === 'text')
    )
    .map(([key]) => key);

  return {
    singular,
    plural,
    fields,
    displayFields,
    searchFields,
  };
}

/**
 * Get user FK fields from entity config.
 * These fields are used for FK-based authorization.
 */
export function getUserFkFields(entityConfig: EntityConfig): string[] {
  return Object.entries(entityConfig)
    .filter(([key, config]) => 
      key !== '_id' && 
      typeof config === 'object' && 
      isUserForeignKey(config)
    )
    .map(([key]) => key);
}

// ============================================================================
// FORM UTILITIES
// ============================================================================

/**
 * Get initial form data from entity config.
 * Creates an object with default values for all fields.
 */
export function getInitialFormData(
  entityConfig: EntityConfig
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [fieldName, fieldConfig] of Object.entries(entityConfig)) {
    // Skip metadata fields
    if (fieldName.startsWith('_')) continue;
    // Skip user_id (auto-injected by backend)
    if (fieldName === 'user_id') continue;

    data[fieldName] = getFieldDefault(fieldConfig);
  }

  return data;
}

/**
 * Get form field configuration for a single field.
 * Useful for building dynamic forms.
 */
export function getFormFieldConfig(fieldName: string, fieldConfig: FieldConfig) {
  return {
    name: fieldName,
    label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    type: fieldConfig.type,
    required: fieldConfig.required ?? false,
    options: fieldConfig.enum,
    placeholder: fieldConfig.description,
    maxLength: fieldConfig.max_length,
    isForeignKey: Boolean(fieldConfig.foreign_key),
    foreignKeyTarget: fieldConfig.foreign_key,
  };
}
