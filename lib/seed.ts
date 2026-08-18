import type { Agent, Building, BuildingType, Country, CountryId, WorldState } from "./types";
import { id, mulberry32, pick } from "./random";

const COUNTRY_META: Array<[CountryId, string, string, number, number, number, number]> = [
  ["astra", "Astra", "Solara", 140, 120, 1120, 820],
  ["boreal", "Boreal", "Nordis", 1380, 100, 1120, 850],
  ["cyra", "Cyra", "Lumis", 2640, 160, 1120, 820],
  ["doran", "Doran", "Verdan", 520, 1260, 1240, 860],
  ["elyra", "Elyra", "Novara", 2140, 1240, 1340, 880]
];

const FIRST = ["Aziz","Malika","Sardor","Laylo","Kamron","Zarina","Jasur","Dilnoza","Amir","Madina","Bekzod","Nilufar","Rustam","Shahnoza","Timur","Sevara","Akmal","Lola","Otabek","Rayhona","Samir","Mira","Davron","Nodira","Yusuf","Amina","Farruh","Sabina","Anvar","Aziza"];
const LAST = ["Karimov","Saidova","Nazarov","Rahimova","Yuldashev","Tursunova","Akbarov","Mirzaeva","Hoshimov","Salimova"];
const JOBS = ["doctor","teacher","developer","journalist","chef","shopkeeper","engineer","designer","driver","nurse","mechanic","banker","artist","police","builder","clerk","farmer","student","researcher","manager"];
const PERSONALITIES = ["curious and friendly","quiet and observant","ambitious and competitive","kind and social","practical and cautious","creative and impulsive","disciplined and loyal","funny and talkative","independent and stubborn","optimistic and helpful"];
const GOALS = ["save money for a better home","become respected in society","build a successful career","make more close friends","start a small business","help their family","become famous online","learn something new","improve their country","live a calm happy life"];

function buildingName(type: BuildingType, country: string, n: number) {
  const label: Record<BuildingType,string> = {home:"Residence",office:"Office",shop:"Shop",cafe:"Cafe",hospital:"Hospital",school:"School",government:"Government",media:"Media",market:"Market",park:"Park",factory:"Factory"};
  return `${country} ${label[type]} ${n}`;
}

function makeBuildings(country: Country, r: () => number): Building[] {
  const list: Building[] = [];
  const road = 82;
  let n = 0;
  const special: BuildingType[] = ["government","hospital","school","media","market","cafe","park","factory"];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 8; col++) {
      const bx = country.x + 80 + col * 125;
      const by = country.y + 72 + row * 116;
      if (bx + 82 > country.x + country.w - 30 || by + 72 > country.y + country.h - 30) continue;
      let type: BuildingType;
      if (n < special.length) type = special[n]!;
      else {
        const q = r();
        type = q < .43 ? "home" : q < .65 ? "office" : q < .77 ? "shop" : q < .85 ? "cafe" : q < .93 ? "factory" : "park";
      }
      const w = type === "park" ? 88 : 72 + Math.floor(r()*16);
      const h = type === "park" ? 74 : 58 + Math.floor(r()*14);
      list.push({
        id: `${country.id}-b-${n}`,
        countryId: country.id,
        type,
        name: buildingName(type, country.name, n + 1),
        x: bx + (col % 2) * 6,
        y: by + (row % 2) * 5,
        w,
        h,
        entrance: { x: bx + w / 2, y: by + h + Math.min(18, road / 3) }
      });
      n++;
    }
  }
  return list;
}

function workType(job: string): BuildingType {
  if (["doctor","nurse"].includes(job)) return "hospital";
  if (["teacher","student","researcher"].includes(job)) return "school";
  if (job === "journalist") return "media";
  if (["chef"].includes(job)) return "cafe";
  if (["shopkeeper","banker"].includes(job)) return "shop";
  if (["builder","mechanic","engineer"].includes(job)) return "factory";
  if (["police","clerk"].includes(job)) return "government";
  return "office";
}

export function createWorld(seed = 260818): WorldState {
  const r = mulberry32(seed);
  const countries: Country[] = COUNTRY_META.map(([cid,name,capital,x,y,w,h]) => ({
    id: cid, name, capital, x, y, w, h, treasury: 100000, food: 100, energy: 100, happiness: 72, weather: "clear", weatherUntil: 0
  }));
  const buildings = countries.flatMap(c => makeBuildings(c, r));
  const agents: Agent[] = [];
  let idx = 0;
  for (const country of countries) {
    const cb = buildings.filter(b => b.countryId === country.id);
    const homes = cb.filter(b => b.type === "home");
    for (let i=0;i<20;i++) {
      const job = JOBS[(i + Math.floor(r()*JOBS.length)) % JOBS.length]!;
      const home = homes[i % homes.length] ?? cb[0]!;
      const desired = workType(job);
      const workplaces = cb.filter(b => b.type === desired);
      const work = workplaces[i % workplaces.length] ?? cb.find(b => b.type === "office") ?? cb[0]!;
      const name = `${FIRST[(idx*7 + i*3) % FIRST.length]} ${LAST[(idx+i) % LAST.length]}`;
      agents.push({
        id: id("a", idx), name, age: 18 + Math.floor(r()*45), countryId: country.id, job,
        personality: pick(PERSONALITIES, r), goal: pick(GOALS, r),
        x: home.entrance.x + (r()-.5)*20, y: home.entrance.y + (r()-.5)*20,
        speed: 22 + r()*14, money: 80 + Math.floor(r()*900), energy: 65 + r()*35, hunger: 15 + r()*30, social: 40 + r()*50,
        mood: "calm", activity: "home", homeId: home.id, workId: work.id,
        path: [], friends: [], memories: [], lastDecisionAt: -999, lastSocialAt: -999, aiCooldownUntil: 0, thought: "Starting a new day."
      });
      idx++;
    }
  }
  // Seed friendships inside each country.
  for (const a of agents) {
    const peers = agents.filter(p => p.countryId === a.countryId && p.id !== a.id);
    a.friends = [peers[(parseInt(a.id.split("-")[1] || "0",36)+3)%peers.length]!.id, peers[(parseInt(a.id.split("-")[1] || "0",36)+8)%peers.length]!.id];
  }
  return {
    version: 2, seed, minute: 7*60+30, day: 1, speed: 1, aiBrain: true, aiLastPulse: -999,
    countries, buildings, agents, posts: [], messages: [], events: [{id:"welcome",at:0,type:"system",text:"AI Earth Ultra was born. 100 autonomous citizens entered the world."}]
  };
}
