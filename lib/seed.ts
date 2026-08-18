import type { Agent, Building, BuildingType, Country, CountryId, WorldState } from "./types";
import { mulberry32, pick, uid } from "./random";
import { countryPolygon, isLand } from "./terrain";

const COUNTRY_META: Array<[CountryId,string,string,number,number,string]> = [
  ["zarrin","Zarrin Respublikasi","Zarshahar",-185,-85,"#d9b85c"],
  ["koksaroy","Ko‘ksaroy Davlati","Ko‘kent",165,-92,"#68a9d8"],
  ["sahro","Sahro Ittifoqi","Nurqal’a",0,30,"#d78a5b"],
  ["navbahor","Navbahor Respublikasi","Bahorobod",-170,120,"#6ebd7b"],
  ["oqsoy","Oqsoy Qirolligi","Oqtosh",160,118,"#a89ad9"]
];
const FIRST=["Aziz","Malika","Sardor","Laylo","Kamron","Zarina","Jasur","Dilnoza","Amir","Madina","Bekzod","Nilufar","Rustam","Shahnoza","Temur","Sevara","Akmal","Lola","Otabek","Rayhona","Samir","Mira","Davron","Nodira","Yusuf","Amina","Farruh","Sabina","Anvar","Aziza"];
const LAST=["Karimov","Saidova","Nazarov","Rahimova","Yo‘ldoshev","Tursunova","Akbarov","Mirzayeva","Hoshimov","Salimova"];
const JOBS=["shifokor","o‘qituvchi","dasturchi","jurnalist","oshpaz","sotuvchi","muhandis","dizayner","haydovchi","hamshira","mexanik","bankir","rassom","politsiyachi","quruvchi","davlat xizmatchisi","dehqon","talaba","tadqiqotchi","menejer"];
const PERSONALITIES=["qiziquvchan va do‘stona","sokin va kuzatuvchan","maqsadli va raqobatbardosh","mehribon va kirishimli","ehtiyotkor va amaliy","ijodkor va tezkor","intizomli va sodiq","hazilkash va gapdon","mustaqil va qaysar","optimist va yordamchi"];
const GOALS=["yaxshiroq uy uchun pul yig‘ish","jamiyatda hurmat qozonish","kuchli karyera qurish","yaqin do‘stlar orttirish","kichik biznes ochish","oilasiga yordam berish","ijtimoiy tarmoqda mashhur bo‘lish","yangi bilim o‘rganish","davlatini rivojlantirish","tinch va baxtli yashash"];
const TYPE_LABEL:Record<BuildingType,string>={uy:"Uy",ofis:"Ofis",dokon:"Do‘kon",kafe:"Kafe",shifoxona:"Shifoxona",maktab:"Maktab",hukumat:"Hukumat",media:"Media",bozor:"Bozor",park:"Park",zavod:"Zavod"};
function workType(job:string):BuildingType{if(["shifokor","hamshira"].includes(job))return"shifoxona";if(["o‘qituvchi","talaba","tadqiqotchi"].includes(job))return"maktab";if(job==="jurnalist")return"media";if(job==="oshpaz")return"kafe";if(["sotuvchi","bankir"].includes(job))return"dokon";if(["quruvchi","mexanik","muhandis"].includes(job))return"zavod";if(["politsiyachi","davlat xizmatchisi"].includes(job))return"hukumat";return"ofis";}
function makeBuildings(country:Country,r:()=>number):Building[]{
  const list:Building[]=[];let n=0;const specials:BuildingType[]=["hukumat","shifoxona","maktab","media","bozor","kafe","park","zavod"];
  for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++){
    if(Math.abs(row)===3&&Math.abs(col)===3)continue;
    const x=country.center.x+col*25+(row%2)*3;const z=country.center.z+row*23+(col%2)*2;
    if(!isLand(x,z))continue;
    let type:BuildingType;if(n<specials.length)type=specials[n]!;else{const q=r();type=q<.42?"uy":q<.62?"ofis":q<.73?"dokon":q<.82?"kafe":q<.9?"zavod":"park";}
    const w=type==="park"?17:10+r()*5,d=type==="park"?15:9+r()*5;const floors=type==="ofis"?3+Math.floor(r()*5):type==="hukumat"?4:type==="shifoxona"?3:type==="uy"?1+Math.floor(r()*2):1+Math.floor(r()*3);
    list.push({id:`${country.id}-b-${n}`,countryId:country.id,type,name:`${country.capital} ${TYPE_LABEL[type]} ${n+1}`,x,z,w,d,floors,entrance:{x,z:z+d*.7}});n++;
  }return list;
}
export function createWorld(seed=260818):WorldState{
  const r=mulberry32(seed);
  const countries:Country[]=COUNTRY_META.map(([id,name,capital,x,z,color])=>({id,name,capital,center:{x,z},polygon:countryPolygon(id),color,treasury:100000,food:100,energy:100,happiness:72,weather:"ochiq",weatherUntil:0}));
  const buildings=countries.flatMap(c=>makeBuildings(c,r));const agents:Agent[]=[];let idx=0;
  for(const country of countries){const cb=buildings.filter(b=>b.countryId===country.id),homes=cb.filter(b=>b.type==="uy");
    for(let i=0;i<20;i++){const job=JOBS[(i+Math.floor(r()*JOBS.length))%JOBS.length]!;const home=homes[i%homes.length]??cb[0]!;const wt=workType(job);const works=cb.filter(b=>b.type===wt);const work=works[i%works.length]??cb.find(b=>b.type==="ofis")??cb[0]!;const name=`${FIRST[(idx*7+i*3)%FIRST.length]} ${LAST[(idx+i)%LAST.length]}`;
      agents.push({id:uid("a",idx),name,age:18+Math.floor(r()*45),countryId:country.id,job,personality:pick(PERSONALITIES,r),goal:pick(GOALS,r),x:home.entrance.x+(r()-.5)*3,z:home.entrance.z+(r()-.5)*3,speed:9+r()*5,money:80+Math.floor(r()*900),energy:65+r()*35,hunger:15+r()*30,social:40+r()*50,mood:"xotirjam",activity:"uyda",homeId:home.id,workId:work.id,path:[],friends:[],memories:[],lastDecisionAt:-999,lastSocialAt:-999,aiCooldownUntil:0,thought:"Yangi kunni boshlayapman.",heading:0});idx++;}
  }
  for(const a of agents){const peers=agents.filter(p=>p.countryId===a.countryId&&p.id!==a.id);const n=parseInt(a.id.split("-")[1]||"0",36);a.friends=[peers[(n+3)%peers.length]!.id,peers[(n+8)%peers.length]!.id,peers[(n+12)%peers.length]!.id];}
  return{version:3,seed,minute:7*60+30,day:1,speed:1,aiBrain:true,aiLastPulse:-999,countries,buildings,agents,posts:[],messages:[],events:[{id:"welcome",at:0,type:"tizim",text:"AI Yer dunyosi tug‘ildi. 100 nafar mustaqil fuqaro hayotini boshladi."}]};
}
