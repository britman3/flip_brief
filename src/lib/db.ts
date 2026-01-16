import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { WizardInput, BriefOutput } from './schema'

const DATA_DIR = path.join(process.cwd(), 'data')
const BRIEFS_FILE = path.join(DATA_DIR, 'briefs.json')

// Brief record type
export interface BriefRecord {
  id: string
  input: WizardInput
  output: BriefOutput | null
  status: 'pending' | 'generating' | 'completed' | 'failed'
  error: string | null
  createdAt: Date
  updatedAt: Date
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {
    // Directory might already exist
  }
}

// Read briefs from file
async function readBriefs(): Promise<BriefRecord[]> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(BRIEFS_FILE, 'utf-8')
    const briefs = JSON.parse(data)
    return briefs.map((b: BriefRecord) => ({
      ...b,
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt),
    }))
  } catch {
    return []
  }
}

// Write briefs to file
async function writeBriefs(briefs: BriefRecord[]) {
  await ensureDataDir()
  await fs.writeFile(BRIEFS_FILE, JSON.stringify(briefs, null, 2))
}

// Prisma-like interface for briefs
export const db = {
  brief: {
    create: async ({ data }: { data: { input: WizardInput } }): Promise<BriefRecord> => {
      const briefs = await readBriefs()
      const newBrief: BriefRecord = {
        id: uuidv4(),
        input: data.input,
        output: null,
        status: 'pending',
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      briefs.push(newBrief)
      await writeBriefs(briefs)
      return newBrief
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<BriefRecord | null> => {
      const briefs = await readBriefs()
      return briefs.find((b) => b.id === where.id) || null
    },

    update: async ({
      where,
      data,
    }: {
      where: { id: string }
      data: Partial<Omit<BriefRecord, 'id' | 'createdAt'>>
    }): Promise<BriefRecord> => {
      const briefs = await readBriefs()
      const index = briefs.findIndex((b) => b.id === where.id)
      if (index === -1) throw new Error('Brief not found')
      briefs[index] = {
        ...briefs[index],
        ...data,
        updatedAt: new Date(),
      }
      await writeBriefs(briefs)
      return briefs[index]
    },

    findMany: async ({
      orderBy,
    }: { orderBy?: { createdAt: 'asc' | 'desc' } } = {}): Promise<BriefRecord[]> => {
      let briefs = await readBriefs()

      if (orderBy?.createdAt === 'desc') {
        briefs = briefs.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      } else if (orderBy?.createdAt === 'asc') {
        briefs = briefs.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }

      return briefs
    },
  },
}
