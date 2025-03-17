import { Show } from "solid-js";
import { ThemeMode } from "../types/theme.ts";
import { themeColors } from "../utils/theme.ts";

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; description: string }[];
}

export default function HelpDialog(props: HelpDialogProps) {
  const shortcuts: ShortcutGroup[] = [
    {
      title: "Navigation",
      shortcuts: [
        { key: "Ctrl+Q", description: "Focus query editor" },
        { key: "Ctrl+R", description: "Focus results table" },
        { key: "Ctrl+T", description: "Focus tables list" },
        { key: "Ctrl+H", description: "Show this help dialog" },
        { key: "Esc", description: "Close dialogs or sidebar" }
      ]
    },
    {
      title: "Tables Navigation",
      shortcuts: [
        { key: "↑ / ↓", description: "Navigate between tables" },
        { key: "Space", description: "Select table (moves to query editor)" }
      ]
    },
    {
      title: "Query Execution",
      shortcuts: [
        { key: "Ctrl+Enter", description: "Execute current query" }
      ]
    },
    {
      title: "Results Navigation",
      shortcuts: [
        { key: "↑ / ↓", description: "Navigate between rows" },
        { key: "Space", description: "Toggle detail sidebar for selected row" },
        { key: "Ctrl+C", description: "Copy results as JSON" },
        { key: "Ctrl+S", description: "Export results as JSON" }
      ]
    }
  ];

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div class={`${themeColors[props.theme].background} ${themeColors[props.theme].text} border ${themeColors[props.theme].border} rounded-lg shadow-xl p-8 max-w-2xl max-h-[90vh] overflow-y-auto`}>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Keyboard Shortcuts</h2>
            <button 
              type="button"
              onClick={props.onClose}
              class={`p-2 rounded-full ${themeColors[props.theme].hover}`}
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="space-y-8">
            {shortcuts.map(group => (
              <div>
                <h3 class={`text-xl font-medium mb-4 ${themeColors[props.theme].headerText}`}>
                  {group.title}
                </h3>
                <div class={`border ${themeColors[props.theme].border} rounded-md overflow-hidden`}>
                  <table class={`min-w-full divide-y ${themeColors[props.theme].divider}`}>
                    <tbody class={`divide-y ${themeColors[props.theme].divider}`}>
                      {group.shortcuts.map(shortcut => (
                        <tr>
                          <td class={`px-4 py-3 ${themeColors[props.theme].tableHead} font-mono font-medium whitespace-nowrap`}>
                            {shortcut.key}
                          </td>
                          <td class={`px-4 py-3 ${themeColors[props.theme].tableRow}`}>
                            {shortcut.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Show>
  );
} 