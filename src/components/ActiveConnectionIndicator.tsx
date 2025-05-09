import { ThemeMode } from "../types/theme.ts";
import { themeColors } from "../utils/theme.ts";

interface ActiveConnectionIndicatorProps {
  connectionName: string;
  connectionType: "sqlite" | "libsql";
  theme: ThemeMode;
  onClick?: () => void;
  color?: string;
}

export const ActiveConnectionIndicator = (props: ActiveConnectionIndicatorProps) => {
  const getDisplayName = () => {
    try {
      return props.connectionType === "sqlite"
        ? props.connectionName.split("/").pop() || props.connectionName
        : new URL(props.connectionName).hostname;
    } catch (err) {
      console.error("Error parsing connection name:", err);
      return props.connectionName || "Unknown";
    }
  };

  // Default color based on connection type if no custom color is provided
  const defaultColor = props.connectionType === "sqlite" 
    ? "#0d9488" // Teal
    : "#3b82f6"; // Blue
  
  const backgroundColor = props.color || defaultColor;
  
  // Style with custom background color
  const indicatorStyle = { 
    backgroundColor: backgroundColor || defaultColor,
    opacity: 0.95,
    transition: "background-color 0.3s ease"
  };

  return (
    <div class="w-full flex items-center justify-between">
      <div 
        class="flex-1 flex items-center px-4 py-2 cursor-pointer hover:opacity-100 transition-all"
        onClick={props.onClick}
        title={props.connectionName}
        style={indicatorStyle}
      >
        <span class="material-icons text-sm text-white mr-2">
          {props.connectionType === "sqlite" ? "storage" : "cloud"}
        </span>
        <span class="text-sm font-medium truncate text-white">
          {getDisplayName()}
        </span>
        <span class="ml-3 text-xs px-2 py-0.5 rounded bg-black bg-opacity-20 text-white">
          {props.connectionType === "sqlite" ? "SQLite" : "LibSQL"}
        </span>
      </div>
    </div>
  );
};

export default ActiveConnectionIndicator; 