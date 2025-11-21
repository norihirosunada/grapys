import { agentProfiles, agentProfilesCategory } from "./data";
import type { AgentProfile, AgentProfileRegistry } from "./type";

export const mergeAgentProfileCatalog = (registry: AgentProfileRegistry = {}) => {
  const categories = {
    ...agentProfilesCategory,
    ...(Object.keys(registry).length ? { custom: registry } : {}),
  } satisfies Record<string, Record<string, AgentProfile>>;

  const profiles = { ...agentProfiles, ...registry } satisfies Record<string, AgentProfile>;

  return {
    categories,
    profiles,
  };
};
