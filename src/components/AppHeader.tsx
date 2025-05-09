import { Show } from "solid-js";
import { ThemeMode } from "../types/theme.ts";
import { themeColors } from "../utils/theme.ts";
import ActiveConnectionIndicator from "./ActiveConnectionIndicator.tsx";

interface AppHeaderProps {
  isConnected: boolean;
  connectionName?: string;
  connectionType?: "sqlite" | "libsql";
  theme: ThemeMode;
  onShowConnection: () => void;
}

export const AppHeader = (props: AppHeaderProps) => {
  return (
    <header class={`px-4 py-2 border-b ${themeColors[props.theme].sidebarBorder} flex items-center justify-between`}>
      <div class="flex items-center">
        <h1 class="text-lg font-bold mr-4">Schema</h1>
      </div>
      
      <Show 
        when={props.isConnected && props.connectionName && props.connectionType}
        fallback={
          <div class="text-sm opacity-70">No active connection</div>
        }
      >
        <ActiveConnectionIndicator 
          connectionName={props.connectionName || ""}
          connectionType={props.connectionType || "sqlite"}
          theme={props.theme}
          onClick={props.onShowConnection}
        />
      </Show>
    </header>
  );
};

export default AppHeader; 