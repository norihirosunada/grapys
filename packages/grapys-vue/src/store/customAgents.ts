import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { AgentProfile, CustomAgentBundle } from "../utils/gui/type";
import { agentProfiles, agentProfilesCategory, mergeCustomAgentProfiles } from "../utils/gui/data";

const STORAGE_KEY = "GRAPYS_CUSTOM_AGENTS";
export const CUSTOM_AGENT_SCHEMA_VERSION = 1;

const hasWindow = typeof window !== "undefined";

export const useCustomAgentStore = defineStore("customAgent", () => {
  const customCategories = ref<Record<string, Record<string, AgentProfile>>>({});
  const revision = ref(0);

  const touchRevision = () => {
    revision.value += 1;
  };

  const bundle = computed<CustomAgentBundle>(() => ({
    version: CUSTOM_AGENT_SCHEMA_VERSION,
    categories: customCategories.value,
  }));

  const mergedCategories = computed(() => {
    // Depend on revision to re-render consumers when categories change.
    revision.value;
    return agentProfilesCategory;
  });

  const mergedProfiles = computed(() => {
    revision.value;
    return agentProfiles;
  });

  const persist = (version = CUSTOM_AGENT_SCHEMA_VERSION) => {
    if (!hasWindow) {
      return;
    }
    const payload: CustomAgentBundle = { version, categories: customCategories.value };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const applyBundle = (payload?: CustomAgentBundle) => {
    if (!payload?.categories) {
      return;
    }
    customCategories.value = { ...customCategories.value, ...payload.categories };
    mergeCustomAgentProfiles(payload.categories);
    touchRevision();
    persist(payload.version ?? CUSTOM_AGENT_SCHEMA_VERSION);
  };

  const initialize = () => {
    if (!hasWindow) {
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomAgentBundle;
        applyBundle(parsed);
      }
    } catch (error) {
      console.warn("Failed to load custom agents", error);
    }
  };

  const upsertAgent = (categoryId: string, agentId: string, profile: AgentProfile) => {
    const nextCategory = { ...(customCategories.value[categoryId] ?? {}), [agentId]: profile };
    customCategories.value = { ...customCategories.value, [categoryId]: nextCategory };
    mergeCustomAgentProfiles({ [categoryId]: { [agentId]: profile } });
    touchRevision();
    persist();
  };

  return {
    bundle,
    mergedCategories,
    mergedProfiles,
    applyBundle,
    initialize,
    upsertAgent,
  };
});
