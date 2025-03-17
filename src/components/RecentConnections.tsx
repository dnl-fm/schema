import { For, Show } from "solid-js";
import { ConnectionHistory } from "../types.ts";
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface RecentConnectionsProps {
  connections: ConnectionHistory[];
  onSelect: (path: string) => void;
  theme: ThemeMode;
}

export const RecentConnections = (props: RecentConnectionsProps) => {
  return (
    <Show when={props.connections.length > 0}>
      <div class="mt-4">
        <h3 class={`text-sm font-medium ${themeColors[props.theme as ThemeMode].headerText} mb-2`}>
          Recent Connections
        </h3>
        <ul class={`space-y-1 ${themeColors[props.theme as ThemeMode].subText}`}>
          <For each={props.connections}>
            {(connection) => (
              <li>
                <button
                  onClick={() => props.onSelect(connection.path)}
                  class={`w-full text-left px-2 py-1 rounded text-sm ${themeColors[props.theme as ThemeMode].hover}`}
                >
                  {connection.path}
                </button>
              </li>
            )}
          </For>
        </ul>
      </div>
    </Show>
  );
};

export default RecentConnections; 