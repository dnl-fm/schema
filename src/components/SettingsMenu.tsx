import { For, Show } from "solid-js";
import { AppSettings } from "../types.ts";
import { themeColors } from "../utils/theme.ts";
import { ThemeMode } from "../types/theme.ts";

interface SettingsMenuProps {
  settings: AppSettings;
  onSave: (key: keyof AppSettings, value: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const SettingsMenu = (props: SettingsMenuProps) => {
  const fontFamilies = ['monospace', 'sans-serif', 'serif'];
  const fontSizes = ['12', '14', '16', '18', '20'];
  const theme = props.settings.theme as ThemeMode;

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div class={`${themeColors[theme].background} ${themeColors[theme].text} border ${themeColors[theme].border} rounded-lg shadow-xl p-6 w-96`}>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Settings</h2>
            <button 
              onClick={props.onClose}
              class={`p-1 rounded-full ${themeColors[theme].hover}`}
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-4">
            {/* Font Size */}
            <div>
              <label class={`block text-sm font-medium ${themeColors[theme].headerText} mb-1`}>
                Font Size
              </label>
              <select
                value={props.settings.fontSize}
                onChange={(e) => props.onSave('fontSize', e.currentTarget.value)}
                class={`w-full border ${themeColors[theme].inputBg} ${themeColors[theme].border} ${themeColors[theme].text} rounded px-3 py-2`}
              >
                <For each={fontSizes}>
                  {(size) => (
                    <option value={size}>{size}px</option>
                  )}
                </For>
              </select>
            </div>

            {/* Font Family */}
            <div>
              <label class={`block text-sm font-medium ${themeColors[theme].headerText} mb-1`}>
                Font Family
              </label>
              <select
                value={props.settings.fontFamily}
                onChange={(e) => props.onSave('fontFamily', e.currentTarget.value)}
                class={`w-full border ${themeColors[theme].inputBg} ${themeColors[theme].border} ${themeColors[theme].text} rounded px-3 py-2`}
              >
                <For each={fontFamilies}>
                  {(family) => (
                    <option value={family}>{family}</option>
                  )}
                </For>
              </select>
            </div>

            {/* Theme */}
            <div>
              <label class={`block text-sm font-medium ${themeColors[theme].headerText} mb-1`}>
                Theme
              </label>
              <div class="flex flex-col space-y-2">
                <label class="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={props.settings.theme === 'light'}
                    onChange={(e) => props.onSave('theme', e.currentTarget.value)}
                    class="mr-2"
                  />
                  Light
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={props.settings.theme === 'dark'}
                    onChange={(e) => props.onSave('theme', e.currentTarget.value)}
                    class="mr-2"
                  />
                  Dark
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="tokyo"
                    checked={props.settings.theme === 'tokyo'}
                    onChange={(e) => props.onSave('theme', e.currentTarget.value)}
                    class="mr-2"
                  />
                  Tokyo
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SettingsMenu; 