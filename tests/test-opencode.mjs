import { createOpencodeClient } from '@opencode-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const client = createOpencodeClient({ baseUrl: 'http://127.0.0.1:4096' });

async function test() {
  const projectId = uuidv4();
  const projectDir = path.join(process.cwd(), 'temp', projectId);
  await fs.mkdir(projectDir, { recursive: true });

  const session = await client.session.create({ body: { title: 'Test' } });
  const sessionId = session.data.id;

  const result = await client.session.prompt({
    path: { id: sessionId },
    body: { parts: [{ type: 'text', text: `生成HTML，保存到${projectDir}/index.html` }] }
  }, { timeout: 60000 });

  const text = result.data.parts.filter(p => p.type === 'text').map(p => p.text).join('\n');
  console.log(text);

  const files = await fs.readdir(projectDir);
  if (files.length > 0) {
    console.log('✅ OpenCode 工作正常');
    console.log('文件:', await fs.readFile(path.join(projectDir, files[0]), 'utf8'));
  }
}

test().catch(console.error);
