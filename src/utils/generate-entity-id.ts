import { ulid } from 'ulid';

/**
 * Generate a composed id based on the input parameters and return either the id if it exists or the generated one.
 * @param idProperty
 * @param prefix
 */
export default function generateEntityId(
  idProperty: string,
  prefix?: string,
): string {
  if (idProperty) {
    return idProperty;
  }

  const id = ulid();
  prefix = prefix ? `${prefix}_` : '';
  return `${prefix}${id}`;
}
