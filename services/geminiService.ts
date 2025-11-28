import { PlayerStats, QuizQuestion, RandomEvent, NPCDef, PaperResult, Reward } from "../types";

// --- STATIC DATABASE ---

// 1. Paper Generation Data
const TITLE_PREFIXES = ["基于", "面向", "一种", "多模态", "深度", "自适应", "异构", "量子", "云原生"];
const TITLE_SUBJECTS = ["卷积神经网络", "摸鱼行为", "咖啡因摄入", "导师画饼", "实验室内卷", "发际线后移", "外卖配送效率", "拖延症晚期", "水论文技巧"];
const TITLE_SUFFIXES = ["的可持续性研究", "的性能优化", "的自动化生成", "的崩溃分析", "之异构计算", "的拓扑结构分析", "在科研中的应用", "的理论与实践"];

const REVIEWS = {
    REJECTED: [
        "创新性不足，且图表像小学生画的。",
        "建议改投《故事会》，本文逻辑无法自洽。",
        "实验数据太少，结论全靠编。",
        "英语语法错误太多，且缺少对比实验。",
        "Reviewer #2 认为你的方法早在 1990 年就被证伪了。",
        "Introduction 写得像散文，Method 写得像谜语。"
    ],
    MINOR: [
        "工作扎实，建议润色语言。",
        "补两个实验即可，图3不仅清楚，而且美观。",
        "很有趣的发现，但参考文献引用不足。",
        "整体不错，修正几个拼写错误后接收。",
        "逻辑清晰，数据详实，稍微解释一下参数设置。"
    ],
    ACCEPTED: [
        "天才般的构思！建议直接获得诺贝尔奖。",
        "解决了困扰学术界多年的难题（比如午饭吃什么）。",
        "This is a seminal work. Accepted as is.",
        "完美的工作，无可挑剔。",
        "不仅解决了问题，还提出了新的问题，非常深刻。"
    ]
};

// 2. Quiz Data
const QUIZ_BANK: QuizQuestion[] = [
    {
        question: "研究生在实验室最不需要的器官是？",
        options: ["肝 (Liver)", "心脏", "头发", "胃"],
        correctIndex: 2,
        explanation: "正所谓'聪明绝顶'，头发乃身外之物。",
        difficulty: "novice"
    },
    {
        question: "导师发微信说'最近怎么样'，潜台词是？",
        options: ["关心你的生活", "想请你吃饭", "论文进度呢？", "不仅是进度，是催命"],
        correctIndex: 3,
        explanation: "任何寒暄最终都会收敛于'论文写得咋样了'。",
        difficulty: "adept"
    },
    {
        question: "DDL (Deadline) 的第一生产力是？",
        options: ["勤奋", "智慧", "恐慌", "咖啡"],
        correctIndex: 2,
        explanation: "恐慌是人类进步的阶梯，尤其是在截止日期前一小时。",
        difficulty: "novice"
    },
    {
        question: "SCI 分区中，IF 代表什么？",
        options: ["Impact Factor (影响因子)", "I Failed (我挂了)", "Infinite Fantasy (无限幻想)", "Internal Friction (内耗)"],
        correctIndex: 0,
        explanation: "虽然对学生来说经常意味着 Internal Friction (内耗)。",
        difficulty: "novice"
    },
    {
        question: "遇到代码报错 'Segmentation Fault' 该怎么办？",
        options: ["仔细检查指针", "重启电脑", "去吃饭", "祈祷"],
        correctIndex: 2,
        explanation: "有些 Bug 睡一觉或者吃顿饭自己就好了（并不）。",
        difficulty: "adept"
    },
    {
        question: "以下哪种行为能显著提高论文接收率？",
        options: ["引用审稿人的文章", "每天给编辑发邮件", "在论文里放猫的照片", "把图画得五彩斑斓"],
        correctIndex: 0,
        explanation: "这是学术界公开的秘密（请勿模仿）。",
        difficulty: "master"
    }
];

