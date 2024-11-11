// src/app/api/terminal/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request): Promise<Response> {
    const { command } = await request.json();

    // Define allowed commands or implement command restrictions
    const allowedCommands = ['ls', 'pwd', 'javac Main.java', 'java Main',];

    // Simple check to prevent execution of disallowed commands
    if (!allowedCommands.includes(command.trim())) {
        return NextResponse.json({ output: 'Error: Command not allowed.' });
    }

    try {
        const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });
        const output = stdout || stderr || 'Command executed.';
        return NextResponse.json({ output });
    } catch (error: any) {
        return NextResponse.json({ output: error.message });
    }
}