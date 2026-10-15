/* 演示数据：全部为预置内容，不连接真实行情与交易 */
window.BOBBY_DATA = (() => {
  const S = (text, opt = {}) => ({ text, ...opt });   // 行内片段：{text, b, href}

  const quickActions = [
    { id: 'hot', label: '交易热点', icon: 'assets/img/qa-hot.png', answer: 'market',
      options: ['看看今天市场在聊什么', '本周市场最关注的事件有哪些?', '今天有哪些股票异动值得关注?'] },
    { id: 'picks', label: '智能选股', icon: 'assets/img/qa-picks.png', answer: 'picks',
      options: ['帮我挑一只值得买的股票', '帮我对比几只股票，看看哪只更值得买', '暂无想法，了解最近热门股票'] },
    { id: 'portfolio', label: '持仓分析', icon: 'assets/img/qa-portfolio.png', answer: 'portfolio',
      options: ['帮我诊断我在RockFlow 的持仓', '我的持仓里有没有风险比较大的?', '我的持仓最近表现怎么样？需不需要调仓?'] },
    // 财报分析的三个问题暂无 App 截图，为拟写，待核对
    { id: 'earnings', label: '财报分析', icon: 'assets/img/qa-earnings.png', answer: 'earnings',
      options: ['本周有哪些重要财报值得关注?', '帮我解读一家公司的最新财报', '财报前该怎么提前布局?'] },
  ];

  const placeholders = [
    '美联储三年来首次加息，美股接下来怎么走？',
    '谷歌砸 800 亿 All in AI，值不值？',
    '油价突然跌超3%，能源股现在还能买吗？',
    '英伟达财报前，现在该上车还是观望？',
  ];

  const hotTrades = [
    {
      id: 'ddog', tag: '互联网', time: '19分钟前', img: 'assets/img/hot-1.jpg',
      title: 'RBC Capital维持Datadog跑赢大盘评级，目标价上调至320美元',
      body: 'RBC Capital重申对Datadog的“跑赢大盘”评级，并将目标价上调至320美元，理由是可观测性与AI监控需求加速、大客户扩张强于预期。',
      stocks: [{ label: 'DDOG 跌过 260 · 10/30', chg: '-20.0%', up: false }],
    },
    {
      id: 'spacex', tag: '互联网', time: '25分钟前', img: 'assets/img/hot-2.jpg',
      title: 'SpaceX两个月涨22%，大幅跑赢标普500的1%',
      body: '截至8月11日收盘，SpaceX股价两个月累计上涨22%，同期SPDR标普500 ETF仅上涨1%。',
      stocks: [{ label: 'SPCX 跌过 160 · 11/13', chg: '-11.6%', up: false }],
    },
    {
      id: 'amd', tag: '半导体', time: '40分钟前', img: 'assets/img/hot-3.jpg',
      title: 'AMD发布Helion机架级平台，全力押注智能体AI',
      body: 'AMD推出搭载EPYC CPU与Instinct GPU的开放机架级AI平台Helion，瞄准企业级与大规模智能体AI应用。',
      stocks: [{ label: 'AMD 跌过 582.5 · 10/19', chg: '+143.7%', up: true }],
    },
  ];

  const brief = {
    kicker: '今日关注', ticker: 'DDOG',
    title: 'RBC Capital上调Datadog目标价至320美元，维持跑赢大盘评级',
    summary: [S('iFeng，你尚未授权。今天最受关注的是 RBC Capital上调Datadog目标价至'), S('320美元', { metric: true }), S('，维持跑赢大盘评级。Bobby 建议你先授权，获得更加个性化的金融分析。')],
    prompts: ['问问Bobby如何开始', '今日市场概览'],
  };

  const pro = {
    title: '解锁你的专属投资团队',
    desc: '过去，只有大型基金拥有研究员、交易员与风控团队的配置；现在，你只需打开 Bobby Pro，即可全部享有',
    feats: [
      { label: '机构级投研数据', icon: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>' },
      { label: '24h 自动盯盘', icon: '<path d="M12 3 20 7v5c0 5-3.4 8.5-8 9-4.6-.5-8-4-8-9V7l8-4z"/><path d="m9 12 2 2 4-5"/>' },
      { label: '1w+ 交易策略', icon: '<path d="M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5z"/><path d="M8 7h6M8 11h7M8 15h4"/>' },
      { label: '主动风控策略', icon: '<path d="M4 18h4l8-8a2.8 2.8 0 0 0-4-4l-8 8v4z"/><path d="m14 6 4 4"/><path d="M13 19h7"/>' },
    ],
    cta: '排队抢先体验', ctaSub: '领取 14 天免费试用', badge: '限前 1,000 名',
    note: '前 1,000 名可获得 Bobby Pro 14 天免费试用资格',
  };

  const onboarding = {
    title: '请问您的投资经验如何?',
    sub: '先认识你一点，让我更懂你的节奏。',
    options: [
      { id: 'new', title: '新手入门', sub: '刚开始学习，需要多点指导。', color: '#3b6e6a',
        icon: '<path d="M12 6.5C10.2 5 7.6 4.5 4 4.8v13c3.6-.3 6.2.2 8 1.7 1.8-1.5 4.4-2 8-1.7v-13c-3.6-.3-6.2.2-8 1.7z"/><path d="M12 6.5v13"/>' },
      { id: 'some', title: '有些经验', sub: '懂基本术语，有实盘经验。', color: '#9a7a3a',
        icon: '<path d="M5 19v-3M9 19v-6M13 19v-4M17 19v-8"/><path d="m4 11 5-4 4 3 7-6"/><path d="M16 4h4v4"/>' },
      { id: 'pro', title: '非常专业', sub: '追求效率，直接聊数据和策略。', color: '#4a5b8a',
        icon: '<path d="M4 4v16h16"/><rect x="8" y="9" width="3" height="6" rx="1"/><rect x="14" y="7" width="3" height="6" rx="1"/><path d="M9.5 7v2M9.5 15v2M15.5 5v2M15.5 13v2"/>' },
    ],
  };

  /* ---------- 回答内容 ---------- */
  const steps = (...rows) => rows.map(([label, live, meta]) => ({ label, live, meta }));

  const answers = {
    tesla: {
      topic: 'tesla', tickers: ['TSLA'],
      steps: steps(['正在理解你的问题，确定分析框架', '读取你的问题', '准备分析'], ['检索乘联会与最新新闻', '已读取 14 条来源', '检索资料'], ['拉取交付、出口与行情数据', 'TSLA · 乘联会 · CNEVPost', '整理数据'], ['形成观点与跟踪指标', '整理结论', '生成回答']),
      blocks: [
        { t: 'h2', c: [S('判断')] },
        { t: 'p', c: [S('这条热点对 TSLA 是边际利好，但更准确的解读是“上海工厂靠出口维持高利用率”，而不是“中国需求已经复苏”。', { b: true })] },
        { t: 'p', c: [S('9 月出口确实很强，特斯拉中国市场表现也好于行业，但国内销量同比仍在下降。因此，这体现的是'), S('供应链和全球调配韧性', { b: true }), S('，暂时还不是销量、价格与利润率同步改善的拐点。')] },
        { t: 'p', c: [S('以下基于截至 10 月 12 日更新的乘联会数据和最新行情解读。')] },
        { t: 'hr' },
        { t: 'h2', c: [S('一、9 月数据究竟强在哪里？')] },
        { t: 'h3', c: [S('特斯拉上海工厂')] },
        { t: 'table', head: ['指标', '2026 年 9 月', '同比'], rows: [['批发销量', '95,366 辆', '+5.0%'], ['中国国内销量', '64,837 辆', '-9.4%'], ['出口', '30,529 辆', '+58.3%'], ['出口占批发比例', '32.0%', '去年同期约 21.2%']] },
        { t: 'p', c: [S('95,366 辆是特斯拉上海工厂 '), S('2026 年单月最高批发量', { b: true }), S('；其中出口同比增长 58.29%，是总量同比仍能增长的主要原因。'), S('CNEVPost', { href: '#' })] },
        { t: 'p', c: [S('但国内销量从去年同期的 71,525 辆降到 64,837 辆，说明'), S('国内需求仍在承压', { b: true }), S('，出口在替国内“补位”。')] },
        { t: 'h2', c: [S('二、接下来重点跟踪什么')] },
        { t: 'ol', items: [
          [S('中国国内销量能否连续两个月恢复同比增长', { b: true }), S('单月环比大涨不够，国内同比转正才算需求改善。', { sub: true })],
          [S('出口能否保持同比增长，而不是单月调配', { b: true }), S('上海工厂经常存在月份间出口节奏差异，需要看连续数据。', { sub: true })],
          [S('海外注册量是否同步上升', { b: true }), S('用来区分终端需求与渠道装运。', { sub: true })],
          [S('汽车业务毛利率和促销力度', { b: true }), S('销量增长如果来自更大优惠，对盈利未必是好事。', { sub: true })],
          [S('批发与零售差距是否收窄', { b: true }), S('如果行业继续出现批发强、零售弱，库存和价格压力可能向后传导。', { sub: true })],
        ] },
        { t: 'h2', c: [S('一句话落地')] },
        { t: 'p', c: [S('这条热点证明特斯拉上海工厂有很强的全球产能调配能力，是运营利好；但国内销量仍同比下降、出口环比也回落，所以它还不是中国需求反转或利润率改善的证据。对 '), S('TSLA 短线偏正面，追高则需要先突破 388.67 美元确认', { b: true }), S('。')] },
      ],
    },
    market: {
      topic: 'market',
      steps: steps(['正在理解你的问题，确定分析框架', '读取你的问题', '准备分析'], ['扫描三大指数与板块资金流', '已覆盖 11 个板块', '检索资料'], ['筛选涨跌幅异动个股', '美股 · 盘前 · 期权', '整理数据'], ['归纳主线与风险', '整理结论', '生成回答']),
      blocks: [
        { t: 'lead', c: [S('以下为今日美股盘面速览。')] },
        { t: 'h2', c: [S('一、指数表现')] },
        { t: 'table', head: ['指数', '收盘', '涨跌'], rows: [['标普 500', '6,712.4', '+0.62%'], ['纳斯达克', '22,840.1', '+1.08%'], ['道琼斯', '46,215.7', '-0.14%'], ['VIX', '15.3', '-4.2%']] },
        { t: 'h2', c: [S('二、谁在狂飙，谁在跳水')] },
        { t: 'ul', items: [
          [S('AI 算力链继续走强：', { b: true }), S('AMD 发布 Helion 平台后带动服务器与存储板块，存储芯片涨幅居前。')],
          [S('IREN 强势反弹：', { b: true }), S('获 Anthropic 多年期云合作，一周跌幅收复近半。')],
          [S('能源股承压：', { b: true }), S('油价单日跌超 3%，上游勘探公司领跌。')],
        ] },
        { t: 'h2', c: [S('一句话落地')] },
        { t: 'p', c: [S('今天的主线仍是 '), S('AI 基础设施', { b: true }), S('，资金从防御板块流向成长板块；短线注意财报季前的波动放大，仓位不宜一次打满。')] },
      ],
    },
    start: {
      steps: steps(['正在理解你的问题', '读取你的问题', '准备分析'], ['整理新手上手路径', '3 步完成设置', '生成回答']),
      blocks: [
        { t: 'p', c: [S('欢迎来到 Bobby！我是你的 24 小时 AI 投资助手。三步就能用起来：')] },
        { t: 'ol', items: [
          [S('授权你的账户', { b: true }), S('授权后我能看到你的持仓，给出更个性化的分析和提醒。', { sub: true })],
          [S('告诉我你关心什么', { b: true }), S('比如“英伟达财报前该怎么操作”，或者直接点首页的交易热点。', { sub: true })],
          [S('打开 Bobby Pro', { b: true }), S('获得机构级数据、24 小时自动盯盘和主动风控策略。', { sub: true })],
        ] },
        { t: 'callout', c: [S('小提示：', { b: true }), S('首页每天会推送“每日简报”，点开就能看到和你最相关的一条市场变化。')] },
      ],
    },
    picks: {
      steps: steps(['正在理解你的问题', '读取你的问题', '准备分析'], ['按催化剂与动量筛选', '已扫描 4,812 只股票', '检索资料'], ['校验估值与流动性', '剩余 5 只', '整理数据'], ['生成选股清单', '整理结论', '生成回答']),
      blocks: [
        { t: 'lead', c: [S('筛选条件：近 30 日有明确催化、成交额 > 5 亿美元、动量排名前 20%。')] },
        { t: 'table', head: ['代码', '催化剂', '近 1 月'], rows: [['AMD', 'Helion 平台发布', '+18.4%'], ['IREN', 'Anthropic 云合作', '+9.7%'], ['DDOG', 'RBC 上调目标价', '+6.1%'], ['TSLA', '9 月出口创新高', '+4.3%'], ['MU', '存储涨价周期', '+12.9%']] },
        { t: 'h3', c: [S('怎么用这份清单')] },
        { t: 'ul', items: [
          [S('动量股适合', { b: true }), S('分批建仓，单只不超过总仓位 10%。')],
          [S('催化剂兑现后', { b: true }), S('注意“利好出尽”，设置跟踪止盈。')],
        ] },
      ],
    },
    portfolio: {
      topic: 'portfolio',
      steps: steps(['正在理解你的问题', '读取你的问题', '准备分析'], ['读取账户授权状态', '尚未授权', '生成回答']),
      blocks: [
        { t: 'p', c: [S('你还没有授权账户，我暂时看不到你的持仓。')] },
        { t: 'p', c: [S('授权后我可以帮你：')] },
        { t: 'ul', items: [[S('看清仓位集中度与行业暴露')], [S('计算组合回撤与波动，提示风险')], [S('每天早上推送和你持仓相关的新闻')]] },
        { t: 'callout', c: [S('也可以先告诉我你持有哪些股票，比如“我有 TSLA 和 NVDA 各一半”，我先帮你做一次简版分析。')] },
      ],
    },
    earnings: {
      steps: steps(['正在理解你的问题', '读取你的问题', '准备分析'], ['拉取本周财报日历', '共 38 家公司', '检索资料'], ['对比一致预期与期权隐含波动', '整理数据', '整理数据'], ['生成重点清单', '整理结论', '生成回答']),
      blocks: [
        { t: 'lead', c: [S('本周重点财报：')] },
        { t: 'table', head: ['公司', '日期', '隐含波动'], rows: [['TSLA', '10/21 盘后', '±8.9%'], ['NFLX', '10/16 盘后', '±7.2%'], ['TSM', '10/16 盘前', '±5.1%'], ['JPM', '10/14 盘前', '±3.4%']] },
        { t: 'h3', c: [S('最值得看的一家：TSLA')] },
        { t: 'p', c: [S('9 月上海出口创新高已经部分反映在股价里，财报的关键是 '), S('汽车业务毛利率', { b: true }), S('能否企稳在 17% 以上；低于预期时股价波动可能放大。')] },
      ],
    },
  };

  /* 热点卡片“分析交易策略”的回答 */
  hotTrades.forEach(h => {
    const [s1, s2] = h.stocks;
    answers['hot-' + h.id] = {
      topic: 'hot-' + h.id, tickers: [s1.label.split(' ')[0]],
      steps: steps(['正在理解你的问题，确定分析框架', '读取你的问题', '准备分析'], ['检索新闻原文与相关报道', '已读取 9 条来源', '检索资料'], ['拉取 ' + s1.label.split(' ')[0] + ' 行情与期权数据', s1.label.split(' ')[0] + ' · 期权链 · 资金流', '整理数据'], ['生成交易策略', '整理结论', '生成回答']),
      blocks: [
        { t: 'lead', c: [S('交易热点：' + h.title)] },
        { t: 'h2', c: [S('一、发生了什么')] },
        { t: 'p', c: [S(h.body)] },
        { t: 'h2', c: [S('二、市场怎么定价')] },
        { t: 'table', head: ['预测', '截止', '涨跌'], rows: h.stocks.map(s => { const [name, date] = s.label.split(' · '); return [name, date || '—', s.chg]; }) },
        { t: 'h2', c: [S('三、交易策略')] },
        { t: 'ol', items: [
          [S('激进：', { b: true }), S('消息驱动的第一天波动最大，可以小仓位顺势参与，止损设在消息前收盘价下方。')],
          [S('稳健：', { b: true }), S('等回踩确认后分两到三笔建仓，单笔不超过计划仓位的 40%。')],
          [S('观望：', { b: true }), S('如果你已有较重仓位，这条消息更适合作为持有理由，而不是加仓理由。')],
        ] },
        { t: 'callout', c: [S('风险提示：', { b: true }), S('以上内容不构成投资建议。')] },
      ],
    };
  });

  const generic = (q) => ({
    steps: steps(['正在理解你的问题，确定分析框架', '读取你的问题', '准备分析'], ['检索相关新闻与行情', '已读取 10 条来源', '检索资料'], ['整理关键数据', '行情 · 新闻 · 研报', '整理数据'], ['形成观点', '整理结论', '生成回答']),
    blocks: [
      { t: 'lead', c: [S('关于“' + q + '”，以下是我的简要看法。')] },
      { t: 'h2', c: [S('一、核心判断')] },
      { t: 'p', c: [S('短期看，市场对这件事已经有一定预期，'), S('真正决定方向的是接下来两周的数据验证', { b: true }), S('；中长期则取决于盈利能否兑现。')] },
      { t: 'h2', c: [S('二、值得留意的风险')] },
      { t: 'ul', items: [[S('预期落空：', { b: true }), S('如果接下来的数据不及预期，已经计入价格的部分会回吐。')], [S('板块联动：', { b: true }), S('同一主题的股票往往一起涨跌，分散效果比看上去小。')], [S('仓位集中：', { b: true }), S('单一主题占比越高，这类消息对你的影响越大。')]] },
      { t: 'callout', c: [S('以上内容不构成投资建议。')] },
    ],
  });

  const history = [
    { id: 'h-market', title: '今日美股大波动：谁在狂飙谁在跳水', time: '今天 22:05', q: '今日美股大波动：谁在狂飙谁在跳水？', a: 'market' },
    { id: 'h-tesla', title: '特斯拉出口硬刚中国车市降温', time: '今天 17:49', q: '帮我全面解读一下这个交易热点：中国汽车市场放缓，特斯拉强劲出口展现韧性', a: 'tesla' },
  ];

  /* ---------- 投资卡片（新功能）演示数据 ---------- */
  // 股票库：tech 计入科技集中度，lev 为杠杆倍数，index 宽基，div 高股息；color 用于头像与构成条
  const universe = {
    NVDA: { name: '英伟达', tech: 1, color: '#5b45c9' },
    TSLA: { name: '特斯拉', tech: 1, color: '#8f7bff' },
    TQQQ: { name: '纳指三倍做多 ETF', tech: 1, lev: 3, color: '#3a62fd' },
    AAPL: { name: '苹果', tech: 1, color: '#6b7280' },
    MSFT: { name: '微软', tech: 1, color: '#2f7fd8' },
    AMD: { name: '超威半导体', tech: 1, color: '#d4583b' },
    GOOGL: { name: '谷歌', tech: 1, color: '#3b8f5c' },
    AMZN: { name: '亚马逊', tech: 1, color: '#c98a1c' },
    META: { name: 'Meta 平台', tech: 1, color: '#3a6fd8' },
    PLTR: { name: '数据分析软件', tech: 1, color: '#2b2f38' },
    DDOG: { name: '云监控软件', tech: 1, color: '#7a4fc4' },
    SPCX: { name: '太空探索', tech: 1, color: '#30343c' },
    SPY: { name: '标普 500 ETF', index: 1, color: '#2f8f83' },
    QQQ: { name: '纳指 100 ETF', index: 1, tech: 1, color: '#4c6ed8' },
    KO: { name: '可口可乐', div: 1, color: '#d23b3b' },
    JPM: { name: '摩根大通', div: 1, color: '#5d6b82' },
    CASH: { name: '美元余额', cash: 1, color: '#c9ccd4' },
  };

  // 演示持仓截图的识别结果（比例按截图市值折算）与识别动画的标注框（相对截图的百分比）
  const demoImport = {
    img: 'assets/img/demo-holdings.png',
    holdings: [{ t: 'NVDA', w: 40 }, { t: 'TSLA', w: 30 }, { t: 'TQQQ', w: 20 }, { t: 'CASH', w: 10 }],
    mask: [[7, 19.6, 36, 4.6], [7, 28.6, 86, 2.8], [47, 40.2, 46, 6.2], [47, 48.4, 46, 6.2], [47, 56.6, 46, 6.2], [70, 64.6, 23, 3.2]],
    rows: [[6, 39.4, 88, 7.6], [6, 47.6, 88, 7.6], [6, 55.8, 88, 7.6], [6, 63.6, 88, 5.2]],
  };

  const pickList = ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMD', 'GOOGL', 'AMZN', 'META', 'PLTR', 'SPY', 'QQQ', 'KO'];

  const questions = [
    { id: 'dip', title: '买入后一个月跌了 20%，你会？', sub: '没有标准答案，选最像你的那个。',
      options: [['add', '加仓摊低', '觉得更便宜了'], ['hold', '拿着不动', '相信当初的判断'], ['cut', '先卖掉', '不想再看它跌'], ['unsure', '说不好', '还没遇到过']] },
    { id: 'horizon', title: '这笔钱打算放多久？', sub: '决定 Bobby 讲解时更看短期波动还是长期逻辑。',
      options: [['short', '几个月内', '可能随时要用'], ['mid', '一两年', '中间不太会动'], ['long', '五年以上', '放着慢慢长']] },
  ];
  const prefLabels = {
    exp: { new: '新手', some: '有些经验', pro: '非常专业' },
    dip: { add: '跌了会加仓', hold: '跌了会拿住', cut: '跌了先离场', unsure: '还没想好跌了怎么办' },
    horizon: { short: '短线', mid: '中线', long: '长线' },
  };

  // 称号：按顺序匹配第一条；只描述持仓结构，每个都配一条盲点，不夸奖高风险
  // 称号：desc 写「这类投资者是什么样」，blind 写盲点；只描述持仓结构，不夸奖高风险
  const personas = {
    single: { title: '单核信仰者', en: 'The Single-Core Believer', desc: '认准一条主线，把大部分仓位押在同一个方向上，相信自己看准的赛道会一直赢。', blind: '几只股票看着分散，押的其实是同一个赌注：科技股一起跌时，没有东西能接住你。' },
    lever: { title: '三倍速玩家', en: 'The 3x Rider', desc: '习惯用工具放大判断，追求速度和弹性，对短期涨跌的容忍度高。', blind: '杠杆每天重置，震荡市里不涨不跌，也会慢慢磨掉本金。' },
    index: { title: '躺平指数派', en: 'The Index Napper', desc: '不想天天盯盘，相信长期跟着市场整体走就够了。', blind: '稳是稳，但容易错过自己真正看好的机会。' },
    div: { title: '收息包租公', en: 'The Dividend Landlord', desc: '看重稳定的现金流，宁可涨得慢，也要拿得住、睡得着。', blind: '利率一变，股息股也会跟着晃。' },
    multi: { title: '多线并行者', en: 'The Multi-Threader', desc: '同时押几条不同的线，不把鸡蛋放在一个篮子里。', blind: '分散了不少，但要留意哪几只其实在同涨同跌。' },
    scout: { title: '场边观察员', en: 'The Sideline Scout', desc: '还在场边看，先把公司和节奏看明白，再决定什么时候下场。', blind: '看了很久，还没想清楚自己能承受多大的跌幅。' },
  };
  const scoutBlind = {
    add: '想着跌了就加仓，但还没算过最多能加到多少。',
    hold: '说会拿住，但还没经历过真实的账面亏损。',
    cut: '跌了先离场能保护本金，也可能刚好卖在最低点。',
  };

  // 「第二天」的昨夜行情（演示用假数据）：简报与回答按卡片比例现算
  const overnight = {
    ndx: -2.1,
    moves: { NVDA: -2.4, TSLA: -1.8, TQQQ: -6.2, AAPL: -1.1, MSFT: -1.3, AMD: -3.1, GOOGL: -1.5, AMZN: -1.7, META: -2.0, PLTR: -4.4, DDOG: -2.6, SPCX: -1.9, SPY: -1.2, QQQ: -2.1, KO: 0.4, JPM: -0.3, CASH: 0 },
  };
  // 第一天记下的股票，第二天简报里带一句
  const recallNews = { AMD: 'Helion 首批客户名单本周公布', DDOG: '目标价上调后仍有买盘', PLTR: '新合同消息推动成交放大', SPCX: '下一次发射窗口定在月底' };

  // 每条消息和卡片里每只股票的关系：[相关度 0–3, 说明]；没列出的按类别给默认值
  const relevance = {
    'hot-amd': { AMD: [3, '消息主角'], NVDA: [3, '直接竞争：Helion 打的是英伟达主场'], TQQQ: [2, '通过纳指里的 AI 权重间接受影响'], QQQ: [2, '通过纳指里的 AI 权重间接受影响'], MSFT: [1, 'AI 算力的买家，影响偏间接'], GOOGL: [1, 'AI 算力的买家，影响偏间接'], AMZN: [1, 'AI 算力的买家，影响偏间接'], META: [1, 'AI 算力的买家，影响偏间接'] },
    'hot-ddog': { DDOG: [3, '消息主角'], MSFT: [1, '同为云软件，情绪联动'], TQQQ: [1, '纳指成分里占比很小'] },
    'hot-spacex': { SPCX: [3, '消息主角'], TSLA: [1, '同一位创始人，情绪联动'] },
    tesla: { TSLA: [3, '消息主角'], TQQQ: [1, '纳指成分里占比有限'], QQQ: [1, '纳指成分里占比有限'] },
  };

  const pfNote = { t: 'callout', c: [S('以上基于你在投资卡片里提供的持仓比例，只描述风险暴露，不构成投资建议。')] };

  const profileKit = { universe, demoImport, pickList, questions, prefLabels, personas, scoutBlind, overnight, recallNews, relevance, pfNote };

  /* 根据用户输入挑选回答 */
  const pick = (q) => {
    if (/特斯拉|TSLA|tesla/i.test(q)) return answers.tesla;
    if (/大盘|美股|市场概览|波动|狂飙/.test(q)) return answers.market;
    if (/如何开始|怎么用|新手|授权/.test(q)) return answers.start;
    if (/选股/.test(q)) return answers.picks;
    if (/持仓/.test(q)) return answers.portfolio;
    if (/财报/.test(q)) return answers.earnings;
    if (/AMD|Helion/i.test(q)) return answers['hot-amd'];
    if (/Datadog|DDOG/i.test(q)) return answers['hot-ddog'];
    if (/SpaceX|SPCX/i.test(q)) return answers['hot-spacex'];
    return generic(q.length > 24 ? q.slice(0, 24) + '…' : q);
  };

  return { quickActions, placeholders, hotTrades, brief, pro, onboarding, answers, history, pick, generic, steps, S, profileKit };
})();
