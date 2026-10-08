# 免费网址与每日发布：操作说明

本包已准备 GitHub Pages + GitHub Actions 配置，尚未上传到你的账号，尚无实际网站地址。免费 Pages 要使用公开仓库，代码与公共素材会公开；学习作答仍留在各设备浏览器，不在程序包或仓库里。无需填写银行卡或购买服务器。

## 你需要完成

1. 打开 https://github.com/signup 注册免费账号，邮箱验证与账号验证由你完成。
2. 告诉我你的 GitHub 用户名，或注册后提供你创建的仓库链接。用户名不是密码。
3. 新建一个名为 cet6-study 的 Public（公开）仓库，默认分支 main。
4. 将解压出的 cet6-pwa 目录的内容上传到仓库根目录。不要再包一层 cet6-pwa：根目录要能直接看到 package.json、dist 和 .github。隐藏目录 .github 必须上传；个人学习备份、data、public-state 不上传。本下载包已排除这些运行数据。
5. 仓库 Settings → Pages → Build and deployment → Source 选择 GitHub Actions。
6. 仓库 Actions → Publish CET-6 study app → Run workflow。若提示需要启用 Actions，在此仓库启用。等整个任务成功后，在 Pages 页面复制网站网址。
7. 手机和平板用自己的正常网络访问该网址，确认19组初始素材、来源目录与离线准备提示，再添加到主屏幕。网址格式是 https://你的用户名.github.io/cet6-study/，示例不是已经上线的地址。

上传可以由我协助，但需要你先完成注册并在 GitHub 登录或连接账号；本地文件配置完毕不等于已经创建了你的仓库。网页上传若漏掉 .github，定时任务不会存在。

## 自动更新的实际内容

任务目标时间为北京时间每天08:17（平台可能延迟），在 GitHub 的电脑上运行，与你的电脑开关机无关。流程：媒体标题获取 → 六级主题筛选 → 关联已编辑练习 → 发布页面、公共素材和状态文件。手机打开、恢复联网时检查包，离线用旧包。

没有新闻获取成功时，仍发布已有练习并显示失败状态；若缓存可用，保留上次新闻。平台缓存可能回收，失去缓存时退回代码中的19组基础练习。不会把失败标为成功。这里是新闻选题更新，不是每天自动新编、逐句核验报道译文。

新编人工审核素材可修改 dist/daily-feed.json 后提交；自动运行会一并发布。真正的自动新编题还需要生成服务和审核流程，当前配置不包含，也不收取生成费用。

## 验收

- Actions 中首次 Publish CET-6 study app 运行全部成功。
- 手机能打开网站并安装，启动时无程序错误。
- /daily-feed.json 有素材；/news-feed.json 有筛选消息或明确失败；/update-status.json 有真实尝试与成功日期。
- 手机刷新素材成功且离线练习保留，已有作答不被覆盖。
- 下一次定时运行确实出现。公开仓库60天没有活动时，GitHub可能停用定时任务，需到Actions重新启用；定时任务也可能延迟，不能保证精确到分钟。

GitHub在你的手机网络上的访问速度必须实测；能免费托管不代表任何地区、网络都同样顺畅。若你无法访问，不应为了这套方案先付费，届时换合适的托管入口。

官方依据：
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/actions/how-tos/troubleshoot-workflows
- https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows
