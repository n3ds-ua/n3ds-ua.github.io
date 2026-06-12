// =========================================
// 1. КОНФІГУРАЦІЯ ТА ІНІЦІАЛІЗАЦІЯ
// =========================================
const CTR_ICON_FILES = [
    'assets/icons/3DS - HOME Menu - Nintendo 3DS Sound - HOME Menu Icon.png',
    'assets/icons/3DS - HOME Menu - Internet Browser - Save Data Icon.png',
    'assets/icons/3DS - HOME Menu - System Settings - HOME Menu Icon.png',
    'assets/icons/3DS - HOME Menu - Nintendo 3DS Camera - HOME Menu Icon.png',
    'assets/icons/3DS - HOME Menu - Nintendo eShop - HOME Menu Icon.png',
    'assets/icons/3DS - HOME Menu - Game Notes - Save Data Icon.png',
    'assets/icons/3DS - HOME Menu - Friend List - Save Data Icon.png',
    'assets/icons/3DS - HOME Menu - Notifications - Save Data Icon.png',
    'assets/icons/3DS - HOME Menu - Activity Log - HOME Menu Icon.png',
    'assets/icons/3DS - HOME Menu - Download Play - HOME Menu Icon.png',
    'assets/icons/3DS - HOME Menu - Mii Maker - HOME Menu Icon.png'
];

// Створюємо аудіо об'єкти (полегшений варіант для iOS)
const sounds = {
    hover: new Audio('assets/sounds/SE_CTR_HOME_ICON_TOUCH.wav'),
    click: new Audio('assets/sounds/SE_CTR_MYMENU_DECIDE.wav'),
    folder: new Audio('assets/sounds/SE_CTR_HOME_OPEN_FOLDER.wav')
};

let audioUnlocked = false;

// iOS вимагає дотику для розблокування звуку
function unlockAudio() {
    if (!audioUnlocked) {
        audioUnlocked = true;
        Object.values(sounds).forEach(s => s.load()); 
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('mousedown', unlockAudio);
    }
}
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('mousedown', unlockAudio, { once: true });

function playSound(type) {
    if (sounds[type] && audioUnlocked) {
        sounds[type].currentTime = 0;
        sounds[type].play().catch(() => {}); 
    }
}

// =========================================
// 3. ДЕЛЕГУВАННЯ ПОДІЙ (ЗВУКИ)
// =========================================
document.addEventListener('click', (e) => {
    const button = e.target.closest('.btn, .external-link, .card-button');
    if (button) {
        if (button.id === 'theme-toggle' || button.classList.contains('color-theme-btn')) {
            playSound('folder');
        } else {
            playSound('click');
        }
    }
});

document.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.card');
    if (card && !card.classList.contains('sound-hovered')) {
        playSound('hover');
        card.classList.add('sound-hovered');
    }
    if (e.target.classList.contains('header-logo') && !e.target.classList.contains('sound-hovered')) {
        playSound('hover');
        e.target.classList.add('sound-hovered');
    }
});

document.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.card');
    if (card) {
        if (!e.relatedTarget || !card.contains(e.relatedTarget)) {
            card.classList.remove('sound-hovered');
        }
    }
    if (e.target.classList.contains('header-logo')) {
        e.target.classList.remove('sound-hovered');
    }
});

// =========================================
// 4. ЗАВАНТАЖЕННЯ КОНТЕНТУ (JSON & Masonry)
// =========================================
let cachedGames = [];
let cachedGuides = [];
let isGamesSubpage = false;
let isGuidesSubpage = false;
let resizeTimer;

async function loadContent() {
    try {
        // --- ІГРИ ---
        const gamesContainer = document.getElementById('games-container');
        if (gamesContainer) {
            isGamesSubpage = gamesContainer.classList.contains('col-3');
            const fetchUrl = isGamesSubpage ? 'games.json' : 'featured_games.json';

            const gamesRes = await fetch(fetchUrl + '?t=' + Date.now());
            const games = await gamesRes.json();
            
            cachedGames = games.map(game => `
                <div class="card">
                    ${game.image_url ? `<img src="${game.image_url}" alt="${game.title}" class="game-img">` : ''}
                    <h3>${game.title}</h3>
                    <p>${game.description}</p>
                    <a href="${game.tg_link}" target="_blank" class="btn btn-primary external-link">Завантажити</a>
                </div>
            `);
            renderMasonry(gamesContainer, cachedGames, isGamesSubpage);
        }

        // --- ГАЙДИ ---
        const guidesContainer = document.getElementById('guides-container');
        if (guidesContainer) {
            isGuidesSubpage = guidesContainer.classList.contains('col-3');
            const fetchUrl = isGuidesSubpage ? 'guides.json' : 'featured_guides.json';

            const guidesRes = await fetch(fetchUrl + '?t=' + Date.now());
            const guides = await guidesRes.json();
            
            cachedGuides = guides.map(guide => `
                <div class="card">
                    ${guide.image_url ? `<img src="${guide.image_url}" alt="${guide.title}" class="guide-img">` : ''}
                    <h3>${guide.title}</h3>
                    <p>${guide.description}</p>
                    <a href="${guide.youtube_link}" target="_blank" class="btn external-link">На YouTube</a>
                    <br>
                    <a href="${guide.tg_link}" target="_blank" class="btn external-link" style="margin-top:10px;">В Telegram</a>
                </div>
            `);
            renderMasonry(guidesContainer, cachedGuides, isGuidesSubpage);
        }
    } catch (error) {
        console.error("Помилка завантаження даних:", error);
    }
}

