/* Device speech + on-demand public dictionary recordings. Never calls the AI API. */
const Pronunciation=(()=>{
 const STORE='word-pronunciation-v1';let speech=null,player=null,blobURL=null,epoch=0;
 const prefKey=typeof Profiles!=='undefined'?Profiles.key('pronunciation'):'cet6-pronunciation';let accent='en-US';try{const saved=localStorage.getItem(prefKey);if(['en-US','en-GB'].includes(saved))accent=saved;}catch{}
 function chooseVoice(voices,language,offline=false){const english=voices.filter(v=>/^en(?:[-_]|$)/i.test(v.lang)&&(!offline||v.localService===true));return english.find(v=>v.lang.replace('_','-').toLowerCase()===language.toLowerCase()&&v.localService)||english.find(v=>v.lang.replace('_','-').toLowerCase()===language.toLowerCase())||english.find(v=>v.localService)||english[0]||null;}
 function safeAudio(url){try{const u=new URL(url,'https://dictionaryapi.dev');return u.protocol==='https:'&&!u.username&&!u.password&&['api.dictionaryapi.dev','ssl.gstatic.com'].includes(u.hostname)?u.href:null;}catch{return null;}}
 function audioAccent(url){return /(?:[-_]uk|_gb_)/i.test(url)?'en-GB':/(?:[-_]us|_us_)/i.test(url)?'en-US':'unknown';}
 function pickAudio(entries,language){const found=(Array.isArray(entries)?entries:[]).flatMap(e=>Array.isArray(e.phonetics)?e.phonetics:[]).map(p=>safeAudio(p.audio||'')).filter(Boolean);return found.find(url=>audioAccent(url)===language)||found[0]||null;}
 function stop(){epoch++;try{window.speechSynthesis?.cancel();}catch{}speech=null;if(player){player.pause();player.removeAttribute('src');player.load();player.hidden=true;player=null;}if(blobURL){URL.revokeObjectURL(blobURL);blobURL=null;}}
 function say(text,rate,status){stop();const synth=window.speechSynthesis;if(!synth||typeof SpeechSynthesisUtterance==='undefined'){status('设备暂不支持英语朗读，请使用词典音频');return;}
  const voice=chooseVoice(synth.getVoices(),accent,!navigator.onLine);if(!voice){status(navigator.onLine?'英语语音尚未就绪，可稍后重试或使用词典音频':'设备没有可用的本地英语语音；已缓存词典音频仍可播放');return;}
  const id=epoch;const utter=new SpeechSynthesisUtterance(text);speech=utter;utter.lang=voice.lang;utter.voice=voice;utter.rate=rate;utter.volume=1;
  const origin=voice.localService?'本地设备语音':'设备在线语音';const fallback=voice.lang.replace('_','-').toLowerCase()!==accent.toLowerCase()?' · 所选口音不可用，使用 '+voice.lang:'';
  utter.onstart=()=>{if(id===epoch)status(origin+' · 正在朗读'+fallback);};utter.onend=()=>{if(id===epoch){speech=null;status(origin+' · 朗读结束'+fallback);}};utter.onerror=()=>{if(id===epoch){speech=null;status('设备朗读未完成，请点击词典音频重试');}};
  try{synth.cancel();synth.resume();synth.speak(utter);}catch{status('设备朗读不可用，请使用词典音频');}
 }
 async function recording(word,language){const key=new URL('./_word-pronunciation/'+encodeURIComponent(word.toLowerCase())+'-'+language,location.href).href;let cache=null;try{cache=await caches.open(STORE);const stored=await cache.match(key);if(stored)return {blob:await stored.blob(),accent:stored.headers.get('X-Accent')||'unknown',cached:true};}catch{}
  if(!navigator.onLine)throw Error('离线且此词音频尚未下载');
  const res=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(word),{signal:AbortSignal.timeout(8000)});if(!res.ok)throw Error('词典未提供此词音频');const entries=await res.json();const url=pickAudio(entries,language);if(!url)throw Error('此词暂无词典录音');
  const sound=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!sound.ok)throw Error('词典音频下载失败');if(Number(sound.headers.get('content-length')||0)>1000000)throw Error('音频过大');const blob=await sound.blob();if(!blob.size||blob.size>1000000)throw Error('音频大小无效');if(!/^(audio\/|application\/octet-stream)/i.test(blob.type))throw Error('返回的不是音频');
  const actual=audioAccent(url);if(cache){try{await cache.put(key,new Response(blob,{headers:{'Content-Type':blob.type,'X-Accent':actual,'X-Source':url,'X-License':encodeURIComponent(JSON.stringify(entries[0]?.license||null))}}));const keys=await cache.keys();for(const old of keys.slice(0,Math.max(0,keys.length-40)))await cache.delete(old);}catch{}}
  return {blob,accent:actual,cached:false};
 }
 function html(){return '<section aria-label="单词发音"><div class="row"><label for="wordAccent">发音口音</label><select id="wordAccent" style="width:auto"><option value="en-US">美式英语</option><option value="en-GB">英式英语</option></select><button id="wordSpeak">🔊 单词发音</button><button id="wordSlow">慢速发音</button><button id="wordDictionary">词典音频</button></div><p id="wordAudioStatus" class="meta" role="status">设备英语朗读；词典音频首次需联网，成功下载后缓存最近40条。发音不调用 AI API。</p><audio id="wordRecording" controls hidden preload="none"></audio></section>';}
 function bind(word){const statusNode=document.getElementById('wordAudioStatus');if(!statusNode)return;const status=text=>{if(statusNode.isConnected)statusNode.textContent=text;};const selector=document.getElementById('wordAccent');selector.value=accent;
  selector.onchange=()=>{stop();accent=selector.value;try{localStorage.setItem(prefKey,accent);}catch{}status('已选择'+(accent==='en-US'?'美式':'英式')+'英语；点击播放');};
  document.getElementById('wordSpeak').onclick=()=>say(word,1,status);document.getElementById('wordSlow').onclick=()=>say(word,0.75,status);
  document.getElementById('wordDictionary').onclick=async()=>{stop();const id=epoch;status('正在读取词典音频…');try{const found=await recording(word,accent);if(id!==epoch||!statusNode.isConnected)return;blobURL=URL.createObjectURL(found.blob);player=document.getElementById('wordRecording');player.src=blobURL;player.hidden=false;const fallback=found.accent!==accent?' · 录音口音与所选不同或未标明':'';status('Free Dictionary API · '+(found.cached?'本地缓存':'已取得录音')+fallback+' · 授权以来源条目为准');player.onerror=()=>status('录音无法播放，请使用设备英语朗读');try{await player.play();}catch{status('音频已准备好，请点击下方播放器播放'+fallback);}}catch(e){if(id===epoch)status(e.message+'；可尝试设备英语朗读');}};
 }
 try{window.speechSynthesis?.getVoices();}catch{}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
 return {html,bind,stop,chooseVoice,pickAudio,safeAudio,recording,say};
})();
