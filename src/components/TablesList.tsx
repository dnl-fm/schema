import { For, Show } from "solid-js";
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface TablesListProps {
  tables: string[];
  selectedTable: string;
  onSelectTable: (table: string) => void;
  theme: ThemeMode;
  isVisible: boolean;
}

export const TablesList = (props: TablesListProps) => {
  return (
    <Show when={props.isVisible}>
      <div class={`w-64 h-full ${themeColors[props.theme as ThemeMode].sidebar} border-r ${themeColors[props.theme as ThemeMode].sidebarBorder} overflow-y-auto`}>
        <div class={`p-4 border-b ${themeColors[props.theme as ThemeMode].sidebarBorder}`}>
          <h3 class="text-md font-semibold">Tables</h3>
        </div>
        <ul class={`divide-y ${themeColors[props.theme as ThemeMode].divider}`}>
          <For each={props.tables}>
            {(table) => (
              <li 
                class={`px-4 py-2 cursor-pointer ${themeColors[props.theme as ThemeMode].hover} ${
                  props.selectedTable === table ? themeColors[props.theme as ThemeMode].tableRowSelected : ''
                }`}
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