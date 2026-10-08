# 可选自动跨设备同步设计（未接入 MVP）

## 本地优先

继续把答题与计时写入本地；若开启云同步，同时写入 IndexedDB 的 outbox。联网时后台推送，断网时排队，服务失败不阻止学习。MVP 当前使用 localStorage 与手动 JSON 迁移；启用云同步前应把存储层迁移为 IndexedDB 事务，保证本地记录与 outbox 原子保存。

## 账号与接口

通过 HTTPS 后端接入邮箱验证或通行密钥登录；使用 HttpOnly、Secure、SameSite cookie，不把服务密钥放进网页。数据库按 authenticated user_id 隔离，后端校验所有 session / answer 所属用户。

- `POST /api/sync/push`：上传 `{deviceId, baseRevision, events}`；每个 event 使用 UUID 去重；服务器返回确认 revision。
- `GET /api/sync/pull?cursor=...`：返回 cursor 后的事件与新 cursor；可分批传输，恢复失败重试。
- `GET /api/sync/status`：最近同步时间和冲突数。
- `DELETE /api/account/data`：用户确认后删除个人云数据，本地可独立保留或清理。

服务器不信任客户端 user_id 或到期时间；登录身份决定分区，schema 和大小限制保护数据。推送使用幂等事件 ID；指数退避，不每次输入都发网络请求。

## 冲突规则

每个轮次使用随机 UUID，不同设备新建的不同轮次直接合并。答案按 `{sessionId, taskId}` 存储版本；同一答案在两设备并发修改时保留两个版本，显示“选用手机答案 / 选用平板答案”，避免静默覆盖。只用 last-write-wins 可能受设备时钟偏差影响，因此用服务器 revision 和 baseRevision 检测并发。

同一训练轮次的计时只能由一台设备持有短期 lease；另一台只读，显式接管后旧设备暂停。离线双端学习时各自分叉为不同 sessionId，重新联网保留两轮历史；**不能累加两个设备的累计时间**。词汇复习事件按服务端逻辑序列重放，重新计算 reps 与 due，避免两个设备重复加倍学习次数。

## 产品开关

默认关闭。用户登录并开启后显示“最近同步 / 等待联网 / 有冲突”，提供“立即同步、退出账号、下载备份”。手机到平板接力：手机暂停并推送 → 平板拉取 → 获取训练 lease → 继续。账号退出时移除会话凭据，明确让用户选择保留或移除本地学习数据。

## 验收

断网输入十次只产生十个独立 event；重传不会重复评分；两设备并发答案能选版本；同一 session 计时不双计；跨账号无法读写；服务异常可继续离线；退出后停止同步；换设备后继续停留在正确题目与剩余时间。
