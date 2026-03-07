-- =============================================
-- Aras Portfolio - Supabase Veritabani Semasi
-- Supabase SQL Editor'e yapistirip calistir
-- =============================================

-- Blog yazilari tablosu
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  full_content TEXT,
  read_time TEXT DEFAULT '3 dk',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projeler tablosu
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  technologies TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  status_text TEXT DEFAULT 'Aktif',
  progress INT DEFAULT 0,
  stars INT DEFAULT 0,
  forks INT DEFAULT 0,
  issues INT DEFAULT 0,
  github_link TEXT DEFAULT '#',
  demo_link TEXT DEFAULT '#',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ziyaret istatistikleri tablosu
CREATE TABLE IF NOT EXISTS stats (
  id INT PRIMARY KEY DEFAULT 1,
  visits BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Baslangic ziyaret satiri
INSERT INTO stats (id, visits) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- MEVCUT DATA.JS VERILERINI AKTAR
-- =============================================

INSERT INTO blog_posts (title, content, full_content, read_time, tags) VALUES
(
  'Ilk Yazi!',
  'Bu yaziyla birlikte sitemin temelleri yavas yavas yerine oturmaya basladi. Elimden geldigince hizli bir sekilde gelistirmeye calisiyorum. Siteyi tamamladiktan sonra ise...',
  '<p>Bu yaziyla birlikte sitemin temelleri yavas yavas yerine oturmaya basladi. Elimden geldigince hizli bir sekilde gelistirmeye calisiyorum. Siteyi tamamladiktan sonra ise JavaScript veya Python uzerinde ilerlemeyi dusunuyorum.</p><p>Tabii her seyi zaman gosterecek. Zamanla hangi dile daha yatkin oldugumu gordukcen o yone yogunlasacagim. Simdi siteye gelirsek, temel duzeyde HTML ve CSS biliyordum ama bir web sitesini sifirdan nasil kuracagim konusunda pek bir fikrim yoktu. Bu yuzden siteyi gelistirirken yapay zekadan da destek aldim.</p><p>Bu surette farkli konularda deneyimler kazandim ve kazanmaya devam ediyorum. Bugunku anlatacarklarim bu kadardi, okudugunuz icin tesekkur ederim.</p>',
  '3 dk',
  ARRAY['Dusuncelerim']
);

INSERT INTO projects (name, description, technologies, status, status_text, progress, stars, forks, issues, github_link, demo_link) VALUES
(
  'Aras Web Sitesi V1',
  'Bu benim Gelistirici Portfolyumun ilk versiyonuydu. HTML, CSS ve biraz JavaScript kullanarak olusturulmus basit bir siteydi.',
  ARRAY['HTML', 'CSS', 'JavaScript'],
  'completed', 'Tamamlandi', 100, 23, 12, 8, '#', '#'
),
(
  'Aras Web Sitesi V2',
  'Bu Suanda icerisinde bulundugumuz site. Tamamen bastan insa edildi ve modern web teknolojilerini kullaniyor.',
  ARRAY['HTML', 'CSS', 'JavaScript', 'Node.js'],
  'testing', 'Test Asamasinda', 76, 7, 3, 18, '#', '#'
),
(
  'CARA',
  'Cara, ozellestirilbilir bir yapay zeka projesidir. Su anda hala kagit uzerinde olan bu proje, ilerleyen zamanlarda gelistirilmeye baslanacaktir.',
  ARRAY['Python', 'tkinter', 'openai', 'pyttsx3', 'speech_recognition'],
  'planning', 'Planlama Asamasinda', 1, 1, 3, 4, '#', '#'
),
(
  'MTA Scriptleri',
  'MTA icin cesitli oyun modlari ve scriptler gelistirdim. Bu scriptler, oyunculara yeni deneyimler sunmayi amacliyor.',
  ARRAY['Lua', 'MTA'],
  'active', 'Aktif', 100, 14, 13, 4, '#', '#'
);

-- Row Level Security (RLS) - Okuma herkese acik, yazma sadece backend'den
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes okuyabilir" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "Herkes okuyabilir" ON projects FOR SELECT USING (true);
CREATE POLICY "Herkes okuyabilir" ON stats FOR SELECT USING (true);
CREATE POLICY "Herkes istatistik guncelleyebilir" ON stats FOR UPDATE USING (true);

-- Service role ile yazma (backend .env'deki SUPABASE_KEY service role key olmali)
CREATE POLICY "Service role yazabilir blog" ON blog_posts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role yazabilir projects" ON projects FOR ALL USING (auth.role() = 'service_role');
