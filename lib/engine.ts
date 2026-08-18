import type { Agent, AgentActivity, Building, BuildingType, Country, CountryId, Mood, Vec2, WeatherKind, WorldEvent, WorldState } from "./types";
import { clamp } from "./random";

const PAY: Record<string, number> = {doctor:18,teacher:10,developer:16,journalist:11,chef:9,shopkeeper:10,engineer:15,designer:12,driver:8,nurse:11,mechanic:10,banker:15,artist:8,police:12,builder:11,clerk:9,farmer:9,student:2,researcher:14,manager:17};

function dist(a: Vec2, b: Vec2) { return Math.hypot(a.x-b.x,a.y-b.y); }
function center(b: Building): Vec2 { return {x:b.entrance.x,y:b.entrance.y}; }
function byId(world: WorldState, id?: string) { return id ? world.buildings.find(b=>b.id===id) : undefined; }
function countryOf(world: WorldState, a: Agent) { return world.countries.find(c=>c.id===a.countryId)!; }
function buildingsOf(world: WorldState, cid: CountryId, type?: BuildingType) { return world.buildings.filter(b=>b.countryId===cid && (!type || b.type===type)); }
function stablePick<T>(items:T[], n:number):T|undefined { return items.length ? items[Math.abs(Math.floor(n)) % items.length] : undefined; }

function roadify(a: Vec2,b: Vec2, salt:number): Vec2[] {
  // Manhattan-style street walking creates visible city movement without expensive pathfinding.
  const midX = salt % 2 === 0 ? b.x : a.x;
  const midY = salt % 2 === 0 ? a.y : b.y;
  return [{x:midX,y:midY},{x:b.x,y:b.y}].filter((p,i,arr)=>i===0 || dist(p, arr[i-1]!)>4);
}

function setDestination(world:WorldState,a:Agent,b:Building|undefined,activity:AgentActivity) {
  if (!b) return;
  const from={x:a.x,y:a.y}; const to=center(b);
  a.destinationBuildingId=b.id; a.target=to; a.path=roadify(from,to,Number(a.id.split("-")[1]??0)); a.activity=activity;
}
function goHome(world:WorldState,a:Agent,activity:AgentActivity="home") { setDestination(world,a,byId(world,a.homeId),activity); }
function goWork(world:WorldState,a:Agent) { setDestination(world,a,byId(world,a.workId),"commute"); }
function goType(world:WorldState,a:Agent,type:BuildingType,activity:AgentActivity) {
  const pool=buildingsOf(world,a.countryId,type); setDestination(world,a,stablePick(pool, world.minute + parseInt(a.id.split("-")[1] || "0",36)),activity);
}

function chooseMood(a:Agent,c:Country):Mood {
  if (c.weather==="storm"||c.weather==="flood"||c.weather==="fire") return "worried";
  if (a.energy<25) return "tired";
  if (a.hunger>82) return "angry";
  if (a.money>700 && a.social>70) return "happy";
  if (a.activity==="work") return "focused";
  return "calm";
}

function decide(world:WorldState,a:Agent) {
  const hour=(world.minute/60)%24; const c=countryOf(world,a);
  a.lastDecisionAt=world.day*1440+world.minute;
  if (["storm","flood","fire"].includes(c.weather)) {
    a.thought=`${c.weather} is dangerous. I should get somewhere safe.`; goHome(world,a,"shelter"); return;
  }
  if (a.hunger>78) { a.thought="I'm hungry. Time to get something to eat."; goType(world,a,"cafe","eat"); return; }
  if (a.energy<20) { a.thought="I'm exhausted. Going home."; goHome(world,a,"home"); return; }
  if (hour>=23 || hour<6) { a.thought="It's late. I need sleep."; goHome(world,a,"sleep"); return; }
  if (hour>=8 && hour<17 && a.activity!=="work") { a.thought=`I should head to my ${a.job} duties.`; goWork(world,a); return; }
  if (hour>=17 && hour<22) {
    const k=(world.minute + parseInt(a.id.split("-")[1] || "0",36))%5;
    if (k===0) {a.thought="I want to see people.";goType(world,a,"park","socialize");return;}
    if (k===1 && a.money>20) {a.thought="I need a few things from the market.";goType(world,a,"market","shop");return;}
    if (k===2 && a.money>12) {a.thought="A cafe sounds good.";goType(world,a,"cafe","eat");return;}
    if (k===3) {a.thought="I'll take a walk around the city.";const pool=buildingsOf(world,a.countryId);setDestination(world,a,stablePick(pool,world.minute),"wander");return;}
    goHome(world,a,"home"); return;
  }
  if (!a.target) goHome(world,a,"home");
}

