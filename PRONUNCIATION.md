# 单词发音升级

词卡新增单词发音、0.75倍慢速发音、美式/英式选择、词典音频播放器。设备英语朗读是系统合成语音，不能标为真人录音；系统未提供目标口音时明确提示替代口音。词典录音来自 Free Dictionary API 返回的公开发音链接，当前只接受 api.dictionaryapi.dev 和 ssl.gstatic.com 的HTTPS媒体地址。

首次词典录音需联网。成功下载后缓存最近40条，以避免无限占用手机空间；浏览器清理网站数据会删除这些缓存。程序升级保留发音缓存。离线设备朗读只选择本地英语声音，没有本地声音时提示使用已缓存录音。系统语音下载、音量、静音模式、浏览器支持和第三方访问限制都可能影响效果，不保证所有设备都具有英美两种声音。

点播放只传单词给公开词典/设备语音服务，不提交答案，不调用 DeepSeek API。若用户曾使用在线系统声音，系统可能把朗读文本发给其语音服务；本地声音优先用于所选口音，离线只选本地声音。来源授权以词典响应条目为准。

部署：把补丁内 dist 文件夹及 publish-static.cjs、checks-pronunciation.cjs、package.json、PRONUNCIATION.md 一起上传仓库根目录并提交。dist 会更新 app.js、index.html、sw.js，增加 pronunciation.js。自动发布后刷新学习页面，若旧页仍未更新，关掉旧标签再打开。不要清除网站数据，以免删除学习进度。

验收：手机点击单词发音与慢速，确认能听见；切换口音观察实际声音提示；联网下载一条词典录音，再断网播放同一个词；切换词卡或暂停时发音停止。计时与作答照常保存。真实手机、平板的音频尚需由使用者试听，模拟测试不等于已听到声音。

参考：https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices 、https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService 、https://dictionaryapi.dev/
