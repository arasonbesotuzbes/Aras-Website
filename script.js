// Spotify — Backend proxy kullanıyor (gizli anahtarlar sunucuda)
const API_URL = (typeof API_BASE !== 'undefined' ? API_BASE : '').replace(/\/+$/, '');
let progressInterval;
let updateInterval;

// Süreyi formatlama
function formatDuration(durationMs) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// İlerleme çubuğunu güncelleme
function updateProgress(currentMs, totalMs) {
    const progressPercentage = (currentMs / totalMs) * 100;
    document.getElementById('spotifyProgress').style.width = `${progressPercentage}%`;
    document.getElementById('spotifyCurrentTime').textContent = formatDuration(currentMs);
    document.getElementById('spotifyDuration').textContent = formatDuration(totalMs);
}

// Spotify verilerini backend proxy üzerinden al
async function getSpotifyData() {
    try {
        const response = await fetch(`${API_URL}/api/spotify`);

        if (!response.ok) throw new Error('Backend hatası');

        const data = await response.json();

        if (!data.playing) {
            showSpotifyError(data.message || 'Şu anda müzik çalmıyor');
            return;
        }

        showSpotifyContent();

        document.getElementById('spotifySong').textContent = data.song;
        document.getElementById('spotifyArtist').textContent = data.artist;
        document.getElementById('spotifyArtwork').src = data.artwork;
        document.getElementById('spotifyLink').href = data.url;

        const totalMs = data.duration_ms;
        let currentMs = data.progress_ms;

        updateProgress(currentMs, totalMs);

        if (progressInterval) clearInterval(progressInterval);

        progressInterval = setInterval(() => {
            currentMs += 1000;
            if (currentMs >= totalMs) {
                clearInterval(progressInterval);
                setTimeout(getSpotifyData, 1000);
            } else {
                updateProgress(currentMs, totalMs);
            }
        }, 1000);

    } catch (error) {
        console.error('Spotify hatası:', error);
        showSpotifyError('Spotify bağlantısında hata');
    }
}

// Otomatik güncellemeyi başlat
function startAutoUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(getSpotifyData, 30000);
}

// Spotify widget'ını hata modunda göster
function showSpotifyError(message) {
    document.getElementById('spotifyError').textContent = message;
    document.getElementById('spotifyError').classList.add('active');
    document.getElementById('spotifyContent').classList.remove('active');
    document.getElementById('spotifyWidget').classList.add('active');
}

// Spotify widget'ını içerik modunda göster
function showSpotifyContent() {
    document.getElementById('spotifyError').classList.remove('active');
    document.getElementById('spotifyContent').classList.add('active');
    document.getElementById('spotifyWidget').classList.add('active');
}

// Sekme değiştirme fonksiyonu
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    setTimeout(animateProgressBars, 300);
    if (tabName === 'tech') {
        setTimeout(animateProgressBars, 500);
    }
}

// Matrix efekti oluşturma
function createMatrixEffect() {
    const matrixBg = document.querySelector('.matrix-bg');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    matrixBg.appendChild(canvas);

    const characters = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const charArray = characters.split("");
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];

    for (let i = 0; i < columns; i++) {
        drops[i] = 1;
    }

    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#0F0";
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = charArray[Math.floor(Math.random() * charArray.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }
    }

    setInterval(draw, 35);
}

