(function(){
 const app=window.PriceBandApp;if(!app)return;
 const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const overlay=$('pb-import-overlay'),fileInput=$('pb-import-file'),drop=$('pb-import-drop'),progress=$('pb-import-progress'),result=$('pb-import-result'),error=$('pb-import-error'),confirm=$('pb-import-confirm'),reset=$('pb-import-reset');
 let pending=null;
 const xml=text=>new DOMParser().parseFromString(text,'application/xml'),nodes=(doc,name)=>[...doc.getElementsByTagNameNS('*',name)];
 const normalize=s=>String(s??'').replace(/[\s/／·]/g,'').toLowerCase();
 const key=(low,high)=>`${low}:${high==null?'plus':high}`;
 const month=value=>{
  if(typeof value==='number'&&value>30000&&value<90000){const date=new Date(Math.round((value-25569)*86400000));return Number.isNaN(date.getTime())?null:date.toISOString().slice(0,7)}
  const text=String(value??'').trim(),matched=text.match(/^(20\d{2})[年\/-](\d{1,2})(?:[月\/-]\d{1,2})?/);if(!matched)return null;const m=Number(matched[2]);return m>=1&&m<=12?`${matched[1]}-${String(m).padStart(2,'0')}`:null
 };
 const number=value=>{if(typeof value==='number')return Number.isFinite(value)?value:null;const text=String(value??'').replaceAll(',','').trim();if(!text)return null;const parsed=Number(text);return Number.isFinite(parsed)?parsed:null};
 function bandValue(value){
  if(typeof value==='number'&&Number.isFinite(value))return{low:value,high:null,original:String(value),infer:true};
  const text=String(value??'').trim(),pair=text.match(/^(\d+)\s*[-–—~至]\s*(\d+)$/),plus=text.match(/^(\d+)\s*(?:\+|以上)$/),single=text.match(/^\d+$/);
  if(pair)return{low:Number(pair[1]),high:Number(pair[2]),original:text,infer:false};
  if(plus)return{low:Number(plus[1]),high:null,original:text,infer:false};
  if(single)return{low:Number(text),high:null,original:text,infer:true};
  return null
 }
 async function readXml(zip,path,required=true){const entry=zip.file(path);if(!entry){if(required)throw Error(`Excel 缺少 ${path}`);return null}return xml(await entry.async('string'))}
 async function workbookSheets(file){
  if(!window.JSZip)throw Error('Excel 读取组件未加载，请刷新页面重试');
  if(!file.name.toLowerCase().endsWith('.xlsx'))throw Error('目前只支持 .xlsx 文件');
  if(file.size>15*1024*1024)throw Error('文件超过 15MB，请拆分后再导入');
  const zip=await JSZip.loadAsync(await file.arrayBuffer()),workbook=await readXml(zip,'xl/workbook.xml'),rels=await readXml(zip,'xl/_rels/workbook.xml.rels'),sharedDoc=await readXml(zip,'xl/sharedStrings.xml',false);
  const shared=sharedDoc?nodes(sharedDoc,'si').map(item=>nodes(item,'t').map(t=>t.textContent).join('')):[],targets=new Map(nodes(rels,'Relationship').map(item=>[item.getAttribute('Id'),item.getAttribute('Target')]));
  const sheets=[];
  for(const sheet of nodes(workbook,'sheet')){
   const id=sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||sheet.getAttribute('r:id'),target=targets.get(id);if(!target)continue;
   const path=target.startsWith('/')?target.slice(1):target.startsWith('xl/')?target:`xl/${target.replace(/^\.\//,'')}`,doc=await readXml(zip,path),rows=[];
   for(const row of nodes(doc,'row')){const cells=[];for(const cell of nodes(row,'c')){const ref=cell.getAttribute('r')||'',letters=(ref.match(/[A-Z]+/)||['A'])[0],column=[...letters].reduce((sum,char)=>sum*26+char.charCodeAt(0)-64,0)-1,type=cell.getAttribute('t');let value=null;if(type==='inlineStr')value=nodes(cell,'t').map(t=>t.textContent).join('');else{const raw=nodes(cell,'v')[0]?.textContent??'';value=type==='s'?shared[Number(raw)]??'':type==='str'?raw:raw===''?null:Number(raw)}cells[column]=value}rows.push({index:Number(row.getAttribute('r'))||rows.length+1,cells})}
   sheets.push({name:sheet.getAttribute('name')||'',rows})
  }
  return sheets
 }
 function parseSheet(sheet,schema){
  const header=sheet.rows.find(row=>row.cells.slice(1).filter(value=>month(value)).length>0);if(!header)throw Error(`${sheet.name}：没有识别到月份表头`);
  const columns=header.cells.map((value,index)=>({index,month:month(value)})).filter(item=>item.index>0&&item.month);if(new Set(columns.map(item=>item.month)).size!==columns.length)throw Error(`${sheet.name}：月份表头存在重复`);
  const rawRows=[],stated={};
  for(const row of sheet.rows.filter(item=>item.index>header.index)){const first=row.cells[0],label=String(first??'').trim();if(!label)continue;if(label==='总计'){columns.forEach(col=>{const value=number(row.cells[col.index]);if(value!=null)stated[col.month]=Math.round(value)});continue}const parsed=bandValue(first);if(!parsed)continue;const values={};for(const col of columns){const value=number(row.cells[col.index]);if(value==null||value<0)throw Error(`${sheet.name}：${label} 的 ${col.month} 不是有效的非负数`);values[col.month]=Math.round(value)}rawRows.push({...parsed,values,sourceRow:row.index})}
  if(!rawRows.length)throw Error(`${sheet.name}：没有识别到价格带明细`);
  rawRows.forEach((row,index)=>{if(row.infer&&index<rawRows.length-1)row.high=rawRows[index+1].low});
  const schemaMap=new Map(schema.bands.map(item=>[key(item.low,item.high),item])),mapped=new Map(),notes=[];let previousHigh=null;
  for(const row of rawRows){let bounds=key(row.low,row.high);if(!schemaMap.has(bounds)&&previousHigh!=null&&row.high!=null&&row.low<previousHigh&&schemaMap.has(key(previousHigh,row.high))){notes.push(`源表“${row.original}”按连续档位识别为“${previousHigh}~${row.high}”`);row.low=previousHigh;bounds=key(row.low,row.high)}if(!schemaMap.has(bounds))throw Error(`${sheet.name}：价格带“${row.original}”与现有结构不一致，已停止导入`);if(mapped.has(bounds))throw Error(`${sheet.name}：价格带“${row.original}”重复`);mapped.set(bounds,row);previousHigh=row.high}
  return{schema,months:columns.map(item=>item.month),rows:rawRows,mapped,stated,notes}
 }
 function mergeCatalog(base,parsed,file){
  const data=structuredClone(base),summaries=[];
  for(const item of parsed){const category=data.categories.find(candidate=>candidate.id===item.schema.id),oldMonths=[...category.months],oldIndex=new Map(oldMonths.map((value,index)=>[value,index])),newIndex=new Map(item.months.map((value,index)=>[value,index])),allMonths=[...new Set([...oldMonths,...item.months])].sort(),missing={...(category.missingBandsByMonth||{})};item.months.forEach(value=>delete missing[value]);
   for(const band of category.bands){const incoming=item.mapped.get(key(band.low,band.high)),values=[];for(const value of allMonths){if(newIndex.has(value))values.push(incoming?incoming.values[value]:null);else values.push(band.values[oldIndex.get(value)])}band.values=values}
   category.months=allMonths;category.totals=allMonths.map((value,index)=>category.bands.reduce((sum,band)=>sum+(Number.isFinite(band.values[index])?band.values[index]:0),0));
   const schemaChanges={...(category.bandSchemaChangesByMonth||{})};for(const value of item.months){delete schemaChanges[value];const absent=[],regrouped=[];for(const band of category.bands){if(item.mapped.has(key(band.low,band.high)))continue;const covered=item.rows.some(row=>row.low<=band.low&&(row.high==null||(band.high!=null&&band.high<=row.high)));(covered?regrouped:absent).push(band.label)}if(absent.length)missing[value]=absent;if(regrouped.length)schemaChanges[value]=`新表与旧表的 ${regrouped.join('、')} 价带边界不同；旧档在本期不单独提供，不能逐档比较。`}
   category.missingBandsByMonth=missing;category.bandSchemaChangesByMonth=schemaChanges;category.discrepancies=(category.discrepancies||[]).filter(issue=>!newIndex.has(issue.month));for(const value of item.months){if(Number.isFinite(item.stated[value])){const sum=category.totals[allMonths.indexOf(value)];if(sum!==item.stated[value])category.discrepancies.push({month:value,bandSum:sum,sourceTotal:item.stated[value],difference:sum-item.stated[value]})}}
   const missingLabels=[...new Set(item.months.flatMap(value=>missing[value]||[]))],notes=[...item.notes];if(missingLabels.length)notes.push(`源表未提供 ${missingLabels.join('、')}；对应月份记为缺失值，不按 0 计算`);category.updateNotes=notes;category.latestUpdateSource=file.name;
   const overlap=item.months.filter(value=>oldIndex.has(value)),added=item.months.filter(value=>!oldIndex.has(value));summaries.push({id:category.id,label:category.label,months:item.months,overlap,added,rows:item.rows.length,missing:missingLabels,notes});
  }
  data.localUpdate={fileName:file.name,updatedAt:new Date().toISOString(),categories:summaries.map(item=>item.id)};return{data,summaries}
 }
 async function parseWorkbook(file){
  const base=app.current(),aliases=new Map(),extraAliases={styler:['卷_直发器'],'lint-remover':['毛球修剪器_除毛器_粘毛器'],'nose-trimmer':['鼻毛修剪器_电动修眉器'],'massage-gun':['按摩枪']};base.categories.forEach(category=>{[category.sourceSheet,category.label,category.label.replaceAll(' / ',''),...(extraAliases[category.id]||[])].forEach(name=>aliases.set(normalize(name),category))});const sheets=await workbookSheets(file),parsed=[],ignored=[];
  for(const sheet of sheets){const schema=aliases.get(normalize(sheet.name));if(!schema){if(sheet.rows.some(row=>row.cells.some(value=>value!=null&&String(value).trim()!=='')))ignored.push(sheet.name);continue}parsed.push(parseSheet(sheet,schema))}
  if(!parsed.length)throw Error(`没有找到可导入的类目工作表。支持：${base.categories.map(item=>item.sourceSheet).join('、')}`);
  const merged=mergeCatalog(base,parsed,file);return{...merged,file,ignored}
 }
 function setStage(stage){drop.hidden=stage!=='drop';progress.hidden=stage!=='progress';result.hidden=stage!=='result';error.hidden=stage!=='error'}
 function resetDialog(){pending=null;confirm.disabled=true;error.textContent='';result.innerHTML='';setStage('drop');reset.hidden=!app.hasCustom()}
 function showError(message){pending=null;confirm.disabled=true;error.innerHTML=`<b>未导入</b><br>${esc(message)}`;setStage('error')}
 function showPreview(payload){pending=payload;const allMonths=payload.summaries.flatMap(item=>item.months),overlap=payload.summaries.reduce((sum,item)=>sum+item.overlap.length,0),added=payload.summaries.reduce((sum,item)=>sum+item.added.length,0);result.innerHTML=`<div class="pb-import-file"><i>表</i><div><strong>${esc(payload.file.name)}</strong><span>${(payload.file.size/1024).toFixed(1)} KB · 已完成结构核对</span></div><button id="pb-import-change">更换文件</button></div><div class="pb-import-summary"><div><span>识别类目</span><strong>${payload.summaries.length} 个</strong></div><div><span>覆盖月份</span><strong>${overlap} 个</strong></div><div><span>新增月份</span><strong>${added} 个</strong></div></div>${payload.summaries.map(item=>`<article class="pb-import-category"><header><strong>${esc(item.label)}</strong><span>${esc(item.months[0])} 至 ${esc(item.months.at(-1))}</span></header><p>${item.rows} 个价格带 · ${item.overlap.length?`覆盖 ${item.overlap.join('、')}`:'无重复月份'}${item.added.length?` · 新增 ${item.added.join('、')}`:''}</p>${item.missing.length?`<small>缺少 ${item.missing.join('、')}，将显示为“—”</small>`:''}${item.notes.length?`<small>${item.notes.map(esc).join('；')}</small>`:''}</article>`).join('')}${payload.ignored.length?`<article class="pb-import-category"><p>已忽略未匹配工作表：${payload.ignored.map(esc).join('、')}</p></article>`:''}`;setStage('result');confirm.disabled=false;$('pb-import-change').onclick=()=>{fileInput.value='';fileInput.click()}}
 async function handle(file){if(!file)return;setStage('progress');confirm.disabled=true;try{showPreview(await parseWorkbook(file))}catch(reason){showError(reason?.message||'文件解析失败，请检查表格结构')}}
 function toast(message){const target=$('toast');target.textContent=message;target.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>target.hidden=true,2600)}
 function open(){if(!app.current()){toast('价格带数据仍在加载，请稍后重试');return}resetDialog();overlay.hidden=false;document.body.style.overflow='hidden'}function close(){overlay.hidden=true;document.body.style.overflow=''}
 $('pb-import-open').onclick=open;$('pb-import-close').onclick=close;$('pb-import-cancel').onclick=close;overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
 drop.onclick=()=>{fileInput.value='';fileInput.click()};fileInput.onchange=()=>handle(fileInput.files[0]);['dragenter','dragover'].forEach(name=>drop.addEventListener(name,event=>{event.preventDefault();drop.classList.add('dragging')}));['dragleave','drop'].forEach(name=>drop.addEventListener(name,event=>{event.preventDefault();drop.classList.remove('dragging')}));drop.addEventListener('drop',event=>handle(event.dataTransfer.files[0]));
 confirm.onclick=()=>{if(!pending)return;try{app.saveCustom(pending.data,pending.summaries[0].id);close();toast(`已更新 ${pending.summaries.map(item=>item.label).join('、')}，重复月份已覆盖`)}catch(reason){showError(reason?.message||'浏览器存储失败')}};
 reset.onclick=()=>{if(!window.confirm('恢复线上快照后，本机手工导入的数据将被清除。确定恢复吗？'))return;app.restoreOfficial();close();toast('已恢复线上价格带数据')};
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!overlay.hidden)close()});
 window.PriceBandImport={parseWorkbook};
})();
