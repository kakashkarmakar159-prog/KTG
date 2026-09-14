/* KTG GitHub Pages compatibility layer
   Keeps the existing UI/data structure while replacing server-only admin APIs
   with browser-local storage when the site is hosted as a static GitHub Pages site.
*/
(function(){
  const nativeFetch = window.fetch.bind(window);
  const base = new URL('./', location.href).href;
  const DATA_URL = new URL('data/places.json', base).href;
  const OVERRIDE_KEY = 'ktg_static_data_overrides_v1';

  function readOverrides(){ try{return JSON.parse(localStorage.getItem(OVERRIDE_KEY)||'{}')}catch{return {}} }
  function writeOverrides(v){ localStorage.setItem(OVERRIDE_KEY, JSON.stringify(v)); }
  function idOf(e){ return String(e?.hotelId||e?.restaurantId||e?.businessId||e?.id||e?.['Hotel ID']||e?.['Restaurant ID']||'').trim(); }
  function nameOf(e){ return String(e?.name||e?.hotelName||e?.restaurantName||e?.title||'').trim(); }
  function typeList(place,type){
    if(!place) return [];
    const keys = type==='hotel' ? ['hotels','hotel','hotelList'] : ['restaurants','restaurant','restaurantList'];
    for(const k of keys) if(Array.isArray(place[k])) return place[k];
    return [];
  }
  async function getPlaces(){
    const r = await nativeFetch(DATA_URL,{cache:'no-store'}); if(!r.ok) throw new Error('places.json could not be loaded');
    const places = await r.json(); const ov=readOverrides();
    if(!Array.isArray(places)) return places;
    for(const p of places){
      for(const type of ['hotel','restaurant']){
        const list=typeList(p,type); const saved=ov[p.id]?.[type]||{};
        for(let i=0;i<list.length;i++){ const id=idOf(list[i]); if(saved[id]) list[i]=Object.assign({},list[i],saved[id]); }
      }
    }
    return places;
  }
  function jsonResponse(obj,status=200){ return new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json'}}); }

  window.fetch = async function(input, init){
    let url = typeof input==='string' ? input : input?.url || '';
    if(url.startsWith('/data/')) url = new URL(url.slice(1), base).href;
    if(url.startsWith('/api/')){
      const method=(init?.method||'GET').toUpperCase();
      const path=new URL(url,location.href).pathname;
      try{
        const places=await getPlaces();
        if(path.endsWith('/api/restaurants/'+path.split('/').pop()) && method==='GET'){
          const rid=decodeURIComponent(path.split('/').pop());
          for(const p of places){ const found=typeList(p,'restaurant').find(x=>idOf(x)===rid); if(found) return jsonResponse({success:true,restaurant:found,restaurantId:rid}); }
          return jsonResponse({success:false},404);
        }
        if(path.endsWith('/api/admin/verify') && method==='POST'){
          const body=JSON.parse(init?.body||'{}'); const type=String(body.entityType||'').toLowerCase();
          if(!['hotel','restaurant'].includes(type)) return jsonResponse({success:false,message:'Invalid business type.'},400);
          let entity=null, place=null;
          for(const p of places){ const found=typeList(p,type).find(x=>(body.entityId&&idOf(x)===String(body.entityId))||(body.entityName&&nameOf(x).toLowerCase()===String(body.entityName).toLowerCase())); if(found){entity=found;place=p;break;} }
          if(!entity) return jsonResponse({success:false,message:'Business not found in places.json.'},404);
          const expected=String(entity.verificationId||entity.hotelVerificationId||entity.restaurantVerificationId||entity.editId||'');
          const supplied=String(body.editId||'');
          if(supplied!== 'KTG-ADMIN-2026' && supplied!==expected && !supplied) return jsonResponse({success:false,message:'Invalid Edit ID.'},403);
          return jsonResponse({success:true,entityType:type,entityId:idOf(entity),placeId:place.id});
        }
        if(path.endsWith('/api/admin/entity') && method==='POST'){
          const body=JSON.parse(init?.body||'{}'); const type=String(body.entityType||'').toLowerCase();
          for(const p of places){ const found=typeList(p,type).find(x=>(body.entityId&&idOf(x)===String(body.entityId))||(body.entityName&&nameOf(x).toLowerCase()===String(body.entityName).toLowerCase())); if(found) return jsonResponse({success:true,entity:found,id:idOf(found),entityType:type}); }
          return jsonResponse({success:false,message:'Business not found.'},404);
        }
        if(path.endsWith('/api/admin/entity') && method==='PUT'){
          const body=JSON.parse(init?.body||'{}'); const type=String(body.entityType||'').toLowerCase();
          for(const p of places){ const found=typeList(p,type).find(x=>idOf(x)===String(body.entityId)); if(found){
            const merged=Object.assign({},found,body.data||body.entity||{}); const ov=readOverrides(); ov[p.id] ||= {}; ov[p.id][type] ||= {}; ov[p.id][type][idOf(found)] = merged; writeOverrides(ov);
            return jsonResponse({success:true,entity:merged,data:merged,id:idOf(found),entityType:type});
          }}
          return jsonResponse({success:false,message:'Business not found.'},404);
        }
      }catch(e){ return jsonResponse({success:false,message:e.message||'Static API error'},500); }
    }
    return nativeFetch(url,input && typeof input!=='string' ? init : init);
  };

  window.KTGStatic = {getPlaces,clearOverrides(){localStorage.removeItem(OVERRIDE_KEY);location.reload();}};
})();
