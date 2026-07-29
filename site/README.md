# 次元热度 TagHeat · 细分二次元风向

默认综合榜 = **细分标签**（套路 / 萌属性 / IP / 细分题材）；频道与粗题材另开 Tab。

```bash
cd ../novel-heat && npm run crawl && npm run build-data
cd ../次元热度 && node scripts/sync-from-novel-heat.js && node scripts/serve.js
```

同步复制 `novel-heat/data/public/*`（权威综合结果），本站不再二次合成。主源：刺猬猫、SF、起点。萌娘百科只作词典。
