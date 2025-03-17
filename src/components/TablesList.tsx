import { For, Show } from "solid-js";

interface TablesListProps {
  tables: string[];
  selectedTable: string;
  onSelectTable: (table: string) => void;
  theme: 'light' | 'dark';
  isVisible: boolean;
}

export const TablesList = (props: TablesListProps) => {
  return (
    <Show when={props.isVisible}>
      <div class={`w-64 h-full ${props.theme === 'dark' ? 'bg-black border-gray-800' : 'bg-gray-100 border-gray-200'} border-r overflow-y-auto`}>
        <div class={`p-4 border-b ${props.theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <h3 class="text-md font-semibold">Tables</h3>
        </div>
        <ul class={`divide-y ${props.theme === 'dark' ? 'divide-gray-800' : 'divide-gray-200'}`}>
          <For each={props.tables}>
            {(table) => (
              <li 
                class={`px-4 py-2 cursor-pointer ${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-200'} ${props.selectedTable === table ? (props.theme === 'dark' ? 'bg-blue-800' : 'bg-blue-100') : ''}`}
                onClick={() => props.onSelectTable(table)}
              >
                <div class="flex items-center">
                  <span class="material-icons text-yellow-500 mr-2 text-sm">table_chart</span>
                  <span class="truncate">{table}</span>
                </div>
              </li>
            )}
          </For>
        </ul>
      </div>
    </Show>
  );
};

export default TablesList; 