/**
 * JsonFileDataSource
 * Reads question data from the folder pointed to by DATA_DIR env var.
 * Auto-discovers subjects by scanning for subfolders containing data.json.
 *
 * Folder layout expected:
 *   DATA_DIR/
 *     01-meteorology/data.json
 *     02-air-regulation/data.json
 *     subjects.json  (optional — overrides display metadata per subject)
 *
 * Falls back to app-data/seed if DATA_DIR is unset, so the app runs anywhere.
 */
import fs from 'fs';
import path from 'path';
import { DataSource, Subject, Question } from './types';

// Default rotating colors/icons when subjects.json doesn't list a subject
const DEFAULT_ICONS  = ['🌦️','⚖️','⚙️','🧭','📡','🛩️','🎓','📋','🔬','🌍'];
const DEFAULT_COLORS = ['#00D4AA','#F5A623','#4FB3E8','#1B6CA8','#FF4D6A','#2E86D4','#00A882','#FFD080'];

function rotate<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

function titleCase(str: string): string {
  return str
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function deriveNameFromFolder(folder: string): string {
  // "01-meteorology" → "Meteorology"
  // "03-3-instrumentation" → "3 Instrumentation"
  const withoutLeadingNum = folder.replace(/^\d+-/, '');
  return titleCase(withoutLeadingNum);
}

function parseOrder(folder: string): number {
  const match = folder.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : 999;
}

type SubjectMeta = { id: string; name?: string; icon?: string; color?: string };

export class JsonFileDataSource implements DataSource {
  private dataDir: string;
  // Cache subjects list after first load to avoid repeated disk reads
  private _subjectsCache: Subject[] | null = null;

  constructor() {
    // DATA_DIR can be an absolute path to the external scraper output folder.
    // Falls back to the seed folder inside this repo.
    this.dataDir = process.env.DATA_DIR
      ?? path.join(process.cwd(), 'app-data', 'seed');
  }

  private getSubjectsJsonPath(): string {
    return path.join(this.dataDir, 'subjects.json');
  }

  private loadSubjectsMeta(): SubjectMeta[] {
    const p = this.getSubjectsJsonPath();
    if (!fs.existsSync(p)) return [];
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8')) as SubjectMeta[];
    } catch {
      return [];
    }
  }

  async listSubjects(): Promise<Subject[]> {
    if (this._subjectsCache) return this._subjectsCache;

    if (!fs.existsSync(this.dataDir)) {
      console.warn(`DATA_DIR not found: ${this.dataDir}. Returning empty subject list.`);
      return [];
    }

    const meta = this.loadSubjectsMeta();
    const metaMap = new Map(meta.map(m => [m.id, m]));

    const entries = fs.readdirSync(this.dataDir, { withFileTypes: true });
    const subjects: Subject[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dataFile = path.join(this.dataDir, entry.name, 'data.json');
      if (!fs.existsSync(dataFile)) continue;

      let questions: Question[] = [];
      try {
        questions = JSON.parse(fs.readFileSync(dataFile, 'utf8')) as Question[];
      } catch {
        continue; // skip malformed files
      }

      const id = entry.name;
      const order = parseOrder(id);
      const override = metaMap.get(id);
      const autoName = deriveNameFromFolder(id);
      const idx = subjects.length;

      const chapters = questions
        .map(q => q.chapter)
        .filter((c): c is string => !!c);
      const uniqueChapters = [...new Set(chapters)];

      subjects.push({
        id,
        order,
        name:          override?.name  ?? autoName,
        icon:          override?.icon  ?? rotate(DEFAULT_ICONS, idx),
        color:         override?.color ?? rotate(DEFAULT_COLORS, idx),
        questionCount: questions.length,
        chapters:      uniqueChapters.length > 0 ? uniqueChapters : undefined,
      });
    }

    subjects.sort((a, b) => a.order - b.order);
    this._subjectsCache = subjects;
    return subjects;
  }

  async getSubject(id: string): Promise<Subject | null> {
    const all = await this.listSubjects();
    return all.find(s => s.id === id) ?? null;
  }

  private loadQuestionsRaw(subjectId: string): Question[] {
    const dataFile = path.join(this.dataDir, subjectId, 'data.json');
    if (!fs.existsSync(dataFile)) return [];
    try {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8')) as Question[];
    } catch {
      return [];
    }
  }

  async getQuestions(params: {
    subjectId: string;
    chapterId?: string;
    limit?: number;
    shuffle?: boolean;
  }): Promise<Question[]> {
    let qs = this.loadQuestionsRaw(params.subjectId);

    if (params.chapterId) {
      qs = qs.filter(q => q.chapter === params.chapterId);
    }

    if (params.shuffle) {
      // Fisher-Yates shuffle
      for (let i = qs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qs[i], qs[j]] = [qs[j], qs[i]];
      }
    }

    if (params.limit && params.limit < qs.length) {
      qs = qs.slice(0, params.limit);
    }

    return qs;
  }

  async getMockTest(params: {
    subjectId?: string;
    count: number;
  }): Promise<Question[]> {
    let pool: Question[] = [];

    if (params.subjectId) {
      pool = this.loadQuestionsRaw(params.subjectId);
    } else {
      // All subjects combined
      const subjects = await this.listSubjects();
      for (const s of subjects) {
        pool = pool.concat(this.loadQuestionsRaw(s.id));
      }
    }

    // Shuffle and take up to count
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, Math.min(params.count, pool.length));
  }
}
