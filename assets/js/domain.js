/* Reglas puras compartidas por la interfaz y las pruebas. Sin servicios externos. */
(function(root){
  const states={Borrador:['En revisión'], 'En revisión':['Borrador','Publicado'], Publicado:['Borrador']};
  const orderStates={Pendiente:['En proceso','Cancelado'],'En proceso':['Entregado','Cancelado'],Entregado:[],Cancelado:[]};
  function productErrors(p){
    const errors=[];
    if(!String(p.name||'').trim())errors.push('Nombre requerido');
    if(!String(p.code||'').trim())errors.push('Código requerido');
    if(!Number.isFinite(Number(p.price))||Number(p.price)<=0)errors.push('Precio positivo requerido');
    if(!Number.isInteger(Number(p.stock))||Number(p.stock)<0)errors.push('Stock entero no negativo requerido');
    if(!Array.isArray(p.mat)||!p.mat.some(x=>String(x).trim()))errors.push('Materiales requeridos');
    if(!String(p.desc||'').trim())errors.push('Descripción requerida');
    return errors;
  }
  function canPublish(p){return !productErrors(p).length&&Number(p.stock)>0&&Boolean(p.img)&&p.qualityApproved===true;}
  function canOrder(p){return p.publication==='Publicado'&&Number(p.stock)>0;}
  function nextProductState(p,next){
    if(!states[p.publication]?.includes(next))throw Error('Transición de ficha no permitida');
    if(next==='En revisión'&&productErrors(p).length)throw Error(productErrors(p).join('. '));
    if(next==='Publicado'&&!canPublish(p))throw Error('Revisa campos, fotografía, stock y conformidad de la ficha antes de publicar');
    return {...p,publication:next};
  }
  function changeOrder(order,next){
    if(!orderStates[order.status]?.includes(next))throw Error('Transición de pedido no permitida');
    return {...order,status:next,updatedAt:new Date().toISOString()};
  }
  function responseMetrics(items){
    const answered=items.filter(x=>x.respondedAt&&Number.isFinite(Date.parse(x.receivedAt))&&Date.parse(x.respondedAt)>=Date.parse(x.receivedAt));
    const hours=answered.map(x=>(Date.parse(x.respondedAt)-Date.parse(x.receivedAt))/3600000);
    return {total:items.length,answered:answered.length,pending:items.filter(x=>!x.respondedAt).length,mean:hours.length?hours.reduce((a,b)=>a+b,0)/hours.length:null,within12:hours.length?100*hours.filter(h=>h<=12).length/hours.length:null};
  }
  function csv(rows){return '\ufeff'+rows.map(r=>r.map(v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
  function scenario({queries,conversion,capacity,stock,months=12}){
    if(![queries,conversion,capacity,stock,months].every(Number.isFinite)||queries<0||conversion<0||conversion>1||capacity<0||stock<0||months<1||months>36)throw Error('Parámetros fuera de rango');
    const data=[];let inventory=stock;
    for(let month=1;month<=months;month++){const demand=queries*conversion,available=inventory+capacity,sales=Math.min(demand,available);inventory=available-sales;data.push({month,demand,sales,inventory,unmet:Math.max(0,demand-sales)});}
    return data;
  }
  const api={states,orderStates,productErrors,canPublish,canOrder,nextProductState,changeOrder,responseMetrics,csv,scenario};
  if(typeof module!=='undefined')module.exports=api;root.PakawaraDomain=api;
})(typeof window!=='undefined'?window:globalThis);
