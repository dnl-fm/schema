/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App.tsx";
import "./index.css";
import "./styles.css";
import "./styles/tokyo-theme.css";

render(() => <App />, document.getElementById("root") as HTMLElement);
