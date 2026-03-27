// ═══════════════════════════════════════════════════════════════
// Portfolio Data — Abhinav Singh Yadav | HiggsBoson1710 Universe
// ═══════════════════════════════════════════════════════════════

export const PROFILE = {
  name: 'Abhinav Singh Yadav',
  tagline: 'CS Undergrad • Backend Engineer • Competitive Programmer',
  phone: '+91-9935914765',
  email: 'abhinavsinghyadav17oct@gmail.com',
  linkedin: 'https://linkedin.com/in/higgsboson1710',
  github: 'https://github.com/higgsboson1710',
  leetcode: 'https://leetcode.com/higgsboson1710',
  codechef: 'https://codechef.com/users/higgsboson1710',
};

export const ABOUT = {
  bio: `I'm a Computer Science undergrad at BIT Mesra with an 8.96 CGPA, driven by a passion for building efficient backend systems and solving complex algorithmic problems. With 750+ problems solved across platforms and a track record in international competitions, I bring a unique blend of engineering precision and competitive problem-solving to everything I build.`,
  highlights: [
    '🎓 B.Tech CSE @ BIT Mesra — 8.96 CGPA',
    '🏆 Global Rank 62 in Reply Hack The Code 2025',
    '💻 750+ Problems Solved across platforms',
    '⚡ LeetCode Rating: 1750+ | CodeChef: 3★ (1601)',
    '🔧 FastAPI & ML Pipeline Architect',
  ],
};

export const EDUCATION = [
  {
    institution: 'Birla Institute of Technology, Mesra',
    degree: 'B.Tech in Computer Science and Engineering',
    period: '2024 – 2028',
    score: 'CGPA: 8.96',
    location: 'Ranchi, Jharkhand',
  },
  {
    institution: 'GD Global School, Azamgarh (CBSE)',
    degree: 'Class XII & X',
    period: '2021 – 2023',
    score: 'XII: 95.4% | X: 95.8%',
    location: 'Uttar Pradesh',
  },
];

export const SKILLS = {
  languages: ['C', 'C++', 'Python'],
  backend: ['FastAPI', 'REST APIs', 'Pydantic v2'],
  libraries: ['NumPy', 'Pandas', 'scikit-learn', 'Matplotlib', 'Seaborn', 'MediaPipe'],
  tools: ['Git', 'GitHub', 'Linux', 'Docker', 'SQL', 'SQLite', 'VS Code'],
  coursework: [
    'Data Structures & Algorithms',
    'Database Management Systems',
    'Operating Systems',
    'Cryptography',
    'Numerical Methods',
  ],
};

export const PROJECTS = [
  {
    title: 'Real-Time Fall Detection & Response System',
    tech: 'Python, FastAPI, Twilio, MediaPipe',
    bullets: [
      'Engineered a computer vision pipeline using MediaPipe to track 33 skeletal landmarks at 30+ FPS, achieving sub-200ms latency.',
      'Architected a FastAPI backend with a custom 3-second debouncing algorithm to filter false positives — 99% alert reliability.',
      'Integrated Twilio Voice API for automated emergency response — detection to notification in under 10 seconds.',
    ],
  },
  {
    title: 'Insurance Premium Prediction System',
    tech: 'FastAPI, scikit-learn, Streamlit',
    bullets: [
      'Built a FastAPI backend for real-time premium category predictions via RESTful APIs with ML pipeline integration.',
      'Designed a modular preprocessing pipeline for derived features (BMI, risk factors) with Streamlit frontend.',
    ],
  },
  {
    title: 'Patient Management API',
    tech: 'FastAPI, Pydantic v2, REST',
    bullets: [
      'Implemented RESTful backend with full CRUD operations and strong validation using Pydantic v2.',
      'Added query-based sorting, filtering, and computed health metrics with JSON-based persistence.',
    ],
  },
];

export const ACHIEVEMENTS = [
  {
    title: 'Reply Hack The Code 2025',
    detail: 'Secured Global Rank 62 in an international 6-hour team competition combining algorithmic problem-solving and cybersecurity CTF challenges.',
    icon: '🌍',
  },
  {
    title: 'IICPC Codefest 2026',
    detail: 'Achieved Rank 2809 in Prelims among 13,000+ participants, qualifying as a top-tier performer.',
    icon: '🏅',
  },
  {
    title: 'INSOMNIA 2026 (IIT Roorkee)',
    detail: 'Secured Rank 291 out of 985 teams (Top 30%) in a national-level ICPC-style contest by PAG, IIT Roorkee, sponsored by IMC Trading.',
    icon: '🏆',
  },
  {
    title: 'LeetCode Contests',
    detail: 'Global Rank 2,710 (out of 37k+) in Weekly 484 • Rank 4,265 (out of 27k+) in Biweekly 168 • Rank 4,751 (out of 35k+) in Weekly 464.',
    icon: '⚡',
  },
  {
    title: 'CodeChef & Codeforces',
    detail: 'CodeChef: Global Rank 530 (Starters 215, Div. 3) & 838 (Starters 202, Div. 3). Codeforces: Rank 4,357 in Round 1074 (Div. 4) and 7,007 in Round 1075 (Div. 2).',
    icon: '🔥',
  },
];

