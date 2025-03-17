import { For, Show } from "solid-js";
import { ConnectionHistory } from "../types.ts";

interface RecentConnectionsProps {
  connections: ConnectionHistory[];
  onSelect: (path: string) => void;
  theme: 'light' | 'dark';
}

export const RecentConnections = (props: RecentConnectionsProps) => {
  return (
    <Show when={props.connections.length > 0}>
      <div class="mt-4">
        <h3 class={`text-sm font-medium ${props.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          Recent Connections
        </h3>
        <ul class={`space-y-1 ${props.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <For each={props.connections}>
            {(connection) => (
              <li>
                <button
                  onClick={() => props.onSelect(connection.path)}
                  class={`w-full text-left px-2 py-1 rounded text-sm ${props.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-100'}`}
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