import type { CountryId, Vec2 } from "./types";

export const WORLD_W = 680;
export const WORLD_D = 470;

const POLYGONS: Record<CountryId, Vec2[]> = {
  zarrin: [{x:-315,z:-210},{x:-45,z:-210},{x:-35,z:-55},{x:-105,z:0},{x:-315,z:5}],
  koksaroy: [{x:-45,z:-210},{x:315,z:-210},{x:315,z:-15},{x:95,z:-15},{x:-35,z:-55}],
  sahro: [{x:-105,z:0},{x:-35,z:-55},{x:95,z:-15},{x:80,z:95},{x:-20,z:130},{x:-115,z:85}],
  navbahor: [{x:-315,z:5},{x:-105,z:0},{x:-115,z:85},{x:-20,z:130},{x:-45,z:220},{x:-315,z:220}],
  oqsoy: [{x:95,z:-15},{x:315,z:-15},{x:315,z:220},{x:-45,z:220},{x:-20,z:130},{x:80,z:95}]
};

export function countryPolygon(id: CountryId) { return POLYGONS[id]; }
export function pointInPolygon(p: Vec2, poly: Vec2[]) {
  let inside = false;
  for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const a=poly[i]!, b=poly[j]!;
    if (((a.z>p.z)!==(b.z>p.z)) && p.x < (b.x-a.x)*(p.z-a.z)/(b.z-a.z+1e-9)+a.x) inside=!inside;
  }
  return inside;
}
export function countryAt(x:number,z:number):CountryId|undefined {
  const p={x,z};
  return (Object.keys(POLYGONS) as CountryId[]).find(id=>pointInPolygon(p,POLYGONS[id]));
}
function gaussian(x:number,z:number,cx:number,cz:number,sx:number,sz:number,h:number){
  const dx=(x-cx)/sx,dz=(z-cz)/sz;return h*Math.exp(-(dx*dx+dz*dz));
}
export function landMask(x:number,z:number){
  const nx=x/326,nz=z/220;
  const edge=1-(nx*nx+nz*nz);
  const rough=.055*Math.sin(x*.045)+.045*Math.sin(z*.052)+.025*Math.sin((x+z)*.082);
  return edge+rough;
}
export function terrainHeight(x:number,z:number){
  const coast=landMask(x,z);
  if(coast<-.04) return -7.5;
  const ripple=1.3*Math.sin(x*.035)*Math.cos(z*.027)+.7*Math.sin((x-z)*.06)+.45*Math.cos((x+z)*.095);
  const mountainNW=gaussian(x,z,-205,-105,92,62,42)+gaussian(x,z,-155,-65,58,48,23);
  const mountainE=gaussian(x,z,190,35,82,74,34)+gaussian(x,z,235,75,48,52,17);
  const mountainS=gaussian(x,z,-55,155,90,44,20);
  const ridge=gaussian(x,z,25,-28,125,28,12)*(0.55+0.45*Math.sin(x*.11+z*.03)**2);
  const coastLift=Math.max(0,Math.min(1,(coast+.04)/.18))*2.4;
  return Math.max(-1.2, coastLift+ripple+mountainNW+mountainE+mountainS+ridge);
}
export function isLand(x:number,z:number){return landMask(x,z)>=-.015;}
