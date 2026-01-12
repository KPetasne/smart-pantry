import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';

const scriptSchema = z.object({
  action: z.enum(['seed', 'cleanup', 'cleanup-empty']),
  params: z.object({
    targetRecipes: z.number().int().positive().optional(),
    batchSize: z.number().int().positive().optional(),
    model: z.string().optional(),
  }).optional(),
});

// Store for active script executions
const activeExecutions = new Map<string, { logs: string[]; status: 'running' | 'completed' | 'error' }>();

// POST - Execute script
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, params } = scriptSchema.parse(body);

    const executionId = `${action}-${Date.now()}`;
    activeExecutions.set(executionId, { logs: [], status: 'running' });

    // Execute script asynchronously
    executeScript(executionId, action, params).catch(error => {
      console.error('Script execution error:', error);
      const execution = activeExecutions.get(executionId);
      if (execution) {
        execution.status = 'error';
        execution.logs.push(`Error: ${error.message}`);
      }
    });

    return NextResponse.json({
      success: true,
      executionId,
      message: `Script ${action} started`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error starting script:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get script execution status and logs
export async function GET(request: Request) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('executionId');

  if (!executionId) {
    return NextResponse.json({ error: 'executionId is required' }, { status: 400 });
  }

  const execution = activeExecutions.get(executionId);

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
  }

  return NextResponse.json({
    executionId,
    status: execution.status,
    logs: execution.logs,
  });
}

async function executeScript(
  executionId: string,
  action: 'seed' | 'cleanup' | 'cleanup-empty',
  params?: { targetRecipes?: number; batchSize?: number; model?: string }
) {
  const execution = activeExecutions.get(executionId);
  if (!execution) return;

  const log = (message: string) => {
    execution.logs.push(message);
  };

  try {
    if (action === 'seed') {
      log('Starting seed script...');
      const targetRecipes = params?.targetRecipes || 20;
      const batchSize = params?.batchSize || 2;
      const model = params?.model || 'gemini-2.5-flash';
      
      log(`Target recipes: ${targetRecipes}`);
      log(`Batch size: ${batchSize}`);
      log(`Model: ${model}`);
      
      // Import and execute seed function
      const { seedRecipes } = await import('@/scripts/seed');
      await seedRecipes(log, targetRecipes, batchSize, model);
      log('Seed script completed successfully');
      execution.status = 'completed';
    } else if (action === 'cleanup') {
      log('Starting cleanup script...');
      // Import and execute cleanup function
      const { removeDuplicateRecipes } = await import('@/scripts/cleanup-duplicates');
      await removeDuplicateRecipes(log);
      log('Cleanup script completed successfully');
      execution.status = 'completed';
    } else if (action === 'cleanup-empty') {
      log('Starting cleanup empty recipes script...');
      // Import and execute cleanup empty function
      const { removeEmptyRecipes } = await import('@/scripts/cleanup-empty-recipes');
      await removeEmptyRecipes(log);
      log('Cleanup empty recipes script completed successfully');
      execution.status = 'completed';
    }
  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    execution.status = 'error';
    throw error;
  }
}