export const COMPETITIVE = {
  platforms: [
    { name: 'LeetCode', rating: '1750+', solved: '500+', badge: '⚡' },
    { name: 'CodeChef', rating: '1601 (3★)', solved: '150+', badge: '🍳' },
    { name: 'Codeforces', rating: 'Active', solved: '100+', badge: '🏋️' },
  ],
  totalSolved: '750+',
};

export const CONTACT = {
  email: 'abhinavsinghyadav17oct@gmail.com',
  phone: '+91-9935914765',
  linkedin: 'https://linkedin.com/in/higgsboson1710',
  github: 'https://github.com/higgsboson1710',
  message: "Let's build something extraordinary together. Whether it's a collaboration, an opportunity, or just a conversation about algorithms — I'm always up for it.",
};

// ═══════════════════════════════════════
// Planet Configuration — Section Mapping
// ═══════════════════════════════════════
export const PLANET_CONFIG = [
  {
    id: 'about',
    name: 'Nebula Prime',
    label: 'About Me',
    orbitRadius: 18,
    planetRadius: 1.8,
    speed: 0.0003,
    colors: { primary: '#00d4ff', secondary: '#0066cc', atmosphere: '#00aaff' },
    rotationSpeed: 0.003,
    tilt: 0.2,
  },
  {
    id: 'education',
    name: 'Arcadia',
    label: 'Education',
    orbitRadius: 28,
    planetRadius: 1.5,
    speed: 0.00025,
    colors: { primary: '#ff6b35', secondary: '#cc3300', atmosphere: '#ff8855' },
    rotationSpeed: 0.004,
    tilt: 0.4,
    hasRings: true,
    ringColor: '#ff9966',
  },
  {
    id: 'projects',
    name: 'Terraform-X',
    label: 'Projects',
    orbitRadius: 40,
    planetRadius: 2.5,
    speed: 0.0002,
    colors: { primary: '#00ff88', secondary: '#006633', atmosphere: '#33ffaa' },
    rotationSpeed: 0.002,
    tilt: 0.15,
    hasSatellites: true,
  },
  {
    id: 'skills',
    name: 'Synthex',
    label: 'Skills',
    orbitRadius: 55,
    planetRadius: 2.0,
    speed: 0.00015,
    colors: { primary: '#ff00ff', secondary: '#990099', atmosphere: '#ff66ff' },
    rotationSpeed: 0.0035,
    tilt: 0.3,
  },
  {
    id: 'achievements',
    name: 'Olympia Vertex',
    label: 'Achievements',
    orbitRadius: 72,
    planetRadius: 3.2,
    speed: 0.00012,
    colors: { primary: '#ffcc00', secondary: '#996600', atmosphere: '#ffdd44' },
    rotationSpeed: 0.001,
    tilt: 0.1,
    hasRings: true,
    ringColor: '#ffdd88',
  },
  {
    id: 'competitive',
    name: 'CodeStorm',
    label: 'Competitive',
    orbitRadius: 90,
    planetRadius: 1.6,
    speed: 0.0001,
    colors: { primary: '#ff3366', secondary: '#cc0033', atmosphere: '#ff6688' },
    rotationSpeed: 0.005,
    tilt: 0.5,
  },
  {
    id: 'contact',
    name: 'Signal-9',
    label: 'Contact',
    orbitRadius: 108,
    planetRadius: 1.4,
    speed: 0.00008,
    colors: { primary: '#9966ff', secondary: '#6600cc', atmosphere: '#bb88ff' },
    rotationSpeed: 0.003,
    tilt: 0.25,
    hasRings: true,
    ringColor: '#aa77ff',
  },
];