// Projeleri yükleme — Backend API'den
async function loadProjects() {
    const projectsGrid = document.querySelector('.projects-grid');
    projectsGrid.innerHTML = '<div class="loading">Projeler yükleniyor...</div>';

    try {
        const res = await fetch(`${API_URL}/api/projects`);
        if (!res.ok) throw new Error('API hatası');
        const projects = await res.json();

        projectsGrid.innerHTML = '';

        if (!projects.length) {
            projectsGrid.innerHTML = '<p style="color:#555;">Henüz proje eklenmedi.</p>';
            return;
        }

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';

            projectCard.innerHTML = `
            <div class="project-header">
                <h3 class="project-title">${project.name}</h3>
                <div class="project-status">
                    <div class="status-dot ${project.status}"></div>
                    <span class="status-text">${project.status_text}</span>
                </div>
            </div>
            <p class="project-description">${project.description || ''}</p>
            <div class="project-tech">
                ${(project.technologies || []).map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
            </div>
            <div class="project-progress">
                <div class="progress-label">
                    <span>İlerleme</span>
                    <span>${project.progress}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${project.progress}%"></div>
                </div>
            </div>
            <div class="project-stats">
                <div class="stat">
                    <span class="stat-icon"><i class="fa-solid fa-star"></i></span>
                    <span class="stat-value">${project.stars}</span>
                </div>
                <div class="stat">
                    <span class="stat-icon"><i class="fa-solid fa-code-fork"></i></span>
                    <span class="stat-value">${project.forks}</span>
                </div>
                <div class="stat">
                    <span class="stat-icon"><i class="fa-solid fa-circle-exclamation"></i></span>
                    <span class="stat-value">${project.issues}</span>
                </div>
            </div>
            <div class="project-actions">
                <a href="${project.github_link}" class="action-btn secondary" target="_blank">
                    <span class="btn-icon"><i class="fa-brands fa-github"></i></span>
                    <span>GitHub</span>
                </a>
                <a href="${project.demo_link}" class="action-btn primary" target="_blank">
                    <span class="btn-icon"><i class="fa-solid fa-play"></i></span>
                    <span>Demo</span>
                </a>
                <button class="action-btn donate">
                    <span class="btn-icon"><i class="fa-solid fa-heart"></i></span>
                    <span>Destekle</span>
                </button>
            </div>
        `;

            projectsGrid.appendChild(projectCard);
        });

    } catch (error) {
        console.error('Proje yükleme hatası:', error);
        projectsGrid.innerHTML = '<div class="error">Projeler yüklenemedi. Backend çalışıyor mu?</div>';
    }
}

// Oyunları yükleme (Sekmeye tıklandığında Steam oyunları yükleniyor)

// Yetenekleri yükleme — Backend API'den
async function loadSkills() {
    const skillsContainer = document.querySelector('.skills-container');
    skillsContainer.innerHTML = '<div class="loading">Yetenekler yükleniyor...</div>';

    try {
        const res = await fetch(`${API_URL}/api/skills`);
        if (!res.ok) throw new Error('API hatası');
        const skillsList = await res.json();

        skillsContainer.innerHTML = '';

        if (!skillsList || skillsList.length === 0) {
            skillsContainer.innerHTML = '<p style="color:#555;">Henüz yetenek eklenmedi.</p>';
            return;
        }

        // Backend'den gelen düz veriyi kategorilere göre grupla
        const categoriesMap = {};
        skillsList.forEach(skill => {
            if (!categoriesMap[skill.category]) {
                categoriesMap[skill.category] = {
                    category: skill.category,
                    icon: skill.category_icon || '',
                    skills: []
                };
            }
            categoriesMap[skill.category].skills.push(skill);
        });

        const categories = Object.values(categoriesMap);

        const levelLabels = {
            beginner: 'Başlangıç',
            intermediate: 'Orta',
            advanced: 'İleri',
            expert: 'Uzman'
        };

        categories.forEach((category) => {
            const skillCategory = document.createElement('div');
            // 'Programming Languages' -> 'programming' gibi CSS sınıfı uydurma
            const safeClass = category.category.toLowerCase().replace(/[^a-z0-9]/g, '');
            skillCategory.className = `skill-category category-${safeClass}`;

            skillCategory.innerHTML = `
                <h3 class="category-title">
                    <span class="category-icon">${category.icon}</span>
                    ${category.category}
                </h3>
                <div class="skills-grid">
                    ${category.skills.map(skill => `
                        <div class="skill-item">
                            <div class="skill-header">
                                <div class="skill-info">
                                    <div class="skill-icon">${skill.icon}</div>
                                    <div>
                                        <span class="skill-name">${skill.name}</span>
                                        <span class="skill-level level-${skill.level}">${levelLabels[skill.level] || skill.level}</span>
                                    </div>
                                </div>
                                <span class="skill-percentage">${skill.percentage}%</span>
                            </div>
                            <div class="skill-progress-container">
                                <div class="progress-info">
                                    <span>Yeterlilik</span>
                                    <span>${skill.percentage}%</span>
                                </div>
                                <div class="skill-progress-bg">
                                    <div class="skill-progress-fill" data-width="${skill.percentage}"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            skillsContainer.appendChild(skillCategory);
        });

        setTimeout(animateProgressBars, 300);

    } catch (error) {
        console.error('Yetenek yükleme hatası:', error);
        skillsContainer.innerHTML = '<div class="error">Yetenekler yüklenemedi. Backend çalışıyor mu?</div>';
    }
}


