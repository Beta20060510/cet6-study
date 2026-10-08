const fs=require('node:fs'),path=require('node:path'),{getNews}=require('./news.cjs'),{select,build}=require('./curation.cjs'),{day}=require('./updater.cjs');
const {generate}=require('./generate-daily.cjs');
async function buildStatic({destination=path.join(__dirname,'site'),stateDirectory=path.join(__dirname,'public-state'),news=getNews,generation=generate}={}){
 const seed=JSON.parse(fs.readFileSync(path.join(__dirname,'dist/daily-feed.json'),'utf8'));let prior=null;try{prior=JSON.parse(fs.readFileSync(path.join(stateDirectory,'last-public.json'),'utf8'));}catch(e){}
 const today=day();let pack=prior?.pack||seed,newsFeed=prior?.newsFeed||{status:'unavailable',fetchedAt:null,items:[]};const status={state:'failed',lastAttempt:new Date().toISOString(),lastSuccess:prior?.status?.lastSuccess||null,lastSuccessDay:prior?.status?.lastSuccessDay||null,today,errors:[],mode:'定时新闻主题关联；AI 新题生成与审核结果另列'};
 try{const raw=await news(true),candidates=select(raw.items||[]);if(!['live','cached-server'].includes(raw.status)||!candidates.length)throw Error('没有取得可用的新近主题新闻');pack=build(seed,candidates,today);newsFeed={...raw,items:candidates};Object.assign(status,{state:raw.errors?.length?'partial':'updated',lastSuccess:new Date().toISOString(),lastSuccessDay:today,errors:raw.errors||[]});}catch(e){status.errors=[e.message];newsFeed={...newsFeed,status:newsFeed.items.length?'stale':'unavailable'};}
 // Preserve old news on failure, while publishing manually reviewed additions from source.
 pack={...pack,materials:[...pack.materials.filter(m=>m.id.startsWith('news-')),...seed.materials.filter(m=>!m.id.startsWith('news-'))]};
 // AI publication is a separate success signal from news retrieval.
 let generated;try{generated=await generation({candidates:newsFeed.status==='stale'?[]:newsFeed.items,day:today,stateDirectory});}catch(e){generated={state:'failed',day:today,newExercises:0,errors:['生成流程异常，保留旧题']};}
 const {material,...generationStatus}=generated;status.generation=generationStatus;
 const previousAI=(prior?.pack?.materials||[]).filter(m=>m.id.startsWith('ai-'));
 const ai=[...(material?[material]:[]),...previousAI.filter(m=>m.id!==material?.id)].slice(0,30);
 pack.materials=[...ai,...pack.materials];if(material)pack.updatedAt=today;
 fs.mkdirSync(stateDirectory,{recursive:true});fs.writeFileSync(path.join(stateDirectory,'last-public.json'),JSON.stringify({pack,newsFeed,status}));
 fs.mkdirSync(destination,{recursive:true});fs.cpSync(path.join(__dirname,'dist'),destination,{recursive:true});
 for(const [name,value] of [['daily-feed.json',pack],['news-feed.json',newsFeed],['update-status.json',status]])fs.writeFileSync(path.join(destination,name),JSON.stringify(value,null,2));
 fs.writeFileSync(path.join(destination,'materials.js'),'const BUNDLED_MATERIALS = '+JSON.stringify(pack)+';\n');
 let file=path.join(destination,'library.js'),js=fs.readFileSync(file,'utf8');js=js.replaceAll('./api/news','./news-feed.json').replaceAll('./api/library/status','./update-status.json').replaceAll('服务器今日主题素材已发布','今日主题素材已发布').replaceAll('服务器尚未完成今日更新','发布流程尚未完成今日更新').replaceAll('服务器更新状态无法核对','发布状态无法核对').replaceAll('正在核对服务器更新状态','正在核对素材发布状态').replace('info.lastSuccessDay===info.today','info.lastSuccessDay===day()').replace('需要使用包含联网服务的服务器，纯静态托管不能提供此接口。','定时发布暂无可用新闻，已下载练习仍可使用。');fs.writeFileSync(file,js);
 const cache='cet6-static-'+require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).update(fs.readFileSync(path.join(destination,'app.js'))).update(fs.readFileSync(path.join(destination,'pronunciation.js'))).update(JSON.stringify(pack)).digest('hex').slice(0,12);
 for(const name of ['app.js','sw.js']){file=path.join(destination,name);js=fs.readFileSync(file,'utf8').replaceAll('cet6-v10',cache);if(name==='sw.js'){js=js.replace("'./daily-feed.json'","'./daily-feed.json','./news-feed.json','./update-status.json'").replace("url.pathname.endsWith('/api/news')","(url.pathname.endsWith('/api/news')||url.pathname.endsWith('/news-feed.json')||url.pathname.endsWith('/update-status.json'))");}fs.writeFileSync(file,js);}
 fs.writeFileSync(path.join(destination,'.nojekyll'),'');return {status,pack,destination};
}
module.exports={buildStatic};if(require.main===module)buildStatic().then(r=>console.log('Static package prepared: '+r.pack.materials.length+' exercises; update '+r.status.state+'; external publication has not been performed.')).catch(e=>{console.error(e.message);process.exitCode=1;});


