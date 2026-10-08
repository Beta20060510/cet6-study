# 腾讯云单词发音接入（0.7.0）

使用腾讯云基础语音合成接口TextToVoice，2019-08-23版本，英语精品音色101050（WeJack），16kHz MP3。该音色官方标注为英语，未标注英美口音，因此本站音频不承诺所选英美口音一致，界面会提示。音频为AI合成，不是词典真人录音。

官方说明：https://cloud.tencent.com/document/api/1073/37995

音色列表：https://cloud.tencent.com/document/product/1073/92668

## 发布方法

1. 在仓库根目录上传包内dist文件夹和所有根目录文件，保持目录结构并提交。
2. 必须更新.github/workflows/daily-pages.yml：在node publish-static.cjs步骤的env中增加下面两行，与AI_API_KEY保持同样缩进。

```yaml
          TENCENT_SECRET_ID: ${{ secrets.TENCENT_SECRET_ID }}
          TENCENT_SECRET_KEY: ${{ secrets.TENCENT_SECRET_KEY }}
```

包内提供完整工作流，可在GitHub打开现有工作流、点击编辑后替换全文。GitHub Secrets中应已保存真实值。不要在代码里填真实密钥，不要把值放入Variables。新增两行提交会触发发布。

3. Actions发布成功后打开网站的word-audio.json，generation.provider应为Tencent Cloud TTS，totalRecordings应大于0，entries中应有sustainable等词。首次生成顺序与词库相同，最多10个词。
4. 学习页面点击单词发音，优先取得本站音频；出现“本站 · 腾讯云英语合成”并听到声音才是实际播放成功。手机禁止自动播放时点击下方播放器。重复播放已生成音频不再调用腾讯云。

## 生成范围与费用

首次按北京时间当天最多尝试10次请求，验证成功后下一天最多200次。每次发布最多执行约180秒，达到次数或时间上限保留进度，后续发布继续补充。全部词库尚未一次性生成完毕。

生成与计数保存在GitHub Actions缓存public-state，调用前先记录次数。遇到任何错误立即停止，当天不自动重试，避免失败时持续调用；第二天再尝试。缓存被清理或驱逐后可能重新计数或重新生成，这不是腾讯云账户的硬性费用上限。免费额度和实际费用以腾讯云控制台为准，代码不启用后付费，不充值、不购买资源包。

保存的音频与来源清单是公共资源，不含用户作答、SecretId、SecretKey或签名。网页只下载已发布音频，不直接调用腾讯云；最近40条成功播放的音频在本设备缓存，支持离线。

## 如何看错误

generation.errors保留腾讯云错误代码，不发布服务端错误全文。常见代码：AuthFailure.SignatureFailure可能是密钥不匹配；UnauthorizedOperation可能是子账号缺少权限；InvalidParameterValue.AppIdNotRegistered表示需要开通服务；RequestTimeout／NetworkUnavailable表示采集端连接问题。具体以腾讯云返回代码及官方文档为准。

本地检查使用模拟API，验证官方签名示例、英语参数、文件格式、首次限额、每日扩展、失败停止、已有音频保留和密钥不出现在发布清单。没有访问GitHub Secrets，也未调用真实收费API。真实采集和手机声音须发布后核验。