// ═══════════════════════════════════════
// Chatbot Responses — Modern Rizz Mode
// ═══════════════════════════════════════
export const CHATBOT_RESPONSES = {
  greetings: [
    "Yo! Welcome to Abhinav's universe 🌌 What do you wanna know? I got ALL the tea ☕",
    "Hey there, fellow traveler! You've entered the HiggsBoson1710 dimension. Ask me anything about Abhinav — this man is CRACKED 🔥",
    "What's good! I'm Abhinav's AI homie. Let's talk about the man, the myth, the coder 💫",
  ],
  about: [
    "Abhinav Singh Yadav? Oh, you mean the GOAT 🐐 CS Undergrad at BIT Mesra pulling an 8.96 CGPA while speedrunning 750+ coding problems. He doesn't just code — he ARCHITECTS systems. Built real-time fall detection, ML pipelines, patient management APIs... this man is built different. No cap. 💯",
    "So here's the deal — Abhinav is a 2nd year CS student at BIT Mesra, one of India's top tech institutes. 8.96 CGPA. 750+ problems solved. Global-level competitive programmer. And he builds actual production-ready backend systems. He's basically a main character. 🎬",
  ],
  skills: [
    "Bro is STACKED 💪 Languages? C, C++, Python — the holy trinity. Backend? FastAPI with Pydantic v2 — he writes APIs that are clean AF. ML? NumPy, Pandas, scikit-learn, MediaPipe. Tools? Git, Docker, Linux, SQL. He's basically a Swiss Army knife of tech. 🔧",
    "Let me break it down for you:\n🐍 Python — his weapon of choice\n⚡ FastAPI — backend beast mode\n🧠 ML Stack — scikit-learn, NumPy, Pandas\n🐧 Linux + Docker + Git — DevOps ready\nDude's coursework includes DSA, OS, DBMS, Cryptography... he's not playing around. 📚",
  ],
  projects: [
    "His projects hit DIFFERENT 🎯\n\n1️⃣ Fall Detection System — Computer vision pipeline tracking 33 skeletal landmarks at 30+ FPS. Sub-200ms latency. 99% alert reliability. Auto-calls emergency via Twilio in under 10 seconds. That's LIVES SAVED.\n\n2️⃣ Insurance Premium Predictor — Full ML pipeline with FastAPI backend + Streamlit frontend.\n\n3️⃣ Patient Management API — Clean CRUD with Pydantic v2 validation.\n\nThis man builds things that MATTER. 🏗️",
    "OK so Abhinav doesn't just do toy projects. His Fall Detection System? It tracks your SKELETON in real-time and calls for help if you fall. 33 landmarks, 30 FPS, sub-200ms latency. He also built an Insurance Premium Predictor with ML and a Patient Management API. Production-grade stuff, not tutorial copypaste. 💎",
  ],
  achievements: [
    "WHERE DO I EVEN START 🏆\n\n🌍 Global Rank 62 — Reply Hack The Code 2025 (international!)\n🏅 IICPC Codefest 2026 — Top performer among 13,000+\n🎯 INSOMNIA @ IIT Roorkee — Top 30%\n⚡ LeetCode — Rank 2,710 out of 37k+\n🔥 CodeChef — Global Rank 530\n\nThis man COLLECTS ranks like infinity stones 💎",
    "Achievement unlocked: ALL OF THEM 🎮\n\nReply Hack The Code 2025? Global Rank 62. IICPC Codefest among 13K+ people? Check. IIT Roorkee INSOMNIA? Top 30%. LeetCode weekly? Rank 2,710 out of 37K. CodeChef? Rank 530 globally. Codeforces? Rank 4,357. He's basically speedrunning the leaderboards. 🚀",
  ],
  education: [
    "📚 Currently pursuing B.Tech in CSE at Birla Institute of Technology, Mesra — one of India's premier tech institutes. Running a 8.96 CGPA which is absolutely ELITE.\n\nBefore that? GD Global School — 95.4% in Class XII and 95.8% in Class X. This man was scoring 95+ before college even started. The consistency is unreal. 📈",
  ],
  competitive: [
    "Competitive programming is where Abhinav goes ULTRA INSTINCT 🔥\n\n⚡ LeetCode: 1750+ Rating, 500+ problems\n🍳 CodeChef: 3-Star (1601 rating), Global Rank 530\n🏋️ Codeforces: Active competitor, Rank 4,357\n\n750+ total problems solved across all platforms. He doesn't just solve problems — he DESTROYS them. 💀",
  ],
  contact: [
    "Wanna reach the man himself? Here you go:\n\n📧 abhinavsinghyadav17oct@gmail.com\n📱 +91-9935914765\n💼 LinkedIn — look him up\n🐙 GitHub — check his repos\n\nHe's always down for interesting collabs, hackathons, or just nerding out about algorithms. Don't be shy! 😎",
  ],
  funny: [
    "I asked Abhinav for his weakness and he said 'segfaults.' Then he fixed it in O(1). What a legend. 😂",
    "Fun fact: Abhinav's CGPA (8.96) is higher than most people's sleep hours. Coincidence? I think not. 🧠",
    "Abhinav doesn't debug code. The code debugs itself out of respect. 🫡",
  ],
  fallback: [
    "Hmm, I'm not 100% sure about that, but I know Abhinav would figure it out in O(log n) time 😂 Try asking about his skills, projects, achievements, or competitive programming!",
    "That's a bit outside my training data, fam 😅 But ask me about Abhinav's projects, skills, achievements, education, or how to contact him!",
    "Interesting question! I'm mainly here to hype up Abhinav though 🔥 Try: 'Tell me about his projects' or 'What are his achievements?'",
  ],
};
