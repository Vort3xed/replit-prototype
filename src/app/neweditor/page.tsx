"use client";

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';

// import MonacoEditor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

declare global {
  interface Window {
    cheerpjInit: (options?: object) => Promise<void>;
    cheerpjRunMain: any;
    cheerpjCreateDisplay: any;
    cheerpjAddStringFile: any;
  }
}

const Editor = () => {
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
  const [showDisplay, setShowDisplay] = useState(true); // Default to true or false as needed

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
        console.error('Error loading java virtual machine:', error);
      }
    };

    loadCheerpJ();
  }, []);

  const removeClasses = () => {
    const element = document.getElementById('cheerpjDisplay');
    console.log(element);
    element?.classList.remove("cheerpjLoading");
    element?.classList.remove("cheerpjNC");
    console.log(element?.classList);
  }

  // if (cheerpjLoaded) {
  //   removeClasses();
  // }



  // Compile and run Java code
  const runCode = async () => {
    if (!cheerpjLoaded) {
      setOutput('Java virtual machine is still loading! Please wait...\n');
      return;
    }
    setOutput('Compiling...\n');

    // Add files to CheerpJ filesystem
    const encoder = new TextEncoder();
    Object.entries(files).forEach(([path, content]) => {
      const encodedContent = encoder.encode(content);
      window.cheerpjAddStringFile('/str/' + path, encodedContent);
    });

    // Redirect console output
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    console.log = (msg: string) => {
      setOutput((prev) => prev + msg + '\n');
    };
    console.error = (msg: string) => {
      setOutput((prev) => prev + msg + '\n');
    };

    try {
      // Compile
      const sourceFiles = Object.keys(files).map((path) => '/str/' + path);
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

      // Run
      const mainClass = deriveMainClass(files[activeFile]);
      await window.cheerpjRunMain(mainClass, classPath);
    } catch (error) {
      setOutput((prev) => prev + error?.toString() + '\n');
    } finally {
      // Restore original console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
  };

  const deriveMainClass = (content: string) => {
    const classNameMatch = content.match(/public\s+class\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : 'Main';
    const packageMatch = content.match(/package\s+([\w\.]+);/);
    const packageName = packageMatch ? packageMatch[1] + '.' : '';
    return packageName + className;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setFiles({ ...files, [activeFile]: value });
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

  const renameFile = (oldFileName: string, newFileName: string) => {
    if (files[newFileName]) {
      alert('A file with that name already exists.');
      return;
    }

    const updatedFiles = { ...files };
    updatedFiles[newFileName] = updatedFiles[oldFileName];
    delete updatedFiles[oldFileName];
    setFiles(updatedFiles);

    if (activeFile === oldFileName) {
      setActiveFile(newFileName);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="min-w-[200px] max-w-[300px] border-r border-gray-300 p-2.5 overflow-y-auto">
        <ul>
          {Object.keys(files).map((fileName) => (
            <li key={fileName} className='flex flex-row space-x-2 w-full mt-2'>
              <button
                className={`content-center cursor-pointer ${activeFile === fileName ? 'font-bold' : 'font-normal'
                  }`}
                onClick={() => setActiveFile(fileName)}
              >
                {fileName}
              </button>
              {fileName !== 'Main.java' && (
                <div className='ml-auto space-x-2 flex w-max'>
                  <button
                    onClick={() => {
                      const newFileName = prompt('Enter new file name', fileName);
                      if (newFileName && newFileName !== fileName) {
                        renameFile(fileName, newFileName);
                      }
                    }}
                    className='bg-stone-400 rounded-md p-1'
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className='w-6 h-6'>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>

                  </button>
                  <button onClick={() => removeFile(fileName)} className='bg-red-400 rounded-md p-1'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className='w-6 h-6'>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>

                  </button>

                </div>
              )}
            </li>
          ))}
        </ul>
        <div className='flex flex-col space-y-2 pt-2'>
          <button className="rounded-md py-1 bg-stone-400" onClick={addFile}>Add File</button>
          <button className="rounded-md py-1 bg-red-400" onClick={runCode} disabled={!cheerpjLoaded}>Run Main.java</button>
          {!cheerpjLoaded && <div>Loading CheerpJ...</div>}
          <button onClick={() => setShowDisplay((prev) => !prev)}>
            {showDisplay ? 'Hide Display' : 'Show Display'}
          </button>
        </div>
      </div>
      {/* Editor and Output */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Editor */}
        <div style={{ flex: 1 }}>
          <MonacoEditor
            language="java"
            theme="vs-dark"
            value={files[activeFile]}
            onChange={handleEditorChange}
            options={{ automaticLayout: true }}
          />
        </div>
        <div style={{ height: '200px', borderTop: '1px solid #ccc', display: 'flex' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
            <pre>{output}</pre>
          </div>
          <div style={{ width: '400px', position: 'relative' }}>
            <div ref={displayRef} style={{
              width: '100%',
              height: '100%',
              // Add other styles that counteract the unwanted effects
            }} />
          </div>
          {/* {showDisplay && <div ref={displayRef} />} */}
        </div>
      </div>
    </div>
  );
};

export default Editor;