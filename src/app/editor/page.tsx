// src/app/editor/page.tsx
'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

type File = {
  name: string;
  content: string;
};

export default function EditorPage() {
  const [files, setFiles] = useState<File[]>([
    {
      name: 'Main.java',
      content: `public class Main {
    public static void main(String[] args) {
        // Your code here
    }
}`,
    },
  ]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // Terminal state
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const handleFileChange = (index: number) => {
    setSelectedFileIndex(index);
  };

  const handleAddFile = () => {
    const newFile: File = {
      name: `Class${files.length}.java`,
      content: `public class Class${files.length} {\n\n}`,
    };
    setFiles([...files, newFile]);
    setSelectedFileIndex(files.length);
  };

  const handleDeleteFile = (index: number) => {
    if (files.length === 1) return;
    const updatedFiles = files.filter((_, idx) => idx !== index);
    setFiles(updatedFiles);
    setSelectedFileIndex(0);
  };

  const handleRenameFile = (index: number, newName: string) => {
    const updatedFiles = [...files];
    updatedFiles[index].name = newName;
    setFiles(updatedFiles);
  };

  const handleRun = async () => {
    setLoading(true);
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, input }),
    });
    const data = await response.json();
    setOutput(data.output);
    setLoading(false);
  };

  // Function to handle terminal command submission
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    // Display the command in the terminal output
    setTerminalOutput((prev) => [...prev, `> ${terminalInput}`]);

    const response = await fetch('/api/terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: terminalInput }),
    });
    const data = await response.json();

    // Display the output from the command
    setTerminalOutput((prev) => [...prev, data.output]);
    setTerminalInput('');
  };

  return (
    <div className="flex flex-col p-4 min-h-screen bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-4">Java Compiler & Runner</h1>
      <div className="flex mb-4">
        <div className="flex flex-col w-1/4 border-r pr-2">
          <button
            onClick={handleAddFile}
            className="bg-green-500 text-white px-2 py-1 rounded mb-2"
          >
            add file
          </button>
          <ul>
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between mb-1">
                <button
                  onClick={() => handleFileChange(index)}
                  className={`${
                    index === selectedFileIndex ? 'font-bold' : ''
                  }`}
                >
                  {file.name}
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const newName = prompt('Enter new file name', file.name);
                      if (newName) handleRenameFile(index, newName);
                    }}
                    className="text-blue-500"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeleteFile(index)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <Editor
          height="60vh"
          width="75%"
          defaultLanguage="java"
          value={files[selectedFileIndex]?.content}
          onChange={(value) => {
            const updatedFiles = [...files];
            updatedFiles[selectedFileIndex].content = value || '';
            setFiles(updatedFiles);
          }}
          theme="vs-dark"
          className="ml-4"
        />
      </div>
      <textarea
        className="border p-2 mb-4 rounded"
        placeholder="Input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
      />
      <button
        onClick={handleRun}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        {loading ? 'Running...' : 'Run'}
      </button>
      <pre className="bg-gray-800 text-white p-4 rounded overflow-auto mb-4">
        {output}
      </pre>

      {/* Terminal Interface */}
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Terminal</h2>
        <div className="bg-black text-white p-4 rounded h-64 overflow-auto mb-2">
          {terminalOutput.map((line, idx) => (
            <pre key={idx}>{line}</pre>
          ))}
        </div>
        <form onSubmit={handleTerminalSubmit} className="flex">
          <input
            type="text"
            className="flex-grow border p-2 rounded-l bg-gray-800 text-white"
            placeholder="Enter command"
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
          />
          <button type="submit" className="bg-blue-500 text-white px-4 rounded-r">
            Run
          </button>
        </form>
      </div>
    </div>
  );
}