// 3. Motto Data
const MOTTOS = {
    LOW_MOOD: [
        "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。",
        "天生我材必有用，千金散尽还复来。",
        "Every cloud has a silver lining. (黑暗中总有一线光明)",
        "行到水穷处，坐看云起时。",
        "Tough times never last, but tough people do."
    ],
    HIGH_MOOD: [
        "Stay hungry, stay foolish. (求知若饥，虚心若愚)",
        "天行健，君子以自强不息。",
        "会当凌绝顶，一览众山小。",
        "Knowledge is power. (知识就是力量)",
        "纸上得来终觉浅，绝知此事要躬行。"
    ]
};

// 4. Random Events
const RANDOM_EVENTS: RandomEvent[] = [
    { title: "服务器崩溃", description: "隔壁实验室断电了，你的代码没保存。", effect: "心情 -10" },
    { title: "食堂加餐", description: "阿姨今天手没抖，红烧肉满满一勺。", effect: "体力 +10" },
    { title: "意外发现", description: "在一个被遗忘的文件夹里发现了可用的数据。", effect: "灵感 +20" },
    { title: "引用增加", description: "有人引用了你的本科毕业论文（大概是误引）。", effect: "引用 +1" },
    { title: "导师出差", description: "导师去开会了，未来三天实验室放羊。", effect: "心情 +20" }
];

// 5. NPC Responses
const NPC_RESPONSES: Record<string, { greetings: string[], generic: string[], moodReact: string[] }> = {
    'WEI': { // 导师
        greetings: ["数据跑完没？", "有个新的Idea，你来做一下。", "这周组会你第一个讲。"],
        generic: ["做科研要耐得住寂寞。", "这个图画得不够这种，重画。", "这篇文献你读了吗？"],
        moodReact: ["看你无精打采的，是不是昨晚熬夜打游戏了？", "状态不错，今天把这三篇论文看完。"]
    },
    'AUNTIE': { // 食堂阿姨
        greetings: ["同学，今天吃点啥？", "刚出锅的狮子头！", "饭卡余额还够吗？"],
        generic: ["多吃点，看你瘦的。", "今天的青菜很新鲜。", "要不要加个蛋？"],
        moodReact: ["唉哟，苦着个脸干啥，阿姨给你多打一勺。", "笑得这么开心，发论文啦？"]
    },
    'GHOST': { // 幽灵学长
        greetings: ["你也...通宵了吗...", "我当年...也是这么过来的...", "小心...那个审稿人..."],
        generic: ["我好像把我的青春...落在这个实验室了...", "毕业...是一个谎言...", "多发点...SCI..."],
        moodReact: ["你的怨气...比我还重...", "年轻真好...还有头发..."]
    },
    'ROOMMATE': { // 室友
        greetings: ["上号上号！", "别卷了，出去撸串。", "帮我带份饭，谢了兄弟。"],
        generic: ["刚才那把团战我无敌。", "论文这种东西，最后一天写得最快。", "睡觉是人类进步的阶梯。"],
        moodReact: ["兄弟你看起来要猝死了，睡会儿吧。", "这么高兴，带我上分！"]
    }
};

// --- HELPER FUNCTIONS ---

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// --- SERVICES ---

export const generateQuizQuestions = async (rank: string): Promise<QuizQuestion[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Shuffle and pick 3
    const shuffled = [...QUIZ_BANK].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
};

export const getNPCResponse = async (history: { role: string, parts: { text: string }[] }[], npc: NPCDef, player: PlayerStats): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const lastMsg = history[history.length - 1].parts[0].text.toLowerCase();
    const npcData = NPC_RESPONSES[npc.id] || { greetings: ["..."], generic: ["..."], moodReact: ["..."] };

    // Simple keyword logic
    if (lastMsg.includes("累") || lastMsg.includes("不开心") || lastMsg.includes("难") || player.mood < 40) {
        return pickRandom(npcData.moodReact);
    }
    
    if (Math.random() < 0.3) {
        return pickRandom(npcData.greetings);
    }

    return pickRandom(npcData.generic);
};

