export type Vec2 = { x: number; z: number };
export type CountryId = "zarrin" | "koksaroy" | "sahro" | "navbahor" | "oqsoy";
export type BuildingType = "uy" | "ofis" | "dokon" | "kafe" | "shifoxona" | "maktab" | "hukumat" | "media" | "bozor" | "park" | "zavod";
export type AgentActivity = "uxlash" | "uyda" | "ish" | "ovqat" | "xarid" | "suhbat" | "sayr" | "yolda" | "panoh" | "shifoxona";
export type Mood = "xursand" | "xotirjam" | "diqqatli" | "charchagan" | "xavotirli" | "jahldor" | "hayajonli";
export type WeatherKind = "ochiq" | "yomgir" | "issiq" | "boron" | "toshqin" | "yongin" | "qor";
export type Network = "insta" | "aiogram" | "yangilik";
export interface Country {
  id: CountryId; name: string; capital: string; center: Vec2; polygon: Vec2[]; color: string;
  treasury: number; food: number; energy: number; happiness: number; weather: WeatherKind; weatherUntil: number;
}
export interface Building {
  id: string; countryId: CountryId; type: BuildingType; name: string; x: number; z: number; w: number; d: number; floors: number; entrance: Vec2;
}
export interface MemoryItem { id: string; at: number; text: string; importance: number; }
export interface Agent {
  id: string; name: string; age: number; countryId: CountryId; job: string; personality: string; goal: string;
  x: number; z: number; speed: number; money: number; energy: number; hunger: number; social: number; mood: Mood; activity: AgentActivity;
  homeId: string; workId: string; destinationBuildingId?: string; target?: Vec2; path: Vec2[]; friends: string[]; memories: MemoryItem[];
  lastDecisionAt: number; lastSocialAt: number; aiCooldownUntil: number; thought: string; heading: number;
}
export interface Comment { id: string; authorId: string; authorName: string; text: string; at: number; }
export interface SocialPost { id: string; network: Network; authorId: string; authorName: string; at: number; text: string; likes: number; comments: Comment[]; }
export interface DirectMessage { id: string; fromId: string; toId: string; fromName: string; toName: string; at: number; text: string; }
export interface WorldEvent { id: string; at: number; countryId?: CountryId; type: string; text: string; }
export interface WorldState {
  version: 3; seed: number; minute: number; day: number; speed: 0 | 1 | 5 | 20; aiBrain: boolean; aiLastPulse: number;
  countries: Country[]; buildings: Building[]; agents: Agent[]; posts: SocialPost[]; messages: DirectMessage[]; events: WorldEvent[];
}
export interface AiAction { agentId: string; action: "post" | "dm" | "comment" | "thought" | "go"; text: string; targetAgentId?: string; destinationType?: BuildingType; }
