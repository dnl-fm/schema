import { For, Show } from "solid-js";
import { AppSettings } from "../types.ts";

interface SettingsMenuProps {
  settings: AppSettings;
  onSave: (key: keyof AppSettings, value: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const SettingsMenu = (props: SettingsMenuProps) => {
  const fontFamilies = ['monospace', 'sans-serif', 'serif'];
  const fontSizes = ['12', '14', '16', '18', '20'];

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div class={`${props.settings.theme === 'dark' ? 'bg-black text-white border border-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6 w-96`}>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Settings</h2>
            <button 
              onClick={props.onClose}
              class={`p-1 rounded-full ${props.settings.theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-100'}`}
            >
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="space-y-4">
            {/* Font Size */}
            <div>
              <label class={`block text-sm font-medium ${props.settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Font Size
              </label>
              <select
                value={props.settings.fontSize}
                onChange={(e) => props.onSave('fontSize', e.currentTarget.value)}
                class={`w-full border ${props.settings.theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-white border-gray-300 text-black'} rounded px-3 py-2`}
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
              <label class={`block text-sm font-medium ${props.settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Font Family
              </label>
              <select
                value={props.settings.fontFamily}
                onChange={(e) => props.onSave('fontFamily', e.currentTarget.value)}
                class={`w-full border ${props.settings.theme === 'dark' ? 'bg-black border-gray-800 text-white' : 'bg-white border-gray-300 text-black'} rounded px-3 py-2`}
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
              <label class={`block text-sm font-medium ${props.settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Theme
              </label>
              <div class="flex space-x-4">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SettingsMenu; 