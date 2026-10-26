/* Demand classification v2 — category-specific, deterministic local rules. */
(function(root){
 const dimensions=[{id:'core',name:'核心词',color:'teal'},{id:'person',name:'人群',color:'violet'},{id:'scene',name:'场景',color:'blue'},{id:'feature',name:'功能',color:'green'},{id:'spec',name:'形态 / 规格',color:'amber'},{id:'other',name:'其他',color:'slate'}];
 const groups={
 core:['卷发棒','自动卷发器','卷发器','直板夹','直发夹板','拉直板夹','拉直夹板','直夹板','电夹板','夹发板','夹发棒','烫发夹','烫发棒','直发夹','直发板','直发棒','直发器','直发仪','直发梳','电热梳','电梳子','卷发梳','吹风梳','吹风机','玉米夹','蛋卷棒','蛋卷夹','刘海梳','刘海夹','蓬松夹','蓬蓬夹','蓬松器','蓬蓬梳','波浪夹','发夹板','头发夹板','电发棒','发棒','卷棒','卷发夹','烫夹板','夹板','hair straightener','hair curler'],
 person:['男生','男士','男','女生','女士','女','学生党','学生','儿童','宝宝','婴儿','化妆师','理发师','新手'],
 scene:['宿舍可用','宿舍','寝室','家用','理发店','美发店','旅行','旅游','出差','通勤','出游'],
 feature:['低噪','静音','不伤发','负离子','全自动','自动型','自动','持久定型','定型','无线充电','无线','充电','直卷两用','卷直两用','直发卷发两用','两用','二合一','三合一','五合一','多合一','多功能','换头','恒温','温控','控温','护发','蒸汽','冷雾','冷风','速热','快热','防烫','智能','电热','加热','电动','手动','拉直发','拉直','梳直','蓬松','垫发根','造型'],
 spec:['可折叠','折叠','便携式','便携','迷你','mini','小型','大号','小功率','低功率','弧形','口袋','一体','u型','u 型']
 };
 const brandWords=['lena','崔娅','雷瓦','ghd','vodana','敏煌','tymo','松下','戴森','金稻','beautigo','ubelle','艾诗摩尔','亚克西','丹橘','hyundai','乐程式','鹰堡','缕呈','宫村浩气','康夫','徕芬','fifn','abp','salonia','奥克斯','纽立','爱极拉','refa','诺为','桔想','svey','小米','途匠','飞美丝','ukey','美扬','沙宣','志高','ovl','飞利浦','火之凤','dyson','ruse','奥技','ysc','罗拉','夏新','铭煌','爱极','徕她','rsrh','koizumi','akira','steampod','laita','lean','akitz','cki','glampalm','unix','riwa','米家','欧莱雅pro','欧莱雅','faers','kskin','栀朴','amoi','美立得','3coins','卡诗','aux','yesbeauty','tescom','radiant','jrl','sure','金得利','babyshow'];
 const others=[['品牌',brandWords],['发型 / 部位',['玉米须','玉米烫','羊毛卷','大波浪','大卷','蛋卷头','蛋蛋卷','蛋卷','短发','长发','八字刘海','刘海','高颅顶','颅顶','头顶','发根','内扣','波浪','卷发','直发']],['发质',['细软','粗硬','细软塌','沙发','毛躁','受损发']],['营销表达',['神器','新款','国货','严选','十大','名牌','第一名','网红','国货甄选','热卖榜','热销榜','好评榜','畅销榜','必备','好物','定型神器','排名第一','销量第一','品牌','怎么选','避坑指南','不踩坑','推荐']],['渠道 / 服务',['旗舰店','官方','政府补贴','次日达','专区','正品','入口','百亿补贴','旗舰','品牌店','天天特价','工厂入口','精品店','0元购','新用户','淘严选']],['配件 / 礼赠',['礼盒','生日礼物','结婚礼物','新婚礼物','礼物','送闺蜜','替换头','收纳包','刀头','配件','充电器','充电线','电池','风嘴']]];
 const categoryRules={
  styler:{core:groups.core,feature:groups.feature},
  dryer:{core:['电吹风机','吹风筒','吹风机','电吹风','电风吹','风筒','吹风','吹头发','吹发','风机'],feature:['负离子','等离子','速干','高速','大风力','风力','强力','静音','低噪','无声','噪音','护发','恒温','冷热风','冷风','热风','折叠','无线','不插电','免插电','充电','长续航','大功率','小功率','低辐射','无辐射','不伤发']},
  clipper:{core:['理发器','电推剪','电推子','电动推子','理发推子','电动剃头刀','推剪','推子','剃头刀','剃发器','剪发器','修剪器','自助理发器','理发工具','理发剪','电推','电剪'],feature:['自动吸发','吸发','静音','低噪','雕刻','全自动','电动','无线','充电','防水','零卡发','不伤肤','自助','自己剪','自己理发','自己在家剪','卡头发']},
  shaver:{core:['电动剃须刀','剃须刀','刮胡须刀','刮胡刀','剃胡须刀','胡须刀','电胡须刀','剃胡刀','刮胡子','须刀','须刨','剃须','剃头刀'],feature:['往复式','旋转式','最干净','不留黑点','干净','剃净','刮净','干湿两用','全身水洗','水洗','清洗','防水','浮动刀头','智能','电动','充电','便携','不夹须','长续航']},
  'nose-trimmer':{core:['鼻毛电动修剪器','鼻毛修剪器','鼻毛修理器','鼻毛清理器','鼻毛器','修鼻毛器','剃鼻毛器','鼻毛剪刀','鼻毛剪','鼻毛刀','剪鼻毛器','修眉刀','修剪器','nose hair trimmer'],feature:['电动','充电','水洗','防水','不伤鼻','静音','三合一','多功能','修鼻毛','剪鼻毛','剃鼻毛','去鼻毛','鼻毛清理']},
  'massage-gun':{core:['筋膜枪','肌膜枪','基膜枪','颈膜枪','颈膜抢','按摩枪','震动枪','振动枪','肌肉按摩器','电动按摩器','按摩器','筋膜仪','按摩仪','massage gun'],feature:['深层按摩','深层','深筋膜松解','肌肉放松','放松','缓解','理疗','疏通','高频','震动','振动','热敷','冷热敷','多头','多功能','静音','无刷','电动','充电','智能','长续航','按摩']},
  'baby-clipper':{core:['婴儿剃头理发器','婴儿理发器','宝宝理发器','儿童理发器','理发器','电推剪','电推子','剃发器','剃头刀','剪发器','推发器','推剪','推子','修剪器','理发工具','理发剪','剪刀'],feature:['自动吸发','静音吸发','吸发','超静音','无声','静音','低噪','不伤肤','防夹发','防水','电动','无线','充电','剃胎毛','剃胎发']},
  'baby-dryer':{core:['宝宝电吹风','儿童吹风机','婴儿吹风机','吹屁股机','吹屁屁机','小吹风机','吹干机','吹风机','电吹风','吹风筒','风筒','吹风'],feature:['无辐射','低辐射','恒温','低温','静音','无声','无线','充电','不用插头','护发','不伤发','吹屁屁','吹屁股','速干','防烫','冷热风','小风力']}
 };
 const categoryExtras={
  dryer:{person:['大学生'],scene:['大学','家庭','理发店'],spec:['大功率','小功率','低功率','手持','500w','800w'],brands:['飞科','美的','追觅','博锐','laifen','dreame','demsen','olayks','莱芬','同诗','立时','光速博士']},
  clipper:{person:['成人','男人'],scene:['发廊','自助'],spec:['一体机','全套'],brands:['飞科','科德士','摩尔达','华尔','阿可美','芭比丽丝','博锐']},
  shaver:{person:['男式','青少年','高中生','男友'],scene:['旅行','出差'],spec:['小飞碟','小锤子','大锤子','烟斗','小巧','5系','9系'],brands:['飞科','博朗','博锐','超人','有色','yoose','philips','panasonic','西屋','奔腾','先科','金正']},
  'nose-trimmer':{person:['男式','男性','女生','男用'],scene:[],spec:['充电式','小巧'],brands:['飞科','西圣','双立人','哇牛','超人'],other:[['部位 / 护理',['鼻毛','鼻孔','修眉','眉毛','耳毛','蜜蜡']]]},
  'massage-gun':{person:['体育生','运动员','健身人群'],scene:['健身','运动','办公室','跑步','训练'],spec:['小钢炮','长柄','弯头','手持式','手持','迷你版'],brands:['skg','vtt','云康宝','翔宇医疗','konka','康佳'],other:[['部位 / 护理',['肌肉','颈部','肩颈','腰背','筋膜','腿部','肩膀']]]},
  'baby-clipper':{person:['婴幼儿','新生婴儿','新生儿','小月龄','婴儿','幼儿','宝宝','儿童','小孩'],scene:['家用'],brands:['如山','守林鸟','樱舒','小壮熊','易简','babycare','小白熊','十月结晶','佩佩','好孩子','可优比'],other:[['部位 / 护理',['胎毛','胎发','头发']]]},
  'baby-dryer':{person:['婴幼儿','新生婴儿','新生儿','小月龄','婴儿','幼儿','宝宝','儿童','小孩','小朋友'],scene:['家用'],brands:['mxoi','moxi','skuld','babycare','时蔻','时寇','萌小艾','小白熊','小贝熊','马博士','百教','mericle','oidire','如山'],other:[['部位 / 护理',['屁屁','屁股','红屁股','尿不湿','头发']]]}
 };
 const normalize=s=>String(s??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
 const ambiguous=new Set(['夹','板','棒','梳','小','卷','玉米','头发','hair','home','appliances','了','我的','左右','迷','口红','蛋糕','夫妇店','甲板','清单','扭力','水光','钻光','润光','雾光','柔雾','懒人','专用','打理']);
 function hits(text,words){const result=[];for(const word of words.slice().sort((a,b)=>b.length-a.length)){const w=normalize(word);let pos=text.indexOf(w);if(pos<0)continue;if(/^[a-z0-9 ]+$/.test(w)){const before=text[pos-1]||'',after=text[pos+w.length]||'';if(/[a-z0-9]/.test(before)||/[a-z0-9]/.test(after))continue}if(!result.some(x=>normalize(x).includes(w)))result.push(word)}return result}
 function classify(word,category='styler'){const text=normalize(word),tags=Object.fromEntries(dimensions.map(d=>[d.id,[]])),evidence=[],rules=categoryRules[category]||categoryRules.styler,extra=categoryExtras[category]||{};if(!ambiguous.has(text)){
 for(const [dim,words]of Object.entries({core:rules.core,person:[...groups.person,...(extra.person||[])],scene:[...groups.scene,...(extra.scene||[])],feature:rules.feature,spec:[...groups.spec,...(extra.spec||[])]}))for(const token of hits(text,words)){tags[dim].push(token);evidence.push({dimension:dim,token})}
 const commonOthers=others.filter(([kind])=>category==='styler'||!['发型 / 部位','发质'].includes(kind));
 for(const [kind,words]of [...commonOthers,...(extra.other||[]),['品牌',[...brandWords,...(extra.brands||[])]]])for(const token of hits(text,words)){tags.other.push(kind+' · '+token);evidence.push({dimension:'other',token,kind})}
 // Do not turn an appliance name into a separate hairstyle merely by substring.
 if(tags.core.length)tags.other=tags.other.filter(x=>!x.startsWith('发型 / 部位 · ')||!tags.core.some(c=>normalize(c).includes(normalize(x.split(' · ')[1]))));
 const specs=text.match(/\d+(?:\.\d+)?\s*(?:mm|毫米|cm|厘米|w|瓦|档|挡|度)(?![a-z])/g)||[];tags.spec.push(...specs.map(x=>x.replace(/\s+/g,'')));
 }
 for(const d of dimensions)tags[d.id]=[...new Set(tags[d.id])];return {tags,pending:!dimensions.some(d=>tags[d.id].length),evidence,version:`${category}-rules-v2`}
 }
 const parse=s=>{if(s==null||s==='--'||s==='')return null;const n=Number(String(s).replaceAll(',','').replace('万','').replace('%',''));return Number.isFinite(n)?n*(String(s).includes('万')?10000:1):null};
 function previous(month,n){const d=new Date(month+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,7)}
 function getRate(data,month,word,kind){if(month==='2026-09'){const r=(kind==='mom'?data.latestMom:data.latestYoy)?.find(x=>x.word===word),v=parse(r?.[kind]);if(v!==null)return v}const now=data.monthData[month]?.find(r=>r.word===word),old=data.monthData[previous(month,kind==='mom'?-1:-12)]?.find(r=>r.word===word),a=parse(now?.value),b=parse(old?.value);return a!==null&&b!==null&&b>0?(a/b-1)*100:null}
 function buildRows(data,month,overrides={},category){const id=category||data.id||Object.keys(categoryRules).find(k=>data.label===({'styler':'卷 / 直发器',dryer:'电吹风',clipper:'理发器',shaver:'剃须刀','nose-trimmer':'鼻毛修剪器','massage-gun':'筋膜枪','baby-clipper':'宝宝理发器','baby-dryer':'宝宝电吹风'})[k])||'styler',keywords=[...new Set((data.keywords?.[month]||[]).map(k=>normalize(k[0])))],priorMom=new Map((data.monthData[previous(month,-1)]||[]).map(r=>[r.word,parse(r.value)])),priorYoy=new Map((data.monthData[previous(month,-12)]||[]).map(r=>[r.word,parse(r.value)])),latestMom=new Map((data.latestMom||[]).map(r=>[r.word,parse(r.mom)])),latestYoy=new Map((data.latestYoy||[]).map(r=>[r.word,parse(r.yoy)]));return (data.monthData[month]||[]).map(row=>{const auto=classify(row.word,id),manual=overrides[normalize(row.word)],tags=manual?.tags||auto.tags,pop=parse(row.value),rate=(kind)=>{const latest=kind==='mom'?latestMom:latestYoy;if(month==='2026-09'&&latest.get(row.word)!=null)return latest.get(row.word);const base=(kind==='mom'?priorMom:priorYoy).get(row.word);return pop!=null&&base>0?(pop/base-1)*100:null};return {...row,pop,mom:rate('mom'),yoy:rate('yoy'),count:keywords.filter(k=>k.includes(normalize(row.word))).length,tags,pending:!dimensions.some(d=>tags[d.id]?.length),manual:!!manual,evidence:auto.evidence,version:auto.version}})}
 const api={dimensions,normalize,classify,parse,previous,getRate,buildRows};if(typeof module==='object'&&module.exports)module.exports=api;else root.DemandClassifier=api;
})(typeof window!=='undefined'?window:globalThis);
