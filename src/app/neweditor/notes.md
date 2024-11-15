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

Main.java:
```
public class Main {
    public static void main(String[] args) {
        Class cl = new Class(4,5);

        System.out.println(cl.produce());
    }
}
```

Class.java:
```
public class Class {
    int a;
    int b;
    public Class(int a_new, int b_new){
        a = a_new;
        b = b_new;
    }

    public int produce(){
        return a * b;
    }
}
```