// Yazı efekti
async function typeWriter() {
    const textElement = document.querySelector('.typing-text');
    let texts = [
        "Aras",
        "Bir Geliştirici",
        "Bir Oyuncu",
        "Bir Hayalperest"
    ];

    try {
        const res = await fetch(`${API_URL}/api/settings`);
        if (res.ok) {
            const data = await res.json();
            if (data.hero_titles && data.hero_titles.length > 0) {
                texts = data.hero_titles;
            }
            // Apply hero (typing text) font
            if (data.hero_font) {
                textElement.style.fontFamily = data.hero_font;
            }
            // Apply logo font via CSS variable injection (affects glitch ::before/::after too)
            if (data.logo_font) {
                // Remove any previously injected font style
                const oldStyle = document.getElementById('dynamic-logo-font');
                if (oldStyle) oldStyle.remove();

                const styleTag = document.createElement('style');
                styleTag.id = 'dynamic-logo-font';
                styleTag.textContent = `
                    :root { --logo-font: ${data.logo_font}; }
                    .glitch { font-family: ${data.logo_font} !important; }
                    .glitch::before, .glitch::after { font-family: ${data.logo_font} !important; }
                `;
                document.head.appendChild(styleTag);
            }
        }
    } catch (e) {
        console.error("Ayarlar yuklenemedi, varsayilan metinler kullaniliyor:", e);
    }
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
        const currentText = texts[textIndex];

        if (isDeleting) {
            textElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            textElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            typingSpeed = 1500;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    setTimeout(type, 1000);
}

// Modal işlevselliği
let currentPostId = null;

// Blog gönderilerini yükleme — Backend API'den
let allBlogPosts = [];

async function loadBlogPosts() {
    const blogPosts = document.querySelector('.blog-posts');
    blogPosts.innerHTML = '<div class="loading">Yazılar yükleniyor...</div>';

    try {
        const res = await fetch(`${API_URL}/api/blog`);
        if (!res.ok) throw new Error('API hatası');
        allBlogPosts = await res.json();

        blogPosts.innerHTML = '';

        if (!allBlogPosts.length) {
            blogPosts.innerHTML = '<p style="color:#555;">Henüz yazı yok.</p>';
            return;
        }

        allBlogPosts.forEach(post => {
            // created_at tarihini Türkçe formatla
            const dateObj = new Date(post.created_at);
            post.date = dateObj.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
            const blogPost = document.createElement('article');
            blogPost.className = 'blog-post';
            blogPost.setAttribute('data-post-id', post.id);

            blogPost.innerHTML = `
            <div class="post-header">
                <div>
                    <h3 class="post-title">${post.title}</h3>
                    <div class="post-meta">
                        <span>${post.date}</span>
                        <span>${post.read_time} okuma süresi</span>
                        <span>Post #${post.id}</span>
                    </div>
                </div>
            </div>
            <p class="post-content">${post.content || ''}</p>
            <div class="post-tags">
                ${(post.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="post-actions">
                <button class="action-btn share-btn" data-post-id="${post.id}">
                    <span class="btn-icon"><i class="fa-solid fa-share-nodes"></i></span>
                    <span>Paylaş</span>
                </button>
            </div>
        `;

            blogPosts.appendChild(blogPost);
        });

    } catch (error) {
        console.error('Blog yükleme hatası:', error);
        blogPosts.innerHTML = '<div class="error">Blog yazıları yüklenemedi. Backend çalışıyor mu?</div>';
        return;
    }

    // Blog gönderilerine tıklama eventi ekle
    document.querySelectorAll('.blog-post').forEach(post => {
        post.addEventListener('click', (e) => {
            // Paylaş butonuna tıklanmadıysa modal aç
            if (!e.target.closest('.share-btn')) {
                const postId = post.getAttribute('data-post-id');
                openBlogModal(postId);
            }
        });
    });

    // Paylaş butonlarına event ekle
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Modalın açılmasını engelle
            const postId = btn.getAttribute('data-post-id');
            shareBlogPost(postId);
        });
    });
}

