import { createSignal, createEffect } from "solid-js";

interface QueryEditorProps {
  onExecuteQuery: (query: string) => void;
  isLoading: boolean;
  selectedTable: string;
  theme: 'light' | 'dark';
  fontSize: string;
  fontFamily: string;
}

export const QueryEditor = (props: QueryEditorProps) => {
  const [query, setQuery] = createSignal("");

  // Update query when selected table changes
  createEffect(() => {
    if (props.selectedTable) {
      setQuery(`SELECT * FROM ${props.selectedTable} LIMIT 100`);
    }
  });

  return (
    <div class={`flex flex-col h-64 border ${props.theme === 'dark' ? 'border-gray-800' : 'border-gray-300'} rounded-md`}>
      <div class={`flex justify-between items-center px-4 py-2 ${props.theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-100 border-gray-300'} border-b`}>
        <h3 class="font-medium">SQL Query</h3>
        <div class="flex items-center">
          <button 
            onClick={() => props.onExecuteQuery(query())}
            disabled={props.isLoading}
            class="px-3 py-1 bg-blue-800 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {props.isLoading ? "Running..." : "Run"}
          </button>
        </div>
      </div>
      <textarea 
        value={query()} 
        onInput={(e) => setQuery(e.currentTarget.value)}
        class={`flex-1 p-4 resize-none focus:outline-none ${props.theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}
        style={{
          "font-family": props.fontFamily,
          "font-size": `${props.fontSize}px`
        }}
        placeholder="Enter SQL query..."
      />
    </div>
  );
};

export default QueryEditor; 