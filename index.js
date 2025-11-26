import express from 'express';
import cors from 'cors';
import { Sandbox } from '@vercel/sandbox';

const app = express();
app.use(cors());
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
      ports: [3000, 5173, 8080],
      runtime: 'node22',
      resources: { vcpus: 4 }
    });

    console.log('Sandbox created:', sandbox.id);

    const fileEntries = Object.entries(files).map(([path, content]) => ({
      path: `/${path}`,
      content: content,
    }));
    
    await sandbox.writeFiles(fileEntries);

    const projectDir = Object.keys(files)[0]?.split('/')[0] || '';
    
    console.log('Installing dependencies...');
    const installResult = await sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', `cd ${projectDir} && npm install`],
    });
    
    if (installResult.exitCode !== 0) {
      throw new Error(`npm install failed: ${installResult.stderr}`);
    }

    console.log('Starting dev server...');
    sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', `cd ${projectDir} && npm run dev`],
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const previewUrl = sandbox.domain(5173) || sandbox.domain(3000) || sandbox.domain(8080);

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

    
    if (installResult.exitCode !== 0) {
      throw new Error(`npm install failed: ${installResult.stderr}`);
    }

    console.log('Starting dev server...');
    sandbox.runCommand({
      cmd: 'sh',
      args: ['-c', `cd ${projectDir} && npm run dev`],
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const previewUrl = sandbox.domain(5173) || sandbox.domain(3000) || sandbox.domain(8080);

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
