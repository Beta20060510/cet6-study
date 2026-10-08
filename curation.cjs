// Transparent theme selection. These rules do not predict examination questions.
const THEMES=[
 {id:'culture',name:'文化与历史',match:/文化|历史|遗产|博物馆|传统|非遗|古籍|heritage|museum|tradition|cultural/i,lesson:'axis',reason:'段落翻译：介绍文化特征、历史价值与保护措施'},
 {id:'education',name:'教育与学习',match:/教育|学生|课堂|学习|读书|人才|学校|education|student|school|learning|university/i,lesson:'ai',reason:'写作：观点、原因、例证；表达：教育与自主学习'},
 {id:'green',name:'环境与绿色发展',match:/绿色|低碳|环保|能源|生态|节能|公共交通|电动|energy|renewable|environment|climate|electric car|recycling/i,lesson:'ev',reason:'段落翻译：发展趋势与措施；写作：个人选择与公共服务'},
 {id:'technology',name:'科技与数字生活',match:/科技|人工智能|数字|创新|AI\b|technology|artificial intelligence|digital|innovation/i,lesson:'ai',reason:'写作：便利与局限、合理使用技术'},
 {id:'society',name:'社会与公共服务',match:/社区|养老|志愿|城乡|城市|交通|乡村|community|volunteer|urban|rural|public transport/i,lesson:'cities',reason:'段落翻译：社会发展与公共服务；写作：问题与建议'}
];
const EXCLUDE=/战争|袭击|伤亡|谋杀|丑闻|博彩|治疗|药物|股票推荐|war\b|attack|killed|murder|scandal|gambling|cancer cure|stock pick/i;
function classify(title){if(EXCLUDE.test(title))return null;const matches=THEMES.filter(t=>t.match.test(title));if(!matches.length)return null;return {...matches[0],score:matches.length,matchedThemes:matches.map(t=>t.name)};}
function select(items,now=Date.now()){return items.map(x=>{const t=classify(x.title);return t?{...x,theme:t.name,themeId:t.id,reason:t.reason,lesson:t.lesson,score:t.score}:null;}).filter(x=>x&&x.published&&Date.parse(x.published)<=now+86400000&&now-Date.parse(x.published)<=7*86400000).sort((a,b)=>b.score-a.score||Date.parse(b.published)-Date.parse(a.published)).filter((x,i,all)=>all.findIndex(y=>y.url===x.url)===i).slice(0,12);}
function build(pack,candidates,day){const materials=candidates.slice(0,3).map((news,i)=>{const base=pack.materials.find(m=>m.id===news.lesson)||pack.materials.find(m=>m.theme.includes(news.theme))||pack.materials[0];return {...base,id:'news-'+day+'-'+i,title:news.theme+' · 今日新闻延伸',theme:news.theme,publisher:news.publisher,sourceUrl:news.url,sourcePublished:news.published.slice(0,10),checkedAt:day,day:i===0?day:undefined,kind:'新闻主题关联 · 原创主题练习',note:'选题线索：'+news.title+'。'+news.reason+'。题干沿用已编辑的主题练习，不是该报道的翻译；新闻事实请阅读来源。',selectionReason:news.reason,newsTitle:news.title};});return {...pack,updatedAt:day,materials:[...materials,...pack.materials.filter(m=>!m.id.startsWith('news-'))],delivery:{mode:'news-linked-edited-templates',day,newExercises:materials.length,sourceCount:new Set(candidates.map(x=>x.publisher)).size}};}
module.exports={THEMES,classify,select,build};
