# 次元热度 TagHeat · A 期题材风向

二次元网文标签热度站：综合/分源榜 + **套路 / 萌属性 / IP / 题材** 筛选。

```bash
cd ../novel-heat && npm run crawl
cd ../次元热度 && node scripts/sync-from-novel-heat.js && node scripts/serve.js
```

数据来自 `novel-heat` 专区采集；`acg-dict.json` 供类型分榜（萌娘百科仅作词典扩充，失败则用种子）。
