import express from 'express';
import cors from 'cors';
import { Sandbox } from '@vercel/sandbox';

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

app.post('/api/sandbox/create', async (req, res) => {
  try {
    const { files } = req.body;
    
    console.log('Creating Vercel Sandbox...');
    
    // Check for required credentials
    const token = process.env.SANDBOX_VERCEL_TOKEN;
    const teamId = process.env.SANDBOX_VERCEL_TEAM_ID;
    const projectId = process.env.SANDBOX_VERCEL_PROJECT_ID;
    
    if (!token || !teamId || !projectId) {
      throw new Error('Missing environment variables: SANDBOX_VERCEL_TOKEN, SANDBOX_VERCEL_TEAM_ID, and SANDBOX_VERCEL_PROJECT_ID are required');
    }
    
    const sandbox = await Sandbox.create({
      token,
      teamId,
      projectId,
      timeout: 300000,
      ports: [5173, 3000],
      runtime: 'node22',
      resources: { vcpus: 4 }
    }).catch(err => {
      console.error('Vercel Sandbox API Error:', err);
      throw new Error(`Vercel Sandbox API error: ${err.message || err}`);
    });

    console.log('Sandbox created:', sandbox.id);

    // Detect and remove common project directory prefix
    const filePaths = Object.keys(files);
    const firstPath = filePaths[0] || '';
    const projectDir = firstPath.split('/')[0];
    
    console.log(`Detected project directory: ${projectDir}`);

    const fileEntries = Object.entries(files).map(([path, content]) => {
      // Remove project directory prefix (e.g., "lane-kanban-subtasks/")
      const cleanPath = path.startsWith(`${projectDir}/`) 
        ? path.substring(projectDir.length + 1) 
        : path;
      
      const fileContent = String(content || '');
      const buffer = Buffer.from(fileContent, 'utf-8');
      console.log(`File: ${cleanPath}, Bytes: ${buffer.byteLength}`);
      return {
        path: cleanPath,
        content: buffer,
      };
    });
    
    console.log(`Writing ${fileEntries.length} files to sandbox...`);
    await sandbox.writeFiles(fileEntries);

    console.log('Installing dependencies...');
    const installResult = await sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', 'npm install'],
    });
    
    if (installResult.exitCode !== 0) {
      throw new Error(`npm install failed: ${installResult.stderr}`);
    }

    console.log('Starting dev server...');
    sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', 'npm run dev'],
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const previewUrl = sandbox.domain(5173) || sandbox.domain(3000);

    res.json({
      success: true,
      previewUrl,
      sandboxId: sandbox.id,
      output: installResult.stdout,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sandbox service running on port ${PORT}`);
});
