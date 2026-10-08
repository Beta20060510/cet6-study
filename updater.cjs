const fs=require('node:fs'),path=require('node:path'),{getNews}=require('./news.cjs'),{select,build}=require('./curation.cjs');
const day=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
function createUpdater({directory=process.env.DATA_DIR||path.join(__dirname,'data'),seedPath=path.join(__dirname,'dist','daily-feed.json'),news=getNews}={}){
 fs.mkdirSync(directory,{recursive:true});const seed=JSON.parse(fs.readFileSync(seedPath,'utf8'));let pack=seed,status={state:'not-updated',lastSuccess:null,lastAttempt:null,lastAttemptDay:null,errors:[],candidates:0};let pending=null;
 for(const [file,set] of [['pack.json',v=>{if(v.version===1&&Array.isArray(v.materials)&&v.materials.length)pack=v;}],['status.json',v=>status=v]]){try{set(JSON.parse(fs.readFileSync(path.join(directory,file),'utf8')));}catch(e){}}
 function atomic(file,value){const target=path.join(directory,file),temp=target+'.tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2));fs.renameSync(temp,target);}
 async function update(force=false){if(pending)return pending;const today=day();if(!force&&status.lastSuccessDay===today)return status;if(!force&&status.lastAttempt&&Date.now()-Date.parse(status.lastAttempt)<15*60000)return status;
 pending=(async()=>{status={...status,lastAttempt:new Date().toISOString(),lastAttemptDay:today,state:'checking'};try{const fetched=await news(force);const candidates=select(fetched.items||[]);if(!['live','cached-server'].includes(fetched.status))throw Error('来源获取未成功，保留上次素材');if(!candidates.length)throw Error('近七天没有符合筛选条件的新闻，保留上次素材');const next=build(seed,candidates,today);atomic('pack.json',next);pack=next;status={...status,state:fetched.errors?.length?'partial':'updated',lastSuccess:new Date().toISOString(),lastSuccessDay:today,candidates:candidates.length,errors:fetched.errors||[],sources:[...new Set(candidates.map(x=>x.publisher))]};}catch(e){status={...status,state:'failed',errors:[e.message],candidates:0};}atomic('status.json',status);return status;})().finally(()=>pending=null);return pending;
 }
 function start(){update().catch(()=>{});const timer=setInterval(()=>{const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',hour12:false}).format(new Date()));if(hour>=8)update().catch(()=>{});},15*60000);timer.unref();return ()=>clearInterval(timer);}
 return {update,start,pack:()=>pack,status:()=>({...status,serverTime:new Date().toISOString(),today:day(),mode:'主题筛选 + 已编辑练习关联；不自动翻译新闻全文'})};
}
module.exports={createUpdater,day};
