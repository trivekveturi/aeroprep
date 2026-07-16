/**
 * DataSource factory.
 * Set DATA_SOURCE in .env.local:
 *   "json"  → reads from DATA_DIR folder (bundled seed)
 *   "mysql" → reads from pilot_exam MySQL database
 */
import { DataSource } from './types';
import { JsonFileDataSource } from './JsonFileDataSource';
import { MySQLDataSource } from './MySQLDataSource';

let _instance: DataSource | null = null;

export function getDataSource(): DataSource {
  if (_instance) return _instance;

  const source = process.env.DATA_SOURCE ?? 'json';

  if (source === 'json') {
    _instance = new JsonFileDataSource();
    return _instance;
  }

  if (source === 'mysql') {
    _instance = new MySQLDataSource();
    return _instance;
  }

  throw new Error(`Unknown DATA_SOURCE: "${source}". Supported: json, mysql`);
}
