(function(root){
 const groups=[
  {id:'core',name:'核心词',subtitle:'消费者在找什么产品',color:'teal',icon:'品'},
  {id:'person',name:'人群',subtitle:'谁在搜索这些产品',color:'violet',icon:'人'},
  {id:'scene',name:'场景',subtitle:'准备在哪里使用',color:'blue',icon:'景'},
  {id:'feature',name:'功能',subtitle:'希望解决什么问题',color:'green',icon:'用'},
  {id:'spec',name:'形态 / 规格',subtitle:'尺寸、结构与功率',color:'amber',icon:'型'},
  {id:'brand',name:'品牌',subtitle:'品牌与竞品搜索',color:'slate',icon:'牌'},
  {id:'style',name:'部位 / 发质',subtitle:'关注部位与头发特征',color:'rose',icon:'部'},
  {id:'other',name:'营销 / 其他',subtitle:'表达、渠道、礼赠等',color:'slate',icon:'词'},
  {id:'pending',name:'待确认',subtitle:'含义不明，保留人工判断',color:'amber',icon:'?'}
 ];
 function matches(row,id){if(id==='all')return true;if(id==='pending')return row.pending;const tags=row.tags.other||[];if(id==='brand')return tags.some(t=>t.startsWith('品牌 · '));if(id==='style')return tags.some(t=>/^(发型 \/ 部位|发质|部位 \/ 护理) · /.test(t));if(id==='other')return tags.some(t=>!t.startsWith('品牌 · ')&&!/^(发型 \/ 部位|发质|部位 \/ 护理) · /.test(t));return !!row.tags[id]?.length}
 function project(rows,group,limit=6){return rows.filter(r=>matches(r,group)).slice(0,limit)}
 function compare(a,b,key='pop',descending=true){const x=a[key],y=b[key];if(x==null&&y==null)return a.word.localeCompare(b.word,'zh-CN');if(x==null)return 1;if(y==null)return -1;return (typeof x==='string'?x.localeCompare(y,'zh-CN'):x-y)*(descending?-1:1)||a.word.localeCompare(b.word,'zh-CN')}
 function select(rows,id,config={}){return rows.filter(r=>matches(r,id)&&(!config.filter||config.filter==='all'||config.filter==='yoy'&&r.yoy>0||config.filter==='mom'&&r.mom>0||config.filter.startsWith('pop:')&&r.pop>=Number(config.filter.slice(4)))).sort((a,b)=>compare(a,b,config.sort||'pop',config.desc!==false))}
 function orderedGroups(order){const ids=groups.map(g=>g.id),valid=Array.isArray(order)?order.filter((id,index)=>ids.includes(id)&&order.indexOf(id)===index):[];return [...valid,...ids.filter(id=>!valid.includes(id))].map(id=>groups.find(g=>g.id===id))}
 function moveColumn(order,from,to,after=false){const ids=orderedGroups(order).map(g=>g.id);if(!ids.includes(from)||!ids.includes(to)||from===to)return ids;ids.splice(ids.indexOf(from),1);ids.splice(ids.indexOf(to)+(after?1:0),0,from);return ids}
 function moveTags(row,from,to){if(!groups.some(g=>g.id===to))throw Error('Unknown category');const tags=Object.fromEntries(['core','person','scene','feature','spec','other'].map(k=>[k,[...(row.tags[k]||[])]]));
 if(from==='all'||to==='pending')Object.keys(tags).forEach(k=>tags[k]=[]);else if(['core','person','scene','feature','spec'].includes(from))tags[from]=[];else if(from!=='pending')tags.other=tags.other.filter(t=>!matches({tags:{other:[t]}},from));
 if(to!=='pending'){const key=['brand','style','other'].includes(to)?'other':to;const label=(to==='brand'?'品牌 · ':to==='style'?'部位 / 护理 · ':'')+row.word;if(!tags[key].length||key==='other')tags[key]=[...new Set([...tags[key],label])];}return tags;
 }
 const api={groups,orderedGroups,moveColumn,matches,project,compare,select,moveTags};if(typeof module==='object'&&module.exports)module.exports=api;else root.DemandBoard=api;
})(typeof window!=='undefined'?window:globalThis);
