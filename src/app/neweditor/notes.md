use:
`const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });`

monaco editor:
```
<MonacoEditor
            language="java"
            theme="vs-dark"
            onChange={(value) => handleEditorChange(value)}
            options={{ automaticLayout: true }}
          />
```

handle editor change:
```
const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setFiles({ ...files, [activeFile]: value });
  };
```