function renderMasonry(container, itemsArray, isSubpage) {
    if (!container) return;
    container.innerHTML = '';
    
    container.style.display = 'flex';
    container.style.gap = '20px';
    container.style.alignItems = 'flex-start';

    let colsCount = 1;
    if (window.innerWidth > 580) colsCount = 2;
    if (window.innerWidth > 850 && isSubpage) colsCount = 3;

    const columns = [];
    for (let i = 0; i < colsCount; i++) {
        const col = document.createElement('div');
        col.style.display = 'flex';
        col.style.flexDirection = 'column';
        col.style.gap = '20px';
        col.style.flex = '1';
        col.style.minWidth = '0'; 
        columns.push(col);
        container.appendChild(col);
    }

    itemsArray.forEach((itemHTML, index) => {
        const colIndex = index % colsCount;
        columns[colIndex].insertAdjacentHTML('beforeend', itemHTML);
    });
}

window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const gamesContainer = document.getElementById('games-container');
        if (gamesContainer && cachedGames.length > 0) renderMasonry(gamesContainer, cachedGames, isGamesSubpage);
        
        const guidesContainer = document.getElementById('guides-container');
        if (guidesContainer && cachedGuides.length > 0) renderMasonry(guidesContainer, cachedGuides, isGuidesSubpage);
    }, 200);
});

// =========================================
// 5. ПЕРЕМИКАЧ ТЕМ
// =========================================
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark') {
            themeToggle.textContent = 'Світла тема';
        } else if (savedTheme !== 'light') {
            themeToggle.textContent = 'Темна / Світла'; 
        }
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = 'Темна тема';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = 'Світла тема';
        }
    });
}

// =========================================
// 6. КНОПКИ СКРОЛУ
// =========================================
const scrollGuidesBtn = document.getElementById('scroll-to-guides');
const scrollTopBtn = document.getElementById('scroll-to-top');

if (scrollGuidesBtn) {
    scrollGuidesBtn.addEventListener('click', () => {
        const section = document.getElementById('guides-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
}

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

window.addEventListener('scroll', () => {
    if (window.scrollY > 250) {
        if (scrollGuidesBtn) {
            scrollGuidesBtn.style.opacity = '0';
            scrollGuidesBtn.style.pointerEvents = 'none';
        }
        if (scrollTopBtn) {
            scrollTopBtn.style.opacity = '1';
            scrollTopBtn.style.pointerEvents = 'auto';
        }
    } else {
        if (scrollGuidesBtn) {
            scrollGuidesBtn.style.opacity = '1';
            scrollGuidesBtn.style.pointerEvents = 'auto';
        }
        if (scrollTopBtn) {
            scrollTopBtn.style.opacity = '0';
            scrollTopBtn.style.pointerEvents = 'none';
        }
    }
});

// =========================================
// 7. ФОН ТА РУХОМИЙ БАНЕР
// =========================================
function createBackgroundShapes() {
    const container = document.createElement('div');
    container.className = 'bg-animation-container';
    document.body.appendChild(container);

    for (let i = 0; i < 20; i++) {
        const shape = document.createElement('div');
        shape.className = 'floating-shape';
        
        const size = Math.random() * 50 + 30;
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
        shape.style.left = `${Math.random() * 100}vw`;
        shape.style.animationDuration = `${Math.random() * 20 + 10}s`;
        shape.style.animationDelay = `${Math.random() * 5}s`;
        
        const randomIconIndex = Math.floor(Math.random() * CTR_ICON_FILES.length);
        shape.style.backgroundImage = `url('${CTR_ICON_FILES[randomIconIndex]}')`;
        
        container.appendChild(shape);
    }
}

function createScrollingBanner() {
    if (document.querySelector('.header-subpage') || document.body.classList.contains('subpage')) {
        return; 
    }

    const header = document.querySelector('.header');
    if (!header) return;

    const bannerContainer = document.createElement('div');
    bannerContainer.className = 'scrolling-banner-container';
    
    const banner = document.createElement('div');
    banner.className = 'scrolling-banner';
    
    const displayIcons = [...CTR_ICON_FILES, ...CTR_ICON_FILES, ...CTR_ICON_FILES];
    
    displayIcons.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'scrolling-icon';
        banner.appendChild(img);
    });
    
    bannerContainer.appendChild(banner);
    header.insertBefore(bannerContainer, header.firstChild);
}

// =========================================
// 8. СЕКРЕТНА ПАСХАЛКА (ІДЕАЛЬНА СИМЕТРІЯ)
// =========================================
let logoClicks = 0;
let logoClickTimer;

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('header-logo')) {
        logoClicks++;
        
        clearTimeout(logoClickTimer);
        logoClickTimer = setTimeout(() => { logoClicks = 0; }, 1500); 

        if (logoClicks === 10) {
            unlockSecretThemes(true); 
            logoClicks = 0; 
        }
    }
});

