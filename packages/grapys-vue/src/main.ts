import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./index.css";
import { useCustomAgentStore } from "./store/customAgents";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

useCustomAgentStore(pinia).initialize();
app.mount("#app");
