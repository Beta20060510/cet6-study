const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const HOST='tts.tencentcloudapi.com',VOICE=101050;
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const hmac=(key,text)=>crypto.createHmac('sha256',key).update(text).digest();
function sign({secretId,secretKey,payload,timestamp,host=HOST,service='tts',action='TextToVoice'}){
 const date=new Date(timestamp*1000).toISOString().slice(0,10),scope=date+'/'+service+'/tc3_request',signed='content-type;host;x-tc-action';
 const canonical='POST\n/\n\ncontent-type:application/json; charset=utf-8\nhost:'+host+'\nx-tc-action:'+action.toLowerCase()+'\n\n'+signed+'\n'+sha(payload);
 const stringToSign='TC3-HMAC-SHA256\n'+timestamp+'\n'+scope+'\n'+sha(canonical);
 const signature=crypto.createHmac('sha256',hmac(hmac(hmac('TC3'+secretKey,date),service),'tc3_request')).update(stringToSign).digest('hex');
 return {authorization:'TC3-HMAC-SHA256 Credential='+secretId+'/'+scope+', SignedHeaders='+signed+', Signature='+signature,canonicalHash:sha(canonical)};
}
function audioBytes(base64){if(typeof base64!=='string'||base64.length>1400000||! /^[A-Za-z0-9+/]+={0,2}$/.test(base64))throw Error('InvalidAudio');const audio=Buffer.from(base64,'base64');if(audio.length<128||audio.length>1000000||!(audio.toString('ascii',0,3)==='ID3'||audio[0]===255&&(audio[1]&224)===224))throw Error('InvalidAudio');return audio;}
async function synthesize(word,{secretId,secretKey,fetcher=fetch,now=()=>Date.now()}={}){
 const payload=JSON.stringify({Text:word,SessionId:crypto.randomUUID(),ModelType:1,VoiceType:VOICE,PrimaryLanguage:2,SampleRate:16000,Codec:'mp3',Speed:0,Volume:0});
 const timestamp=Math.floor(now()/1000),auth=sign({secretId,secretKey,payload,timestamp});
 let response;try{response=await fetcher('https://'+HOST+'/',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8',Host:HOST,Authorization:auth.authorization,'X-TC-Action':'TextToVoice','X-TC-Version':'2019-08-23','X-TC-Timestamp':String(timestamp)},body:payload,signal:AbortSignal.timeout(12000),redirect:'error'});}catch(e){throw Error(e.name==='TimeoutError'?'RequestTimeout':'NetworkUnavailable');}
 if(!response.ok)throw Error('HTTP_'+response.status);let value;try{value=(await response.json()).Response;}catch{throw Error('InvalidResponse');}if(value?.Error){const code=value.Error.Code;throw Error(typeof code==='string'&&/^[A-Za-z0-9_.]{1,100}$/.test(code)?code:'ServiceError');}return audioBytes(value?.Audio);
}
async function bundle({stateDirectory=path.join(__dirname,'public-state'),destination=path.join(__dirname,'dist'),env=process.env,fetcher=fetch,words,now=()=>Date.now(),budget=180000}={}){
 const folder=path.join(stateDirectory,'word-audio');fs.mkdirSync(folder,{recursive:true});const manifestPath=path.join(folder,'manifest.json'),controlPath=path.join(folder,'tencent-control.json');
 let manifest={version:1,entries:{},attempted:{}};try{manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));}catch{}let control={days:{}};try{control=JSON.parse(fs.readFileSync(controlPath,'utf8'));}catch{}
 // Public manifest never contains credentials or API authorization headers.
 const today=new Date(now()+8*3600000).toISOString().slice(0,10),start=now(),valid=entry=>/^[a-f0-9]{20}\.mp3$/.test(entry?.file||'')&&fs.existsSync(path.join(folder,entry.file));
 for(const [word,entry] of Object.entries(manifest.entries))if(!valid(entry))delete manifest.entries[word];
 const current=Object.values(manifest.entries).filter(e=>e.provider==='Tencent Cloud TTS').length;
 const daily=control.days[today]||={calls:0,characters:0,limit:current>=10?200:10,errors:[]};
 const status={provider:'Tencent Cloud TTS',voiceType:VOICE,voiceName:'WeJack · 英语精品合成',day:today,state:'not-configured',newRecordings:0,totalRecordings:current,requestsToday:daily.calls,charactersToday:daily.characters,errors:[]};
 const secretId=env.TENCENT_SECRET_ID?.trim(),secretKey=env.TENCENT_SECRET_KEY?.trim();
 if(secretId&&secretKey){
  // User confirmed claiming the matching quota on 2026-10-09. Permit one reset
  // of this specific error, without resetting attempted calls or daily limits.
  if(today==='2026-10-09'&&daily.errors.length===1&&daily.errors[0]==='UnsupportedOperation.PkgExhausted'&&!daily.quotaClaimRetryUsed&&daily.calls<daily.limit){
   daily.quotaClaimRetryUsed=true;daily.previousErrors=[...daily.errors];daily.errors=[];
   fs.writeFileSync(controlPath,JSON.stringify(control));
  }
  if(!words){const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'dist/content.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'dist/vocabulary.js'),'utf8')+';globalThis.list=WORDS.map(w=>w.word);',ctx);words=ctx.list;}
  status.state=daily.errors.length?'failed':daily.calls>=daily.limit?'daily-limit':'updated';status.errors=[...daily.errors];
  for(const word of words){if(daily.errors.length||daily.calls>=daily.limit||now()-start>=budget)break;if(manifest.entries[word]?.provider==='Tencent Cloud TTS')continue;if(typeof word!=='string'||word.length>100||! /^[A-Za-z][A-Za-z '\-]*$/.test(word))continue;
   // Account for attempted calls before sending, including timeouts; no automatic retries.
   daily.calls++;daily.characters+=word.length;fs.writeFileSync(controlPath,JSON.stringify(control));
   try{const audio=await synthesize(word,{secretId,secretKey,fetcher,now}),filename=sha('tencent-'+VOICE+'-'+word).slice(0,20)+'.mp3';fs.writeFileSync(path.join(folder,filename),audio);manifest.entries[word]={file:filename,accent:'unknown',provider:'Tencent Cloud TTS',voiceType:VOICE,voiceName:'WeJack',source:'https://cloud.tencent.com/document/product/1073/92668',kind:'英语精品合成音频',generatedAt:new Date(now()).toISOString()};status.newRecordings++;fs.writeFileSync(manifestPath,JSON.stringify(manifest));
   }catch(e){const code=/^[A-Za-z0-9_.]{1,100}$/.test(e.message)?e.message:'GenerationFailed';daily.errors.push(code);status.state='failed';status.errors=[...daily.errors];fs.writeFileSync(controlPath,JSON.stringify(control));break;}
  }
 }
 status.requestsToday=daily.calls;status.charactersToday=daily.characters;status.quotaClaimRetryUsed=!!daily.quotaClaimRetryUsed;if(daily.previousErrors)status.previousErrors=[...daily.previousErrors];status.totalRecordings=Object.values(manifest.entries).filter(e=>e.provider==='Tencent Cloud TTS').length;if(status.state==='updated'&&status.totalRecordings===words?.length)status.state='complete';
 manifest.generation=status;manifest.updatedAt=new Date(now()).toISOString();fs.writeFileSync(manifestPath,JSON.stringify(manifest));
 const out=path.join(destination,'word-audio');fs.mkdirSync(out,{recursive:true});for(const entry of Object.values(manifest.entries))fs.copyFileSync(path.join(folder,entry.file),path.join(out,entry.file));fs.writeFileSync(path.join(destination,'word-audio.json'),JSON.stringify(manifest));
 return status;
}
module.exports={sign,audioBytes,synthesize,bundle};if(require.main===module)bundle().then(status=>console.log(JSON.stringify(status))).catch(()=>{console.error('Audio publication failed; credentials withheld.');process.exitCode=1;});
