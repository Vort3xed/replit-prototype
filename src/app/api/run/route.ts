// src/app/api/run/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request): Promise<Response> {
    const { files, input } = await request.json();
    const tempDir = path.join(process.cwd(), 'temp');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    // Save all files to the temporary directory
    for (const file of files) {
        const filePath = path.join(tempDir, file.name);
        fs.writeFileSync(filePath, file.content);
    }

    return new Promise<Response>((resolve) => {
        exec('javac *.java', { cwd: tempDir }, (compileError, _, compileStderr) => {
            if (compileError) {
                // Clean up temporary files
                fs.rmSync(tempDir, { recursive: true, force: true });
                return resolve(
                    NextResponse.json({ output: compileStderr || compileError.message })
                );
            }

            exec(
                `echo "${input}" | java -cp . Main`,
                { cwd: tempDir },
                (runError, runStdout, runStderr) => {
                    // Clean up temporary files
                    fs.rmSync(tempDir, { recursive: true, force: true });

                    if (runError) {
                        return resolve(
                            NextResponse.json({ output: runStderr || runError.message })
                        );
                    }
                    resolve(NextResponse.json({ output: runStdout }));
                }
            );
        });
    });
}