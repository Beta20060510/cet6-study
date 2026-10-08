// Public dictionary recordings are prepared during publication, never via the AI API.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const origin='https://api.dictionaryapi.dev';
function allowedLicense(license){return license&&/^https:\/\/creativecommons\.org\/(?:licenses\/(?:by|by-sa)\/|publicdomain\/zero\/)/i.test(license.url||'');}
async function bundle({stateDirectory=path.join(__dirname,'public-state'),destination=path.join(__dirname,'dist'),fetcher=fetch,limit=40,budget=120000,now=()=>Date.now(),words}={}){
 const folder=path.join(stateDirectory,'word-audio');fs.mkdirSync(folder,{recursive:true});let manifest={version:1,entries:{},attempted:{}};try{manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));}catch{}
 if(!words){const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'dist/content.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'dist/vocabulary.js'),'utf8')+';globalThis.list=WORDS.map(w=>w.word);',ctx);words=ctx.list;}
 const start=now(),today=new Date(start).toISOString().slice(0,10),missing=words.filter(w=>!manifest.entries[w]);missing.sort((a,b)=>Number(!!manifest.attempted[a])-Number(!!manifest.attempted[b]));let attempts=0;
 for(const word of missing){if(attempts>=limit||now()-start>=budget)break;if(manifest.attempted[word]===today)continue;attempts++;manifest.attempted[word]=today;
  try{const res=await fetcher(origin+'/api/v2/entries/en/'+encodeURIComponent(word),{signal:AbortSignal.timeout(5000)});if(!res.ok)continue;const entries=await res.json();let candidate;
   for(const entry of Array.isArray(entries)?entries:[]){if(!allowedLicense(entry.license))continue;for(const sound of entry.phonetics||[]){const license=sound.license||entry.license;if(!allowedLicense(license))continue;try{const url=new URL(sound.audio);if(url.origin!==origin||!url.pathname.startsWith('/media/pronunciations/en/'))continue;candidate={url:url.href,license,source:origin+'/api/v2/entries/en/'+encodeURIComponent(word)};break;}catch{}}if(candidate)break;}
   if(!candidate)continue;const sound=await fetcher(candidate.url,{signal:AbortSignal.timeout(5000)});if(!sound.ok||Number(sound.headers.get('content-length')||0)>1000000)continue;const blob=await sound.blob();if(!blob.size||blob.size>1000000||!/^audio\//i.test(blob.type))continue;
   const filename=require('node:crypto').createHash('sha256').update(word).digest('hex').slice(0,20)+'.mp3';fs.writeFileSync(path.join(folder,filename),Buffer.from(await blob.arrayBuffer()));manifest.entries[word]={file:filename,accent:/[-_]us/i.test(candidate.url)?'en-US':/[-_]uk/i.test(candidate.url)?'en-GB':'unknown',source:candidate.source,audioSource:candidate.url,license:candidate.license};
  }catch{} // A failed source never prevents publication or removes previous recordings.
 }
 manifest.updatedAt=new Date(now()).toISOString();fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(manifest));const out=path.join(destination,'word-audio');fs.mkdirSync(out,{recursive:true});for(const entry of Object.values(manifest.entries))if(fs.existsSync(path.join(folder,entry.file)))fs.copyFileSync(path.join(folder,entry.file),path.join(out,entry.file));fs.writeFileSync(path.join(destination,'word-audio.json'),JSON.stringify(manifest));return {attempts,count:Object.keys(manifest.entries).length};
}
module.exports={bundle,allowedLicense};if(require.main===module)bundle().then(result=>console.log('Website-hosted dictionary recordings:',result.count,'; attempted:',result.attempts));
