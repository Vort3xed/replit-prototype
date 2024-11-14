"use client";

// pages/index.tsx
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import MonacoEditor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

declare global {
  interface Window {
    cheerpjInit: (options?: object) => Promise<void>;
    cheerpjRunMain: any;
    cheerpjCreateDisplay: any;
    cheerpjAddStringFile: any;
    cheerpjMkdir: (path: string) => void;
  }
}

const HomePage = () => {
  const [files, setFiles] = useState<{ [path: string]: string }>({
    'Main.java': `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  });
  const [activeFile, setActiveFile] = useState('Main.java');
  const [output, setOutput] = useState('');
  const [cheerpjLoaded, setCheerpjLoaded] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  // Load CheerpJ
  useEffect(() => {
    const loadCheerpJ = async () => {
      try {
        // Fetch the latest CheerpJ URL
        const response = await fetch('https://cjrtnc.leaningtech.com/LATEST.txt');
        let cheerpJUrl = await response.text();
        cheerpJUrl = cheerpJUrl.trim();

        // Create script tag
        const script = document.createElement('script');
        script.src = cheerpJUrl;
        script.onload = async () => {
          if (window.cheerpjInit) {
            await window.cheerpjInit({
              status: 'none',
              javaProperties: ['java.library.path=/app/cheerpj-natives/natives'],
            });
            window.cheerpjCreateDisplay(-1, -1, displayRef.current);
            setCheerpjLoaded(true);
          }
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error loading CheerpJ:', error);
      }
    };

    loadCheerpJ();
  }, []);

  // Compile and run Java code
  const runCode = async () => {
    if (!cheerpjLoaded || !window.cheerpjAddStringFile) {
      setOutput('CheerpJ is not loaded yet.');
      return;
    }

    setOutput('Compiling...\n');

    // Add files to CheerpJ filesystem
    Object.entries(files).forEach(([path, content]) => {
      window.cheerpjAddStringFile('/' + path, content);
    });

    // Compile
    const sourceFiles = Object.keys(files).map((path) => '/' + path);
    const classPath = '/app/tools.jar:/files/';
    const code = await window.cheerpjRunMain(
      'com.sun.tools.javac.Main',
      classPath,
      ...sourceFiles,
      '-d',
      '/files/',
      '-Xlint'
    );

    if (code !== 0) {
      setOutput((prev) => prev + 'Compilation failed.\n');
      return;
    }

    setOutput((prev) => prev + 'Running...\n');

    // Redirect console output
    const originalConsoleLog = console.log;
    console.log = (msg: string) => {
      setOutput((prev) => prev + msg + '\n');
    };

    // Run
    const mainClass = deriveMainClass(files[activeFile]);
    window.cheerpjRunMain(mainClass, classPath);

    // Restore console.log
    console.log = originalConsoleLog;
  };

  const deriveMainClass = (content: string) => {
    const classNameMatch = content.match(/public\s+class\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : 'Main';
    const packageMatch = content.match(/package\s+([\w\.]+);/);
    const packageName = packageMatch ? packageMatch[1] + '.' : '';
    return packageName + className;
  };

  const addFile = () => {
    let newFileName = 'Class.java';
    let counter = 1;
    while (files[newFileName]) {
      newFileName = `Class${counter}.java`;
      counter++;
    }
    setFiles({ ...files, [newFileName]: `public class ${newFileName.replace('.java', '')} {\n\n}` });
    setActiveFile(newFileName);
  };

  const removeFile = (fileName: string) => {
    if (Object.keys(files).length === 1) return;
    const newFiles = { ...files };
    delete newFiles[fileName];
    setFiles(newFiles);
    if (activeFile === fileName) {
      setActiveFile(Object.keys(newFiles)[0]);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setFiles({ ...files, [activeFile]: value });
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', borderRight: '1px solid #ccc', padding: '10px' }}>
        <button onClick={addFile}>Add File</button>
        <ul>
          {Object.keys(files).map((fileName) => (
            <li key={fileName}>
              <span
                style={{ cursor: 'pointer', fontWeight: activeFile === fileName ? 'bold' : 'normal' }}
                onClick={() => setActiveFile(fileName)}
              >
                {fileName}
              </span>
              {fileName !== 'Main.java' && (
                <button onClick={() => removeFile(fileName)}>x</button>
              )}
            </li>
          ))}
        </ul>
        <button onClick={runCode}>Run</button>
      </div>
      {/* Editor and Output */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Editor */}
        <div style={{ flex: 1 }}>
          <MonacoEditor
            language="java"
            theme="vs-dark"
            onChange={(value) => handleEditorChange(value)}
            options={{ automaticLayout: true }}
          />
        </div>
        {/* Output */}
        <div style={{ height: '200px', borderTop: '1px solid #ccc', display: 'flex' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
            <pre>{output}</pre>
          </div>
          <div style={{ width: '400px', position: 'relative' }}>
            <div ref={displayRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;