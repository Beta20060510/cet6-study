# 每日新编题：接入与人工审核

本补丁增加每天1道段落翻译（180–230字）、一段4分钟短译、1个写作任务与40–60词范例、句式及易错点。它与新闻标题关联流程分开记状态。尚未真实调用收费API，也尚未上传到你的已上线仓库。

## 先创建 API 密钥

1. 打开 https://platform.deepseek.com/ ，按页面提示注册或登录。聊天账号能否直接使用以平台当前提示为准。
2. 找到 API keys / API 密钥，创建密钥，名称可填 cet6-study。复制后只在自己安全位置保管，不发送给他人。
3. 查看余额与充值页面当前最低金额。不要开启自动充值；超过20元预算先停止。密钥创建本身不表示已充值，也不表示API已经可调用。
4. 在模型文档 https://api-docs.deepseek.com/quick_start/pricing 查询当前可用模型标识与价格，不要照搬过期的 deepseek-chat 名称。

## 更新程序

上传补丁中的根目录文件与 dist/library.js，保持目录结构；使用 GitHub 编辑器替换 .github/workflows/daily-pages.yml，避免隐藏目录漏传。检查配置顶部仍有 name 和 on。上传会替换同名文件，但不会触碰浏览器里的学习作答。

## GitHub 中保存密钥（只需你自己完成）

打开 https://github.com/Beta20060510/cet6-study/settings/secrets/actions

Secrets 标签 → New repository secret：
- Name: AI_API_KEY
- Secret: 你刚创建的真实密钥

Variables 标签 → New repository variable：
- AI_BASE_URL = https://api.deepseek.com
- AI_MODEL = 开放平台当前支持的模型标识（从官方模型表复制）
- AI_AUTO_PUBLISH = false（默认人工审核阶段；不填也是 false）

密钥不能放在 Variables、代码、截图、素材JSON或网页里。配置值只传给生成步骤，测试步骤不会调用真实付费API。提交代码的人可以修改工作流访问密钥，所以只授予可信维护者仓库写权限。

## 首次验证

Actions → Publish CET-6 study app → Run workflow。查看结果页 Artifacts，下载 daily-draft-运行编号。里面的日期JSON会记录 ready 或 failed；网站 update-status.json 的 generation 字段会记录 not-configured、awaiting-review、published-reviewed、published-auto 或 failed。

配置缺失：不调用API。来源正文不足：不生成。每日最多尝试一次，每次最多两个AI调用（生成和复核），无自动付费重试。缓存保留时同日重复运行复用草稿；GitHub缓存丢失后可能重新调用，因此这不是严格人民币预算锁。充值余额/服务商消费限制才是费用上限；程序并不保证20元每月一定够。不会请求学生作答，也不会把密钥写入发布文件。文档解析失败或来源禁止访问时不绕过限制。

## 审核后发布（建议先试运行几天）

1. 解压草稿JSON，检查 material 内题干、参考译文、写作句式，以及 evidence 原文依据与 sourceUrl 报道。自动复核不是事实真实性保证。
2. 若无修改且确认质量，把文件顶部 approved 的 false 改成 true。
3. 上传到仓库 reviewed/日期.json（例如 reviewed/2026-10-08.json），保留整个文件及 contentHash。应在该北京时间日期内提交。
4. 新提交自动触发发布，页面标注“AI 辅助新编 · 人工确认”。若要改题目文字，原hash会失效；可把修改后的题目按现有人工素材格式加入 dist/daily-feed.json，再运行 refresh-bundle.cjs 更新离线种子。

人工确认文件发布不依赖缓存存在。只接收当天通过内容hash校验的文件；上次发布的AI题保留最近30道。这里 approved:true 是维护者确认，程序无法替代人工责任或鉴别谁实际看过题目。

## 后续自动发布（可选）

稳定后自己将 AI_AUTO_PUBLISH 改成 true，已通过两步自动检查的草稿就会发布。页面必须保留“仅经自动检查、未经人工核验”的提示。失败仍保留旧题。AI_MODEl、价格变化、抓取阻断都可能导致停止新增，查看 generation 状态而不要只看整个发布任务的绿色勾。

## 已知边界

正文采集仅针对既有白名单媒体候选链接；目前并未自动抓取来源目录中的所有网站。HTML提取可能含无关段落，人工检查来源关系。严格词数/字数与JSON格式会拒绝不合格结果，初期可能部分日期无新题。没有用户登录/云端作答同步。后台工作不依赖手机持续打开；手机联网刷新后才下载发布的新题。