function unlockSecretThemes(showAnimation) {
    sessionStorage.setItem('secretThemesUnlocked', 'true');
    
    if (document.getElementById('secret-themes-wrapper')) return;

    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'secret-themes-wrapper';
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.gap = '10px';
    wrapper.style.flexWrap = 'wrap';
    wrapper.style.opacity = '0'; 
    wrapper.style.transition = 'opacity 0.8s ease';

    themeToggle.parentNode.insertBefore(wrapper, themeToggle);

    const themesLeft = [
        { name: 'magenta', color: '#ff0055', label: 'Рожевий' },
        { name: 'lime', color: '#9deb00', label: 'Лайм' },
        { name: 'green', color: '#00d960', label: 'Зелений' }
    ];
    
    const themesRight = [
        { name: 'skyblue', color: '#00bfff', label: 'Небесний' },
        { name: 'purple', color: '#b000ff', label: 'Фіолетовий' },
        { name: 'orange', color: '#ff6a00', label: 'Помаранч' }
    ];

    function createThemeBtn(t) {
        const btn = document.createElement('button');
        btn.className = 'btn color-theme-btn'; 
        btn.textContent = t.label; 
        btn.style.backgroundColor = t.color;
        btn.style.color = '#fff';
        btn.style.margin = '0'; 
        btn.style.border = '2px solid var(--glass-border)';
        
        btn.addEventListener('click', (e) => {
            document.body.setAttribute('data-theme', t.name);
            localStorage.setItem('theme', t.name); 
            themeToggle.textContent = 'Темна / Світла'; 
            
            e.target.style.transform = 'scale(0.9)';
            setTimeout(() => e.target.style.transform = '', 150);
        });
        return btn;
    }

    themesLeft.forEach(t => wrapper.appendChild(createThemeBtn(t)));
    themeToggle.style.margin = '0'; 
    wrapper.appendChild(themeToggle);
    themesRight.forEach(t => wrapper.appendChild(createThemeBtn(t)));

    setTimeout(() => { wrapper.style.opacity = '1'; }, 50);

    if (showAnimation) {
        fireConfetti(wrapper);
        playSound('click'); 
    }
}

function fireConfetti(sourceElement) {
    const rect = sourceElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const colors = ['#ff0055', '#9deb00', '#00bfff', '#b000ff', '#ff6a00', '#ffeb3b'];

    for (let i = 0; i < 70; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = Math.random() * 8 + 6 + 'px';
        confetti.style.height = Math.random() * 8 + 6 + 'px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        confetti.style.left = centerX + 'px';
        confetti.style.top = centerY + 'px';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999999';
        document.body.appendChild(confetti);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 80 + Math.random() * 250; 
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 150; 

        confetti.animate([
            { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random() * 500}deg)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 1500,
            easing: 'cubic-bezier(.25,.1,.25,1)'
        }).onfinish = () => confetti.remove();
    }
}

if (sessionStorage.getItem('secretThemesUnlocked') === 'true') {
    unlockSecretThemes(false); 
}

// =========================================
// 9. ІНІЦІАЛІЗАЦІЯ ПРИ ЗАВАНТАЖЕННІ (БЛИСКАВИЧНА)
// =========================================

window.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
        // Лоадер зникає майже одразу після відмальовування тексту
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 400); 
    }
    
    createBackgroundShapes();
    createScrollingBanner(); 
    loadContent();
});

// --- ФІКС ДЛЯ ЖЕСТУ "НАЗАД" НА IPHONE ТА ANDROID (BFCache) ---
window.addEventListener('pageshow', (event) => {
    // event.persisted означає, що сторінку було відновлено з кешу браузера (жест назад)
    if (event.persisted) {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.classList.add('hidden'); // Примусово ховаємо лоадер після повернення
        }
    }
});
// -----------------------------------------------------------

// Клік по посиланню: Лоадер при переході
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    const target = link.getAttribute('target');

    if (href && href.endsWith('.html') && target !== '_blank') {
        e.preventDefault(); 
        
        const loader = document.getElementById('page-loader');
        if (loader) {
            playSound('folder'); 
            loader.classList.remove('hidden'); 
            
            setTimeout(() => {
                window.location.href = href;
            }, 800); // Час затримки при переході
        } else {
            window.location.href = href;
        }
    }
});

// Клік по посиланню: Лоадер при переході
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    const target = link.getAttribute('target');

    if (href && href.endsWith('.html') && target !== '_blank') {
        e.preventDefault(); 
        
        const loader = document.getElementById('page-loader');
        if (loader) {
            playSound('folder'); 
            loader.classList.remove('hidden'); 
            
            setTimeout(() => {
                window.location.href = href;
            }, 800); // Зменшено час затримки при переході
        } else {
            window.location.href = href;
        }
    }
});