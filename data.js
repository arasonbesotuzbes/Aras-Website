// =============================================
// API YAPILANDIRMASI
// Backend deploy sonrasi bu URL'yi guncelleyin!
// =============================================
const API_BASE = 'https://aras-portfolio-backend.onrender.com';
// Local test icin: const API_BASE = 'http://localhost:3000';

// Seviye etiketleri (hala kullaniliyor)
const levelLabels = {
    "beginner": "Başlangıç",
    "intermediate": "Orta",
    "advanced": "İleri",
    "expert": "Uzman"
};

// Teknik bilgi statik kalabilir (nadiren degisir)
const mockSkills = [
    {
        category: "Programlama Dilleri",
        icon: "",
        skills: [
            { name: "Lua", percentage: 85, level: "intermediate", icon: "Lua" },
            { name: "Python", percentage: 70, level: "advanced", icon: "PY" },
            { name: "HTML/CSS", percentage: 70, level: "expert", icon: "Web" },
            { name: "JavaScript", percentage: 30, level: "intermediate", icon: "JS" },
        ]
    },
    {
        category: "Frameworkler & Kütüphaneler",
        icon: "",
        skills: [
            { name: "Node.js", percentage: 40, level: "intermediate", icon: "Node" },
            { name: "Express", percentage: 35, level: "intermediate", icon: "Ex" },
        ]
    },
    {
        category: "Araçlar & Teknolojiler",
        icon: "",
        skills: [
            { name: "VS Code", percentage: 95, level: "expert", icon: "VS" },
            { name: "Git", percentage: 60, level: "intermediate", icon: "Git" },
        ]
    },
    {
        category: "Veritabanları",
        icon: "",
        skills: [
            { name: "MySQL", percentage: 80, level: "advanced", icon: "SQL" },
            { name: "Supabase", percentage: 50, level: "intermediate", icon: "SB" },
        ]
    }
];