// Modal açma fonksiyonu
function openBlogModal(postId) {
    const post = allBlogPosts.find(p => p.id == postId);
    if (!post) return;

    currentPostId = postId;

    // Modal içeriğini doldur
    document.getElementById('modalPostTitle').textContent = post.title;
    document.getElementById('modalPostDate').textContent = post.date;
    document.getElementById('modalPostReadTime').textContent = post.read_time + ' okuma süresi';
    document.getElementById('modalPostId').textContent = post.id;
    document.getElementById('modalPostContent').innerHTML = post.full_content;

    // Etiketleri doldur
    const tagsContainer = document.getElementById('modalPostTags');
    tagsContainer.innerHTML = post.tags.map(tag =>
        `<span class="tag">${tag}</span>`
    ).join('');

    // Modalı göster
    document.getElementById('blogModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Sayfa kaydırmayı engelle
}

// Modal kapama fonksiyonu
function closeBlogModal() {
    document.getElementById('blogModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Sayfa kaydırmayı geri aç
    currentPostId = null;
}

// Blog paylaşım fonksiyonu
function shareBlogPost(postId) {
    const post = allBlogPosts.find(p => p.id == postId);
    if (!post) return;

    const postUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    const shareText = `${post.title} - Aras'ın Günlüğü`;

    // Paylaşım seçeneklerini göster/gizle
    const shareOptions = document.getElementById('shareOptions');
    const isActive = shareOptions.classList.contains('active');

    // Diğer tüm paylaşım menülerini kapat
    document.querySelectorAll('.share-options').forEach(menu => {
        menu.classList.remove('active');
    });

    if (!isActive) {
        shareOptions.classList.add('active');

        // Paylaşım seçeneklerine event listener ekle
        document.querySelectorAll('.share-option').forEach(option => {
            option.onclick = function () {
                const platform = this.getAttribute('data-platform');
                handleShare(platform, postUrl, shareText);
                shareOptions.classList.remove('active');
            };
        });

        // Dışarı tıklanınca menüyü kapat
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!shareOptions.contains(e.target) && !e.target.closest('.share-btn')) {
                    shareOptions.classList.remove('active');
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }
}

// Paylaşım işlemleri
function handleShare(platform, url, text) {
    const fullText = `${text} ${url}`;

    switch (platform) {
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`, '_blank');
            break;
        case 'linkedin':
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
            break;
        case 'copy':
            navigator.clipboard.writeText(url).then(() => {
                showNotification('Link panoya kopyalandı!', 'success');
            }).catch(() => {
                // Fallback için
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification('Link panoya kopyalandı!', 'success');
            });
            break;
    }
}

// URL'den post yükleme
function loadPostFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');

    if (postId) {
        // Blog sekmesine geç
        switchTab('blog');
        // Modal aç
        setTimeout(() => openBlogModal(postId), 500);
    }
}

// Steam — Backend proxy kullanıyor (API key sunucuda)
let steamGames = [];

// Steam oyunlarını backend proxy üzerinden yükle
async function loadSteamGames() {
    const gamesList = document.querySelector('.games-list');
    const entegrasyonYazisi = document.querySelector('.Entegrasyonyazi');

    try {
        if (entegrasyonYazisi) entegrasyonYazisi.style.display = 'none';
        gamesList.innerHTML = '<div class="loading">Steam oyunları yükleniyor...</div>';

        const response = await fetch(`${API_URL}/api/steam`);

        if (!response.ok) throw new Error(`Backend yanıt vermedi: ${response.status}`);

        const data = await response.json();

        if (data.games && data.games.length > 0) {
            steamGames = data.games;
            displaySteamGames(steamGames);
        } else {
            throw new Error('Oyun verisi bulunamadı.');
        }

    } catch (error) {
        console.error('Steam yükleme hatası:', error);
        gamesList.innerHTML = `
            <div class="error">
                <h3>Steam Oyunları Yüklenemedi</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Steam oyunlarını göster
function displaySteamGames(games) {
    const gamesList = document.querySelector('.games-list');
    gamesList.innerHTML = '';

    if (games.length === 0) {
        gamesList.innerHTML = '<div class="error">Oynanmış oyun bulunamadı</div>';
        return;
    }

    // Tüm oyunları göster
    games.forEach(game => {
        const gameItem = document.createElement('div');
        gameItem.className = 'steam-game-item';
        gameItem.setAttribute('data-appid', game.appid);

        // Oynama süresini formatla
        const playtimeHours = Math.floor(game.playtime_forever / 60);
        const playtimeMinutes = game.playtime_forever % 60;
        const playtimeText = playtimeHours > 0 ?
            `${playtimeHours}s ${playtimeMinutes}d` :
            `${playtimeMinutes}d`;

        gameItem.innerHTML = `
            <div class="steam-game-cover">
                <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg" 
                     alt="${game.name}" 
                     class="steam-game-image"
                     onerror="this.src='https://via.placeholder.com/300x120/333/00ff00?text=Görsel+Yüklenemedi'">
                <div class="steam-game-overlay">
                     <button class="view-details-btn">Detayları Gör</button>
                </div>
            </div>
            <div class="steam-game-content">
                <h3 class="steam-game-title" title="${game.name}">${game.name}</h3>
                <div class="steam-game-stats">
                    <div class="playtime-display">
                        <span class="time-icon"><i class="fa-solid fa-clock"></i></span>
                        <span>${playtimeText}</span>
                    </div>
                </div>
            </div>
        `;

        gamesList.appendChild(gameItem);
    });

    // Oyun item'larına tıklama event'i ekle
    document.querySelectorAll('.steam-game-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const appId = item.getAttribute('data-appid');
            openGameModal(appId);
        });
    });
}

// Oyun modalını aç
async function openGameModal(appId) {
    const game = steamGames.find(g => g.appid == appId);
    if (!game) return;

    try {
        // Modal başlığını ve temel bilgileri doldur
        document.getElementById('modalGameTitle').textContent = game.name;
        document.getElementById('modalGameAppId').textContent = appId;

        // Oynama süresini formatla
        const playtimeHours = Math.floor(game.playtime_forever / 60);
        const playtimeMinutes = game.playtime_forever % 60;
        const playtimeText = `Oynama Süresi: ${playtimeHours}s ${playtimeMinutes}d`;
        document.getElementById('modalGamePlaytime').textContent = playtimeText;

        // Oyun görselini yükle
        const gameImage = document.getElementById('modalGameImage');
        gameImage.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
        gameImage.alt = game.name;
        gameImage.onerror = function () {
            this.src = 'https://via.placeholder.com/400x188/333/00ff00?text=Görsel+Yüklenemedi';
        };

        // Oyun bilgilerini doldur
        document.getElementById('modalGameName').textContent = game.name;
        document.getElementById('modalTotalPlaytime').textContent = `${playtimeHours} saat ${playtimeMinutes} dakika`;
        document.getElementById('modalRecentPlaytime').textContent = game.playtime_2weeks ?
            `${Math.floor(game.playtime_2weeks / 60)} saat ${game.playtime_2weeks % 60} dakika` :
            '0 saat';

        // Başarımları yükle
        await loadGameAchievements(appId);

        // Modalı göster
        document.getElementById('gameModal').style.display = 'block';
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Oyun modal hatası:', error);
        document.getElementById('gameAchievements').innerHTML = `
            <div class="error">
                <p>Oyun bilgileri yüklenirken hata oluştu</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Oyun başarımlarını yükle
async function loadGameAchievements(appId) {
    const achievementsContainer = document.getElementById('gameAchievements');
    achievementsContainer.innerHTML = '<div class="loading">Başarımlar yükleniyor...</div>';

    try {
        const response = await fetch(`${API_URL}/api/steam/achievements/${appId}`);

        if (!response.ok) {
            throw new Error('Başarımlar yüklenemedi');
        }

        const data = await response.json();

        // Backend "{ achievements: [], message: ... }" veya "{ achievements: [...] }" döndürüyor
        if (data && data.achievements && data.achievements.length > 0) {
            displayAchievements(data.achievements, appId);
        } else {
            achievementsContainer.innerHTML = `
                <div class="error" style="text-align: center; padding: 20px;">
                    <p style="color: #888; margin-bottom: 10px;">${data.message || 'Bu oyun için başarım bulunamadı'}</p>
                    <p style="font-size: 0.9em; color: #555;">Oyunun başarım sistemi olmayabilir veya başarımlar gizli olabilir</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Başarım yükleme hatası:', error);
        achievementsContainer.innerHTML = `
            <div class="error">
                <p>Başarımlar yüklenirken hata oluştu</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Başarımları göster
function displayAchievements(achievements, appId) {
    const achievementsContainer = document.getElementById('gameAchievements');
    achievementsContainer.innerHTML = '';

    const unlockedAchievements = achievements.filter(a => a.achieved === 1);
    const totalAchievements = achievements.length;

    if (totalAchievements === 0) {
        achievementsContainer.innerHTML = '<div class="error">Bu oyunda başarım sistemi bulunmuyor</div>';
        return;
    }

    // Başarım istatistiği
    const completionRate = Math.round((unlockedAchievements.length / totalAchievements) * 100);

    const statsHtml = `
        <div class="achievement-stats" style="margin-bottom: 20px; padding: 15px; background: #252525; border-radius: 8px; text-align: center;">
            <div style="font-size: 16px; color: #00ff00; margin-bottom: 10px;">
                <strong>Başarım İlerlemesi</strong>
            </div>
            <div style="font-size: 24px; color: #00ff00; font-weight: bold; margin-bottom: 10px;">
                ${unlockedAchievements.length}/${totalAchievements} (${completionRate}%)
            </div>
            <div style="height: 10px; background: #333; border-radius: 5px; margin-top: 10px; overflow: hidden;">
                <div style="height: 100%; background: #00ff00; width: ${completionRate}%; transition: width 0.5s;"></div>
            </div>
        </div>
    `;

    achievementsContainer.innerHTML = statsHtml;

    // Başarımları listele
    achievements.forEach(achievement => {
        const achievementItem = document.createElement('div');
        achievementItem.className = `achievement-item ${achievement.achieved ? 'unlocked' : 'locked'}`;

        const achievementDate = achievement.achieved ?
            new Date(achievement.unlocktime * 1000).toLocaleDateString('tr-TR') :
            'Kilitli';

        // Başarım görsel URL'si
        const iconUrl = achievement.achieved ?
            `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/${achievement.icon}` :
            `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/${achievement.icongray}`;

        achievementItem.innerHTML = `
            <img src="${iconUrl}" 
                 alt="${achievement.name}" 
                 class="achievement-icon"
                 onerror="this.src='https://via.placeholder.com/64x64/333/00ff00?text=?'">
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description || 'Açıklama yok'}</div>
            <div class="achievement-date">${achievementDate}</div>
        `;

        achievementsContainer.appendChild(achievementItem);
    });
}

// Oyun modalını kapat
function closeGameModal() {
    document.getElementById('gameModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Steam entegrasyonunu test et
async function testSteamIntegration() {
    console.log('Steam entegrasyonu test ediliyor...');
    try {
        await loadSteamGames();
    } catch (error) {
        console.error('Steam test hatası:', error);
    }
}

// Progress bar animasyonları
function animateProgressBars() {
    document.querySelectorAll('.skill-progress-fill').forEach((bar, index) => {
        const targetWidth = bar.getAttribute('data-width');
        bar.style.width = '0%';

        setTimeout(() => {
            bar.style.width = targetWidth + '%';
        }, index * 150);
    });
}

// Tıklama sesi
function playClickSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Bildirim göster
function showNotification(message, type = 'info') {
    const notificationContainer = document.querySelector('.notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    }, 3000);
}

// Sayfa yüklendiğinde çalışacak kod
document.addEventListener('DOMContentLoaded', function () {
    createMatrixEffect();
    loadProjects();
    loadSkills();
    loadBlogPosts();
    typeWriter();
    getSpotifyData();      // Backend proxy üzerinden
    startAutoUpdate();     // 30 saniyede bir güncelle
    animateProgressBars();
    loadPostFromURL();

    // Ziyaret istatistiği
    fetch(`${API_BASE}/api/stats/visit`, { method: 'POST' }).catch(() => { });


    // Steam modal event listener'ları
    document.querySelector('#gameModal .close-modal').addEventListener('click', closeGameModal);
    document.getElementById('gameModal').addEventListener('click', (e) => {
        if (e.target.id === 'gameModal') {
            closeGameModal();
        }
    });

    // ESC tuşu ile oyun modalını kapat
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.getElementById('gameModal').style.display === 'block') {
                closeGameModal();
            }
            if (document.getElementById('blogModal').style.display === 'block') {
                closeBlogModal();
            }
        }
    });

    // Steam oyunlarını yükle (oyunlar sekmesine geçince)
    const gamesTab = document.querySelector('[onclick="switchTab(\'games\')"]');
    if (gamesTab) {
        gamesTab.addEventListener('click', function () {
            setTimeout(() => {
                if (steamGames.length === 0) {
                    console.log('Steam oyunları yükleniyor...');
                    loadSteamGames();
                }
            }, 100);
        });
    }

    // Modal paylaş butonu
    document.getElementById('modalShareBtn').addEventListener('click', () => {
        if (currentPostId) {
            shareBlogPost(currentPostId);
        }
    });

    document.addEventListener('click', function (e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
            playClickSound();
        }
    });

    // Örnek bildirimler
    setTimeout(() => {
        showNotification('Site başarıyla yüklendi!', 'success');
    }, 1000);

    setTimeout(() => {
        showNotification('Steam entegrasyonu aktif! Oyunlar sekmesine tıklayın.', 'info');
    }, 2000);
});