function arrive(world:WorldState,a:Agent) {
  const b=byId(world,a.destinationBuildingId);
  if (!b) {a.path=[];a.target=undefined;return;}
  if (b.id===a.workId) a.activity="work";
  else if (b.id===a.homeId && a.activity==="sleep") a.activity="sleep";
  else if (b.id===a.homeId) a.activity="home";
  a.target=undefined; a.path=[];
}

function stepMovement(world:WorldState,a:Agent,dtMinutes:number) {
  if (!a.path.length) return;
  const target=a.path[0]!; const dx=target.x-a.x,dy=target.y-a.y; const d=Math.hypot(dx,dy);
  const weather=countryOf(world,a).weather;
  const factor=weather==="rain"?.82:weather==="heat"?.88:weather==="storm"?.55:1;
  const max=a.speed*factor*dtMinutes/60;
  if (d<=Math.max(2,max)) {a.x=target.x;a.y=target.y;a.path.shift();if(!a.path.length) arrive(world,a);}
  else {a.x+=dx/d*max;a.y+=dy/d*max;}
}

function applyActivity(world:WorldState,a:Agent,dt:number) {
  const c=countryOf(world,a);
  a.hunger=clamp(a.hunger+dt*.018,0,100);
  if (a.activity==="sleep") a.energy=clamp(a.energy+dt*.09,0,100); else a.energy=clamp(a.energy-dt*.025,0,100);
  if (a.activity==="work") {a.money+=((PAY[a.job]??10)/60)*dt;a.social=clamp(a.social-dt*.006,0,100);}
  if (a.activity==="eat") {a.hunger=clamp(a.hunger-dt*.22,0,100);a.money=Math.max(0,a.money-dt*.04);}
  if (a.activity==="shop") a.money=Math.max(0,a.money-dt*.06);
  if (a.activity==="socialize") a.social=clamp(a.social+dt*.1,0,100);
  if (a.activity==="home") a.energy=clamp(a.energy+dt*.018,0,100);
  if (c.weather==="heat") a.energy=clamp(a.energy-dt*.014,0,100);
  a.mood=chooseMood(a,c);
}

function nearbySocial(world:WorldState,a:Agent) {
  const now=world.day*1440+world.minute;
  if (now-a.lastSocialAt<45 || a.path.length>0) return;
  const b=world.agents.find(o=>o.id!==a.id && o.countryId===a.countryId && !o.path.length && dist(a,o)<42 && now-o.lastSocialAt>30);
  if (!b) return;
  a.lastSocialAt=now;b.lastSocialAt=now;
  a.social=clamp(a.social+7,0,100);b.social=clamp(b.social+7,0,100);
  if (!a.friends.includes(b.id) && ((parseInt(a.id.split("-")[1] || "0",36)+world.day)%3===0)) a.friends.push(b.id);
  const topics=["work","today's weather","prices in the market","a funny local story","plans for the evening","what people are posting online"];
  const topic=topics[(world.minute+parseInt(a.id.split("-")[1] || "0",36))%topics.length]!;
  world.messages.unshift({id:`dm-${world.day}-${world.minute}-${a.id}`,fromId:a.id,toId:b.id,fromName:a.name,toName:b.name,at:world.day*1440+world.minute,text:`We ran into each other and talked about ${topic}.`});
  world.messages=world.messages.slice(0,120);
}

