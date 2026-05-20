import { promises as fs } from "fs";
import path from "path";
import type { Submission } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "submissions.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

export async function readSubmissions(): Promise<Submission[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Submission[];
}

export async function appendSubmission(submission: Submission): Promise<void> {
  const list = await readSubmissions();
  list.push(submission);
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
}