export const evaluateChatReward = async (history: { role: string, parts: { text: string }[] }[], npc: NPCDef): Promise<Reward | null> => {
    // Pure logic: 30% chance if history length > 3
    if (history.length > 3 && Math.random() < 0.3) {
        const type = pickRandom(['STAMINA', 'MOOD', 'INSPIRATION', 'CITATION'] as const);
        let amount = 0;
        let msg = "";

        switch(type) {
            case 'STAMINA': amount = 20; msg = "拿去喝杯咖啡吧。"; break;
            case 'MOOD': amount = 15; msg = "听个笑话开心一下。"; break;
            case 'INSPIRATION': amount = 25; msg = "突然想到了个点子，送你了。"; break;
            case 'CITATION': amount = 5; msg = "我在新论文里引用了你。"; break;
        }

        return { type, amount, message: msg };
    }
    return null;
}

export const generateNPCTask = async (npc: NPCDef): Promise<RandomEvent> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { 
        title: "跑腿任务", 
        description: `${npc.name} 让你帮忙去取个快递。`, 
        effect: "好感度上升" 
    };
}

export const generateRandomEvent = async (context: string): Promise<RandomEvent> => {
    return pickRandom(RANDOM_EVENTS);
};

export const generateDailyDiary = async (player: PlayerStats): Promise<string> => {
    const act = player.activities.length > 0 
        ? player.activities.slice(-1)[0] 
        : "在宿舍发呆";
    
    const templates = [
        `今天${act}，感觉自己离诺贝尔奖又近了一步（误）。心情只有${player.mood}，该去喝奶茶了。`,
        `又是充满学术气息的一天。${act}的时候，我仿佛看到了真理的影子。目前引用数${player.citations}，未来可期！`,
        `虽然心情${player.mood}，但我坚持完成了${act}。我真是太棒了，不愧是${player.rankTitle}。`,
        `今日无事，${act}。希望能早日毕业。`
    ];

    return pickRandom(templates);
};

export const generateDailyMotto = async (player: PlayerStats): Promise<string> => {
    const list = player.mood < 60 ? MOTTOS.LOW_MOOD : MOTTOS.HIGH_MOOD;
    return pickRandom(list);
}

export const analyzeTreeHolePost = async (text: string): Promise<string> => {
    const responses = [
        "抱抱你，一切都会好起来的。",
        "太真实了，我也经历过。",
        "加油！你是最棒的！",
        "建议去操场跑两圈发泄一下。",
        "这就是科研生活啊（叹气）。"
    ];
    await new Promise(resolve => setTimeout(resolve, 1000));
    return pickRandom(responses);
};

export const generatePaperReview = async (score: number, skills: any): Promise<PaperResult> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const title = `《${pickRandom(TITLE_PREFIXES)}${pickRandom(TITLE_SUBJECTS)}${pickRandom(TITLE_SUFFIXES)}》`;
    
    let tier = "Unknown";
    let status: any = "REJECTED";
    let feedback = "";
    let potential = 0;

    if (score > 800) {
        tier = "Nature/Science (Top)";
        status = "ACCEPTED";
        feedback = pickRandom(REVIEWS.ACCEPTED);
        potential = 50;
    } else if (score > 500) {
        tier = "SCI Zone 1/2";
        status = "MINOR_REVISION";
        feedback = pickRandom(REVIEWS.MINOR);
        potential = 20;
    } else if (score > 200) {
        tier = "SCI Zone 3/4";
        status = "MAJOR_REVISION";
        feedback = pickRandom(REVIEWS.MINOR); // Mix minor/major texts
        potential = 5;
    } else {
        tier = "野鸡期刊 (Predatory)";
        status = "REJECTED";
        feedback = pickRandom(REVIEWS.REJECTED);
        potential = 0;
    }

    return {
        title,
        tier,
        score,
        status,
        feedback,
        citations: 0,
        potential
    };
};