function passiveSocial(world:WorldState) {
  if (world.minute%90>2) return;
  const index=(world.day*17+Math.floor(world.minute/90)*13)%world.agents.length;
  const a=world.agents[index]!;
  const now=world.day*1440+world.minute;
  if (now-a.lastSocialAt<35) return;
  const lines=[
    `A normal day in ${countryOf(world,a).capital}. ${a.job} life keeps me busy.`,
    `Current mood: ${a.mood}. Thinking about how to ${a.goal}.`,
    `${countryOf(world,a).weather === "clear" ? "Beautiful weather today" : `The ${countryOf(world,a).weather} is changing everyone's plans`}.`,
    `Just finished some ${a.activity}. The city feels alive today.`
  ];
  world.posts.unshift({id:`p-${world.day}-${world.minute}-${a.id}`,network:"insta",authorId:a.id,authorName:a.name,at:world.day*1440+world.minute,text:lines[(index+world.minute)%lines.length]!,likes:(index*7)%21,comments:[]});
  world.posts=world.posts.slice(0,160); a.lastSocialAt=now;
}

export function tickWorld(world:WorldState, realSeconds:number):WorldState {
  if (world.speed===0) return world;
  const dtMinutes=Math.min(3, realSeconds*world.speed*2.4);
  world.minute+=dtMinutes;
  while(world.minute>=1440){world.minute-=1440;world.day++;world.events.unshift({id:`day-${world.day}`,at:world.day*1440,type:"day",text:`Day ${world.day} has begun.`});}
  for (const c of world.countries) if(c.weather!=="clear" && world.day*1440+world.minute>=c.weatherUntil){c.weather="clear";world.events.unshift({id:`weather-clear-${c.id}-${world.day}-${Math.floor(world.minute)}`,at:world.day*1440+world.minute,countryId:c.id,type:"weather",text:`Weather in ${c.name} returned to normal.`});}
  for (const a of world.agents) {
    stepMovement(world,a,dtMinutes*60);
    applyActivity(world,a,dtMinutes);
    const now=world.day*1440+world.minute;
    if (!a.path.length && now-a.lastDecisionAt>22+(parseInt(a.id.split("-")[1] || "0",36)%17)) decide(world,a);
    nearbySocial(world,a);
  }
  passiveSocial(world);
  return world;
}

export function triggerWeather(world:WorldState,countryId:CountryId,kind:WeatherKind,durationHours=6) {
  const c=world.countries.find(x=>x.id===countryId); if(!c)return;
  c.weather=kind;c.weatherUntil=world.day*1440+world.minute+durationHours*60;
  if(kind==="flood") {c.food=Math.max(0,c.food-12);c.happiness=Math.max(0,c.happiness-7);}
  if(kind==="fire") {c.energy=Math.max(0,c.energy-10);c.happiness=Math.max(0,c.happiness-9);}
  if(kind==="storm") c.energy=Math.max(0,c.energy-7);
  const text=`${kind.toUpperCase()} started in ${c.name}. Citizens are reacting autonomously.`;
  const e:WorldEvent={id:`e-${Date.now()}`,at:world.day*1440+world.minute,countryId,type:kind,text};world.events.unshift(e);world.events=world.events.slice(0,150);
  for(const a of world.agents.filter(x=>x.countryId===countryId)){a.lastDecisionAt=-999;a.memories.unshift({id:e.id+"-"+a.id,at:e.at,text,importance:kind==="rain"?3:8});a.memories=a.memories.slice(0,12);}
}

export function triggerEconomy(world:WorldState,countryId:CountryId,boom:boolean){
  const c=world.countries.find(x=>x.id===countryId);if(!c)return;
  c.treasury+=boom?25000:-18000;c.happiness=clamp(c.happiness+(boom?6:-7),0,100);
  for(const a of world.agents.filter(x=>x.countryId===countryId)){a.money=Math.max(0,a.money*(boom?1.08:.92));}
  world.events.unshift({id:`eco-${Date.now()}`,at:world.day*1440+world.minute,countryId,type:"economy",text:`${c.name} entered an economic ${boom?"boom":"crisis"}.`});
}

export function sendAgentToType(world:WorldState,agentId:string,type:BuildingType){
  const a=world.agents.find(x=>x.id===agentId);if(!a)return;goType(world,a,type,"wander");a.thought=`I decided to go to a ${type}.`;
}
