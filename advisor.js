(function(root){
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function interpret(message,previous={}){
  const text=normalize(message),criteria=/reiniciar|empezar de nuevo|limpiar/.test(text)?{}:{...previous};
  const budget=text.match(/(?:hasta|menos de|maximo|presupuesto(?: de)?|tengo)\s*(?:bs\s*)?(\d+(?:[.,]\d+)?)/)||text.match(/(\d+(?:[.,]\d+)?)\s*bs/);
  if(budget)criteria.budget=Number(budget[1].replace(',','.'));
  const range=text.match(/entre\s*(\d+(?:[.,]\d+)?)\s*(?:y|a)\s*(\d+(?:[.,]\d+)?)/);
  if(range){criteria.minimum=Number(range[1].replace(',','.'));criteria.budget=Number(range[2].replace(',','.'));}
  if(/sin limite|cualquier precio/.test(text)){delete criteria.budget;delete criteria.minimum;}
  for(const [word,cat] of [['arete','aretes'],['pendiente','aretes'],['collar','collares'],['manilla','manillas'],['pulsera','manillas']])if(text.includes(word))criteria.category=cat;
  if(/cualquier tipo|todos los tipos/.test(text))delete criteria.category;
  for(const color of ['amarillo','azul','lila','marfil','natural'])if(text.includes(color))criteria.color=color;
  if(/cualquier color|sin color/.test(text))delete criteria.color;
  for(const mat of ['paiche','semillas','plumas','madera'])if(text.includes(mat))criteria.material=mat;
  if(/cualquier material/.test(text))delete criteria.material;
  if(/liger/.test(text))criteria.light=true;
  if(/cualquier peso/.test(text))delete criteria.light;
  return criteria;
 }
 function recommend(products,criteria){return products.filter(p=>p.publication==='Publicado'&&Number(p.stock)>0&&(criteria.budget===undefined||p.price<=criteria.budget)&&(criteria.minimum===undefined||p.price>=criteria.minimum)&&(!criteria.category||p.cat===criteria.category)&&(!criteria.color||normalize(p.color)===criteria.color)&&(!criteria.material||normalize(p.mat.join(' ')).includes(criteria.material))&&(!criteria.light||p.weight<=20)).sort((a,b)=>a.price-b.price);}
 function reply(message,previous,products){
  const text=normalize(message);
  const info=[
   [/como te llam|quien eres|eres una ia|inteligencia artificial/,'Soy Semilla, el asistente de PAKAWARA. Uso reglas y datos del catálogo para ayudarte a elegir. Recuerdo filtros durante esta conversación; no soy una IA generativa ni invento información comercial.'],
   [/cuid|limpiar (?:mi|una|la|el)|mojar|perfume/,'Como precaución general, evita humedad prolongada, perfumes directos y productos abrasivos. Guarda las piezas separadas. Confirma con PAKAWARA el cuidado específico de cada material; no tengo una ficha técnica de conservación verificada.'],
   [/alerg|hipoalergen|niquel/,'No puedo asegurar que una pieza sea hipoalergénica. Consulta la composición de los cierres y metales con PAKAWARA antes de elegir.'],
   [/garantia|devolucion|cambio de producto/,'Las condiciones de garantía, cambios y devoluciones deben confirmarse con PAKAWARA. No tengo una política oficial verificada y no voy a inventarla.'],
   [/pago|pix|tarjeta|transferencia|efectivo/,'Puedes indicar QR o transferencia, efectivo, tarjeta o PIX como preferencia en la solicitud de demostración. La aceptación debe confirmarse con la marca. Esta página no cobra ni solicita datos bancarios.'],
   [/envio|entrega/,'Puedes elegir retiro o entrega por coordinar. Consulta cobertura, fecha y tarifa por los canales oficiales; aquí no hay envío contratado ni costo verificado.'],
   [/instagram|facebook|tiktok|contacto|redes/,'Encuentra Instagram, Facebook, TikTok y el sitio de la marca en Nosotros y al pie de página. Los enlaces abren sus canales oficiales en otra pestaña.'],
   [/privacidad|mis datos|donde se guarda/,'Favoritos, solicitudes y registros de gestión se guardan en este navegador, sin sincronización entre dispositivos. No introduzcas datos personales reales en el prototipo. Mis filtros de conversación se conservan solo mientras esta página siga abierta.'],
   [/calidad|revision|publicacion/,'Las fichas nuevas pasan por Borrador, En revisión y Publicado. Para publicar se requieren campos completos, fotografía, stock positivo y revisión marcada. Esto controla información del catálogo; no certifica la calidad física del producto.'],
   [/tiempo de respuesta|indicador|tpr/,'En Gestión puedes registrar recepción y primera respuesta. El TPR divide las horas acumuladas entre las consultas respondidas; las pendientes se cuentan aparte. Doce horas es una meta propuesta, no un resultado garantizado.'],
   [/favorit/,'Pulsa el corazón de una pieza para guardarla. En el catálogo, Mis favoritos muestra tu selección. Se conserva en este navegador, no en una cuenta compartida.'],
   [/video|ver el proceso/,'En Nosotros encontrarás los dos videos compartidos para el proyecto. Tienen controles de reproducción y no se reproducen automáticamente. Puedes pausarlos, ajustar el volumen o ampliar el reproductor.'],
   [/lupa|zoom|ampliar|ver detalle/,'Abre una ficha y pulsa Explorar fotografía. Puedes ampliar hasta 5×, arrastrar, usar la rueda o dos dedos. En teclado usa +, −, flechas y 0 para ajustar. La ampliación no crea detalle que la imagen original no tenga.'],
   [/horario|direccion exacta|ubicacion|donde estan|donde queda/,'El proyecto sitúa PAKAWARA en Cobija, Pando, Bolivia. No tengo una dirección de atención ni horarios verificados. Confírmalos a través de los enlaces de la marca en Nosotros.'],
   [/personaliz|a medida|talla|tamano/,'No tengo un servicio de personalización ni medidas de ajuste confirmadas. Consulta con la marca si el diseño admite cambios. El peso que aparece en la ficha no sustituye la talla o las dimensiones.'],
   [/mayorista|por mayor|descuento|cupon|promocion/,'No tengo promociones ni condiciones mayoristas verificadas. Los precios visibles son los del catálogo de demostración; confirma precio final y descuentos directamente con la marca.'],
   [/certific|sostenib|ecologic/,'El proyecto se presenta como biojoyería de identidad amazónica. No tengo certificados ambientales ni trazabilidad verificada por pieza. Puedo mostrar los materiales declarados en cada ficha, sin afirmar una certificación.'],
   [/carrito|como compro|como comprar|hacer pedido/,'Elige una pieza y pulsa Agregar al carrito. Revisa tu selección y crea una solicitud de prueba con alias, preferencia de pago y entrega. Se guarda solo en tu navegador: no compra, cobra ni envía nada al negocio.'],
   [/cancelar|anular/,'En Gestión → Pedidos puedes cancelar una solicitud pendiente o en proceso. Las solicitudes nuevas devuelven su stock local al cancelarse. Una solicitud entregada o ya cancelada no permite esa transición.'],
   [/agotado|reponer|reposicion/,'Solo recomiendo fichas publicadas con stock local positivo. Si una está agotada, consulta a PAKAWARA por disponibilidad real y reposición; no tengo fechas confirmadas.'],
   [/export|descargar|respaldo/,'En Gestión puedes descargar CSV de catálogo, solicitudes, consultas y bitácora, además de un respaldo JSON. El resumen de la última solicitud se descarga desde su confirmación. No publiques respaldos con información privada.'],
   [/que es pakawara|sobre la empresa|historia de pakawara/,'PAKAWARA Biojoyas es el emprendimiento de identidad amazónica de este proyecto. El catálogo incluye aretes, collares y manillas. En Nosotros tienes imágenes de las piezas, videos compartidos y enlaces para conocer directamente la marca.'],
   [/gracias/,'Con gusto. Si quieres seguir, dime un tipo de pieza, material o presupuesto. También puedo explicarte cómo comparar o ampliar una fotografía.']
  ];
  for(const [pattern,answer] of info)if(pattern.test(text))return{txt:answer,criteria:previous};
  let named=products.filter(p=>text.includes(normalize(p.name))||text.includes(normalize(p.code||'__sin_codigo__')));
  if(!named.length&&/el primero|la primera|el segundo|la segunda|el tercero|la tercera|ese producto|esa pieza/.test(text)&&previous.lastIds?.length){const index=/segund/.test(text)?1:/tercer/.test(text)?2:0;named=products.filter(p=>p.id===previous.lastIds[index]);}
  if(named.length>1&&/compar|diferencia|cual/.test(text)){const sorted=[...named].sort((a,b)=>a.price-b.price);return{criteria:previous,products:named.filter(p=>p.publication==='Publicado').slice(0,3),txt:named.map(p=>`${p.name}: Bs ${p.price}, ${p.weight} g, ${p.mat.join(', ')}.`).join('\n')+`\nLa diferencia de precio entre la más económica y la más cara es Bs ${(sorted.at(-1).price-sorted[0].price).toFixed(2)}. El precio no demuestra por sí solo mayor calidad. Confirma precios y medidas con la marca.`};}
  if(named.length){return{criteria:previous,txt:named.map(p=>`${p.name}: Bs ${p.price}; ${p.mat.join(', ')}; ${p.weight} g; color ${p.color}. ${p.publication==='Publicado'&&p.stock>0?'Disponible en el inventario local de demostración.':'No disponible para solicitar.'}`).join('\n')+' Puedes abrir las fichas o comparar precio, peso y materiales desde el catálogo.',products:named.filter(p=>p.publication==='Publicado').slice(0,3)};}
  if(/compar/.test(text))return{criteria:previous,txt:'Selecciona Comparar pieza debajo de hasta tres productos del catálogo. Verás precio, materiales, peso, color y stock local en una tabla. También puedes escribir los nombres de dos piezas para consultar sus características.'};
  if(/que materiales|de que estan hechas/.test(text))return{criteria:previous,txt:'Materiales declarados en las fichas publicadas: '+[...new Set(products.filter(p=>p.publication==='Publicado').flatMap(p=>p.mat))].join(', ')+'. Dime un material para buscar piezas. Estos atributos requieren confirmación comercial.'};
  if(/que puedes|ayuda|que sabes/.test(text))return{criteria:previous,txt:'Puedo ayudarte en estas áreas:\n• Elegir por tipo, color, material, peso y presupuesto.\n• Recordar filtros y consultar “el primero” de mis resultados.\n• Comparar dos piezas por nombre o código.\n• Explicar cuidados generales, lupa, favoritos y carrito.\n• Orientarte sobre pagos, entrega, cancelación y privacidad.\n• Explicar controles de calidad, indicadores y exportaciones.\nNo conozco políticas comerciales no confirmadas ni respondo cualquier tema como una IA generativa.'};
  const criteria=interpret(message,previous),filters=[criteria.category,criteria.color,criteria.material,criteria.light?'hasta 20 g':null,criteria.minimum!==undefined?'desde Bs '+criteria.minimum:null,criteria.budget!==undefined?'hasta Bs '+criteria.budget:null].filter(Boolean);
  if(!filters.length&&!/regalo|recom|hola|buenas|reiniciar|limpiar|empezar|opciones|econom|barat/.test(text))return{criteria,txt:'No tengo información suficiente para responder eso. Puedo ayudarte con productos, presupuesto, materiales, comparación, cuidado y funcionamiento de la página. Para condiciones comerciales, consulta los canales de PAKAWARA.'};
  let matches=recommend(products,criteria);
  if(/mas liger|menos pesa/.test(text))matches.sort((a,b)=>a.weight-b.weight);
  if(/mas barat|mas economic|mas liger|menos pesa/.test(text))matches=matches.slice(0,1);
  criteria.lastIds=matches.slice(0,3).map(p=>p.id);
  return{criteria,txt:(filters.length?'Estoy buscando: '+filters.join(' · ')+'. ':'Te muestro opciones disponibles ordenadas de menor a mayor precio. ')+(matches.length?'Cada propuesta coincide con los filtros indicados. Puedes añadir otro detalle o decir “reiniciar”.':'No hay coincidencias exactas. Prueba “cualquier color”, “cualquier tipo” o “sin límite” sin perder el resto de tu selección.'),products:matches.slice(0,3)};
 }
 const api={interpret,recommend,reply};if(typeof module!=='undefined')module.exports=api;root.PakawaraAdvisor=api;
})(typeof window!=='undefined'?window:globalThis);
