export type Vec2 = { x: number; y: number };
export type CountryId = "astra" | "boreal" | "cyra" | "doran" | "elyra";
export type BuildingType = "home" | "office" | "shop" | "cafe" | "hospital" | "school" | "government" | "media" | "market" | "park" | "factory";
export type AgentActivity = "sleep" | "home" | "work" | "eat" | "shop" | "socialize" | "wander" | "commute" | "shelter" | "hospital";
export type Mood = "happy" | "calm" | "focused" | "tired" | "worried" | "angry" | "excited";
export type WeatherKind = "clear" | "rain" | "heat" | "storm" | "flood" | "fire";

export interface Country {
  id: CountryId;
  name: string;
  capital: string;
  x: number;
  y: number;
  w: number;
  h: number;
  treasury: number;
  food: number;
  energy: number;
  happiness: number;
  weather: WeatherKind;
  weatherUntil: number;
}

export interface Building {
  id: string;
  countryId: CountryId;
  type: BuildingType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  entrance: Vec2;
}

export interface MemoryItem {
  id: string;
  at: number;
  text: string;
  importance: number;
}

export interface Agent {
  id: string;
  name: string;
  age: number;
  countryId: CountryId;
  job: string;
  personality: string;
  goal: string;
  x: number;
  y: number;
  speed: number;
  money: number;
  energy: number;
  hunger: number;
  social: number;
  mood: Mood;
  activity: AgentActivity;
  homeId: string;
  workId: string;
  destinationBuildingId?: string;
  target?: Vec2;
  path: Vec2[];
  friends: string[];
  memories: MemoryItem[];
  lastDecisionAt: number;
  lastSocialAt: number;
  aiCooldownUntil: number;
  thought: string;
}

export interface SocialPost {
  id: string;
  network: "insta" | "aiogram" | "news";
  authorId: string;
  authorName: string;
  at: number;
  text: string;
  likes: number;
  comments: { id: string; authorId: string; authorName: string; text: string }[];
}

export interface DirectMessage {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  at: number;
  text: string;
}

export interface WorldEvent {
  id: string;
  at: number;
  countryId?: CountryId;
  type: string;
  text: string;
}

export interface WorldState {
  version: 2;
  seed: number;
  minute: number;
  day: number;
  speed: 0 | 1 | 5 | 20;
  aiBrain: boolean;
  aiLastPulse: number;
  countries: Country[];
  buildings: Building[];
  agents: Agent[];
  posts: SocialPost[];
  messages: DirectMessage[];
  events: WorldEvent[];
}

export interface AiAction {
  agentId: string;
  action: "post" | "dm" | "comment" | "thought" | "go";
  text: string;
  targetAgentId?: string;
  destinationType?: BuildingType;
}
