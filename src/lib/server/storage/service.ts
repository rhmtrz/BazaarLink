import 'dotenv/config';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.env.UPLOADS_DIR ?? './uploads';

function fullPath(objectKey: string): string {
	return path.join(ROOT, objectKey);
}

export function getImageFullPath(objectKey: string): string {
	return fullPath(objectKey);
}

export async function saveImage(objectKey: string, buffer: Buffer): Promise<void> {
	const fp = fullPath(objectKey);
	await fs.mkdir(path.dirname(fp), { recursive: true });
	await fs.writeFile(fp, buffer);
}

export async function deleteImage(objectKey: string): Promise<void> {
	try {
		await fs.unlink(fullPath(objectKey));
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
	}
}
