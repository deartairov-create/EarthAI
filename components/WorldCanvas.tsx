"use client";
import { RefObject, useEffect, useRef } from "react";
import type { Agent, Building, Country, Vec2, WorldState } from "@/lib/types";

export type Camera={x:number;y:number;zoom:number;followId?:string};
export type CanvasApi={focusAgent:(id:string)=>void;focusCountry:(id:string)=>void;reset:()=>void};
const countryColors:Record<string,string>={astra:"#6dd6ff",boreal:"#b6a7ff",cyra:"#ffb56b",doran:"#79e5a5",elyra:"#ff91c8"};
const buildingColors:Record<string,string>={home:"#dbe6f3",office:"#91a8c0",shop:"#f7c873",cafe:"#f09b78",hospital:"#f28c9b",school:"#7fc7bd",government:"#aaa0d8",media:"#b29ade",market:"#e7b66a",park:"#56a76b",factory:"#8a949e"};
function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function insideCountry(c:Country,p:Vec2){return p.x>=c.x&&p.x<=c.x+c.w&&p.y>=c.y&&p.y<=c.y+c.h;}

export default function WorldCanvas({worldRef,selectedId,onSelect,apiRef}:{worldRef:RefObject<WorldState>;selectedId?:string;onSelect:(id?:string)=>void;apiRef:RefObject<CanvasApi|null>}){
  const canvasRef=useRef<HTMLCanvasElement>(null);const cam=useRef<Camera>({x:1900,y:1150,zoom:.38});const drag=useRef<{x:number;y:number;cx:number;cy:number}|null>(null);const last=useRef(0);
  useEffect(()=>{const c=canvasRef.current;if(!c)return;const canvasEl:HTMLCanvasElement=c;const resize=()=>{const dpr=Math.min(2,devicePixelRatio||1);const r=canvasEl.getBoundingClientRect();canvasEl.width=Math.floor(r.width*dpr);canvasEl.height=Math.floor(r.height*dpr);};resize();const ro=new ResizeObserver(resize);ro.observe(canvasEl);return()=>ro.disconnect();},[]);
  useEffect(()=>{apiRef.current={focusAgent(id){const a=worldRef.current.agents.find(x=>x.id===id);if(a){cam.current.followId=id;cam.current.zoom=Math.max(cam.current.zoom,1.35);cam.current.x=a.x;cam.current.y=a.y;}},focusCountry(id){const c=worldRef.current.countries.find(x=>x.id===id);if(c){cam.current.followId=undefined;cam.current.x=c.x+c.w/2;cam.current.y=c.y+c.h/2;cam.current.zoom=.72;}},reset(){cam.current={x:1900,y:1150,zoom:.38};}};},[apiRef,worldRef]);
  useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;const canvasEl:HTMLCanvasElement=canvas;let raf=0;const ctx=canvasEl.getContext("2d")!;
    function draw(ts:number){const w=worldRef.current;const dpr=Math.min(2,devicePixelRatio||1);const width=canvasEl.width/dpr,height=canvasEl.height/dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);const camera=cam.current;if(camera.followId){const a=w.agents.find(x=>x.id===camera.followId);if(a){camera.x+=(a.x-camera.x)*.08;camera.y+=(a.y-camera.y)*.08;}}
      ctx.save();ctx.translate(width/2,height/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
      // ocean / world floor
      ctx.fillStyle="#07131c";ctx.fillRect(-600,-500,5200,3400);
      ctx.strokeStyle="rgba(120,210,255,.035)";ctx.lineWidth=1/camera.zoom;for(let x=-400;x<4400;x+=120){ctx.beginPath();ctx.moveTo(x,-400);ctx.lineTo(x,2800);ctx.stroke();}for(let y=-300;y<2800;y+=120){ctx.beginPath();ctx.moveTo(-400,y);ctx.lineTo(4400,y);ctx.stroke();}
      for(const country of w.countries) drawCountry(ctx,country,w.buildings.filter(b=>b.countryId===country.id),camera.zoom);
      for(const a of w.agents) drawAgent(ctx,a,a.id===selectedId,camera.zoom,w.countries.find(c=>c.id===a.countryId)?.weather||"clear");
      // weather overlays
      for(const country of w.countries) drawWeather(ctx,country,country.weather,ts,camera.zoom);
      ctx.restore();
      // HUD compass
      ctx.fillStyle="rgba(6,11,18,.72)";roundRect(ctx,14,14,162,42,14);ctx.fill();ctx.fillStyle="#eaf6ff";ctx.font="600 12px system-ui";ctx.fillText(`ZOOM ${camera.zoom.toFixed(2)}×`,28,40);ctx.fillStyle="#7f93a8";ctx.fillText(camera.followId?"FOLLOWING":"FREE CAMERA",92,40);
      last.current=ts;raf=requestAnimationFrame(draw);
    }
    raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[selectedId,worldRef]);
  useEffect(()=>{const c=canvasRef.current;if(!c)return;const canvasEl:HTMLCanvasElement=c;function screenToWorld(clientX:number,clientY:number){const r=canvasEl.getBoundingClientRect();const camera=cam.current;return{x:(clientX-r.left-r.width/2)/camera.zoom+camera.x,y:(clientY-r.top-r.height/2)/camera.zoom+camera.y};}
    function down(e:PointerEvent){canvasEl.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,cx:cam.current.x,cy:cam.current.y};}
    function move(e:PointerEvent){if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;if(Math.abs(dx)+Math.abs(dy)>4){cam.current.followId=undefined;cam.current.x=drag.current.cx-dx/cam.current.zoom;cam.current.y=drag.current.cy-dy/cam.current.zoom;}}
    function up(e:PointerEvent){const d=drag.current;drag.current=null;if(!d)return;if(Math.abs(e.clientX-d.x)+Math.abs(e.clientY-d.y)<6){const p=screenToWorld(e.clientX,e.clientY);let best:Agent|undefined;let bd=28/cam.current.zoom;for(const a of worldRef.current.agents){const dd=Math.hypot(a.x-p.x,a.y-p.y);if(dd<bd){best=a;bd=dd;}}onSelect(best?.id);}}
    function wheel(e:WheelEvent){e.preventDefault();const before=screenToWorld(e.clientX,e.clientY);cam.current.zoom=Math.max(.22,Math.min(3.4,cam.current.zoom*Math.exp(-e.deltaY*.001)));const after=screenToWorld(e.clientX,e.clientY);cam.current.x+=before.x-after.x;cam.current.y+=before.y-after.y;}
    canvasEl.addEventListener("pointerdown",down);canvasEl.addEventListener("pointermove",move);canvasEl.addEventListener("pointerup",up);canvasEl.addEventListener("wheel",wheel,{passive:false});return()=>{canvasEl.removeEventListener("pointerdown",down);canvasEl.removeEventListener("pointermove",move);canvasEl.removeEventListener("pointerup",up);canvasEl.removeEventListener("wheel",wheel);};
  },[onSelect,worldRef]);
  return <canvas ref={canvasRef} className="world-canvas"/>;
}
function drawCountry(ctx:CanvasRenderingContext2D,c:Country,buildings:Building[],zoom:number){const color=countryColors[c.id];ctx.fillStyle=`${color}12`;ctx.strokeStyle=`${color}70`;ctx.lineWidth=3/zoom;roundRect(ctx,c.x,c.y,c.w,c.h,46);ctx.fill();ctx.stroke();
  // roads
  ctx.strokeStyle="rgba(218,231,241,.16)";ctx.lineWidth=28;for(let x=c.x+112;x<c.x+c.w-60;x+=125){ctx.beginPath();ctx.moveTo(x,c.y+48);ctx.lineTo(x,c.y+c.h-44);ctx.stroke();}for(let y=c.y+104;y<c.y+c.h-54;y+=116){ctx.beginPath();ctx.moveTo(c.x+42,y);ctx.lineTo(c.x+c.w-42,y);ctx.stroke();}
  ctx.strokeStyle="rgba(255,255,255,.11)";ctx.lineWidth=1.6;for(let x=c.x+112;x<c.x+c.w-60;x+=125){ctx.setLineDash([10,12]);ctx.beginPath();ctx.moveTo(x,c.y+48);ctx.lineTo(x,c.y+c.h-44);ctx.stroke();}for(let y=c.y+104;y<c.y+c.h-54;y+=116){ctx.beginPath();ctx.moveTo(c.x+42,y);ctx.lineTo(c.x+c.w-42,y);ctx.stroke();}ctx.setLineDash([]);
  for(const b of buildings){if(b.type==="park"){ctx.fillStyle="#173d27";roundRect(ctx,b.x,b.y,b.w,b.h,16);ctx.fill();ctx.fillStyle="#4f9960";for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(b.x+12+(i*17)%b.w,b.y+15+(i*29)%b.h,5,0,Math.PI*2);ctx.fill();}}else{ctx.fillStyle="rgba(0,0,0,.28)";roundRect(ctx,b.x+5,b.y+7,b.w,b.h,8);ctx.fill();ctx.fillStyle=buildingColors[b.type];roundRect(ctx,b.x,b.y,b.w,b.h,8);ctx.fill();ctx.fillStyle="rgba(8,18,28,.25)";for(let wx=b.x+10;wx<b.x+b.w-6;wx+=18){for(let wy=b.y+11;wy<b.y+b.h-7;wy+=18){ctx.fillRect(wx,wy,8,7);}}}
    if(zoom>.8){ctx.fillStyle="rgba(236,247,255,.82)";ctx.font=`${11/Math.min(1,zoom)}px system-ui`;ctx.fillText(b.type.toUpperCase(),b.x,b.y-5);}}
  ctx.fillStyle=color;ctx.font="800 34px system-ui";ctx.fillText(c.name.toUpperCase(),c.x+34,c.y+48);ctx.fillStyle="rgba(235,247,255,.62)";ctx.font="500 14px system-ui";ctx.fillText(`${c.capital} · ${c.weather.toUpperCase()}`,c.x+36,c.y+72);
}
function drawAgent(ctx:CanvasRenderingContext2D,a:Agent,selected:boolean,zoom:number,weather:string){const r=selected?10:7;ctx.fillStyle="rgba(0,0,0,.42)";ctx.beginPath();ctx.ellipse(a.x+2,a.y+6,r*.9,r*.5,0,0,Math.PI*2);ctx.fill();if(selected){ctx.strokeStyle="#fff";ctx.lineWidth=3/zoom;ctx.beginPath();ctx.arc(a.x,a.y,r+8,0,Math.PI*2);ctx.stroke();}
  const mood:Record<string,string>={happy:"#6ef2a2",calm:"#80caff",focused:"#c7b0ff",tired:"#a9b1ba",worried:"#ffd16e",angry:"#ff7474",excited:"#ff9bd1"};ctx.fillStyle=mood[a.mood]||"#fff";ctx.beginPath();ctx.arc(a.x,a.y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle="#07101a";ctx.beginPath();ctx.arc(a.x-2.4,a.y-1,1,0,Math.PI*2);ctx.arc(a.x+2.4,a.y-1,1,0,Math.PI*2);ctx.fill();
  if(zoom>1.05||selected){ctx.fillStyle="rgba(6,12,19,.86)";roundRect(ctx,a.x-45,a.y-34,90,18,8);ctx.fill();ctx.fillStyle="#edf8ff";ctx.font="600 10px system-ui";ctx.textAlign="center";ctx.fillText(a.name.split(" ")[0]!,a.x,a.y-21);ctx.textAlign="start";}
  if(weather==="rain"&&zoom>1.2){ctx.strokeStyle="rgba(120,200,255,.55)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x+12,a.y-20);ctx.lineTo(a.x+7,a.y-11);ctx.stroke();}
}
function drawWeather(ctx:CanvasRenderingContext2D,c:Country,weather:string,ts:number,zoom:number){if(weather==="clear")return;ctx.save();ctx.beginPath();ctx.rect(c.x,c.y,c.w,c.h);ctx.clip();if(weather==="rain"||weather==="storm"){ctx.strokeStyle=weather==="storm"?"rgba(170,210,255,.38)":"rgba(130,200,255,.25)";ctx.lineWidth=1.2/zoom;for(let i=0;i<90;i++){const x=c.x+((i*73+ts*.08)%c.w),y=c.y+((i*41+ts*.16)%c.h);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+18);ctx.stroke();}}if(weather==="heat"){ctx.fillStyle="rgba(255,135,70,.10)";ctx.fillRect(c.x,c.y,c.w,c.h);}if(weather==="flood"){ctx.fillStyle="rgba(50,145,210,.16)";ctx.fillRect(c.x,c.y+c.h*.55,c.w,c.h*.45);}if(weather==="fire"){ctx.fillStyle="rgba(255,65,40,.09)";ctx.fillRect(c.x,c.y,c.w,c.h);}ctx.restore();}
