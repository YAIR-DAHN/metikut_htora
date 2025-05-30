// הגדרות הפודקאסט
const PODCAST_CONFIG = {
    enableLotteryForm: false, // הפעלה/השבתה של טופס ההגרלה
    // enableLotteryForm: true, // הפעלה/השבתה של טופס ההגרלה
    minListenPercentage: 90, // אחוז מינימלי להאזנה מלאה
    skipInterval: 10, // שניות לדילוג קדימה/אחורה
    resumeBuffer: 5, // שניות לחזור אחורה בהמשך האזנה
};

// רשימת הפרקים - כאן תוסיף פרקים חדשים
const EPISODES = [
    {
        id: 'episode1',
        number: 1,
        title: 'פרק א - דף לג: עד לד.',
        description: 'הפרק עוסק מתחילת הפרק עד שני הלישנות ברבא',
        audioFile: 'assets/podcast/מאזינים למפקיד פרק א.mp3',
        duration: "07:18" // אורך הפרק
    },
    {
        id: 'episode2',
        number: 2,
        title: 'פרק ב - המשך דף לד.',
        description: 'הפרק עוסק בסוגיה של "לא שילם שילם ממש" עד סוף העמוד',
        audioFile: 'assets/podcast/מאזינים למפקיד פרק ב.mp3',
        duration: "06:44"
    }
];

// משתנים גלובליים
let currentEpisode = null;
let audioPlayer = null;
let isPlaying = false;
let playbackData = {};
let listenHistory = {};
let hasCompletedEpisode = false;

// אתחול הדף
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing podcast page...');
    initPodcastPlayer();
    loadEpisodes();
    loadPlaybackData();
    setupEventListeners();
    // setupBranchAutocomplete(); // הוסר! נקרא רק במודל דינמי
    // initDarkMode מוגדרת כבר ב-common.js ונטענת אוטומטית
});

function initPodcastPlayer() {
    audioPlayer = document.getElementById('podcastAudio');
    
    if (!audioPlayer) {
        console.error('Audio element not found!');
        return;
    }
    
    // הגדרת אירועי השמעה
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleEpisodeEnd);
    audioPlayer.addEventListener('play', handlePlay);
    audioPlayer.addEventListener('pause', handlePause);
    audioPlayer.addEventListener('progress', updateBuffered);
}

function loadEpisodes() {
    const episodesList = document.getElementById('episodesList');
    if (!episodesList) {
        console.error('Episodes list element not found!');
        return;
    }
    
    episodesList.innerHTML = '';
    
    EPISODES.forEach(episode => {
        const episodeElement = createEpisodeElement(episode);
        episodesList.appendChild(episodeElement);
    });
}

function createEpisodeElement(episode) {
    const div = document.createElement('div');
    div.className = 'episode-item';
    div.dataset.episodeId = episode.id;
    
    div.innerHTML = `
        <div class="episode-number">${episode.number}</div>
        <div class="episode-details">
            <h3 class="episode-name">${episode.title}</h3>
            <p class="episode-desc">${episode.description}</p>
            <div class="episode-duration">
                <span class="material-icons">schedule</span>
                <span>${episode.duration || 'טוען...'}</span>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => selectEpisode(episode));
    return div;
}

function selectEpisode(episode) {
    // עצירת ניגון קודם
    if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
    }
    // איפוס משתנים
    hasCompletedEpisode = false;
    isPlaying = false;
    // הסתרת מודלים
    // הוסר: לא צריך להסתיר מודלים סטטיים
    currentEpisode = episode;
    
    // עדכון UI
    document.querySelectorAll('.episode-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-episode-id="${episode.id}"]`).classList.add('active');
    
    // עדכון פרטי הפרק
    document.getElementById('episodeTitle').textContent = episode.title;
    document.getElementById('episodeDescription').textContent = episode.description;
    
    // טעינת האודיו
    console.log('Loading audio:', episode.audioFile);
    audioPlayer.src = episode.audioFile;
    
    // מחכים שהאודיו יטען לפני הפעלת הכפתור
    audioPlayer.addEventListener('loadeddata', () => {
        console.log('Audio loaded successfully');
        document.getElementById('playPauseBtn').disabled = false;
    }, { once: true });
    
    // טיפול בשגיאות טעינה
    audioPlayer.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
        showModal({
            title: 'שגיאה בטעינת האודיו',
            message: 'לא ניתן לטעון את קובץ האודיו. אנא נסה שוב.',
            icon: 'error'
        });
        document.getElementById('playPauseBtn').disabled = true;
    }, { once: true });
    
    // בדיקה אם יש נתוני המשך האזנה
    checkResumePlayback(episode.id);
}

function checkResumePlayback(episodeId) {
    const savedTime = playbackData[episodeId];
    if (savedTime && savedTime > 5) {
        const minutes = Math.floor(savedTime / 60);
        const seconds = Math.floor(savedTime % 60);
        showModal({
            title: 'המשך האזנה',
            message: `זיהינו שהפסקת להאזין בדקה <b>${minutes}:${seconds.toString().padStart(2, '0')}</b><br>האם תרצה להמשיך מהמקום שהפסקת?`,
            icon: 'play_circle_outline',
            confirmText: 'המשך מהמקום שהפסקתי',
            cancelText: 'התחל מההתחלה',
            onConfirm: resumePlayback,
            onCancel: startFromBeginning
        });
    }
}

function resumePlayback() {
    if (!currentEpisode || !audioPlayer) return;
    const savedTime = playbackData[currentEpisode.id];
    const resumeTime = Math.max(0, savedTime - PODCAST_CONFIG.resumeBuffer);
    audioPlayer.currentTime = resumeTime;
    playPause();
}

function startFromBeginning() {
    if (!currentEpisode || !audioPlayer) return;
    audioPlayer.currentTime = 0;
    playPause();
}

function playPause() {
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play();
    }
}

function handlePlay() {
    isPlaying = true;
    updatePlayButton();
    showPlayingIndicator(true);
    
    // רישום תחילת האזנה
    if (!listenHistory[currentEpisode.id]) {
        listenHistory[currentEpisode.id] = {
            startTime: Date.now(),
            totalListened: 0,
            completed: false
        };
    }
}

function handlePause() {
    isPlaying = false;
    updatePlayButton();
    showPlayingIndicator(false);
    savePlaybackPosition();
    
    // עדכון זמן האזנה
    if (listenHistory[currentEpisode.id]) {
        const sessionTime = (Date.now() - listenHistory[currentEpisode.id].startTime) / 1000;
        listenHistory[currentEpisode.id].totalListened += sessionTime;
        listenHistory[currentEpisode.id].startTime = Date.now();
    }
}

function updatePlayButton() {
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    
    if (isPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
}

function showPlayingIndicator(show) {
    const indicator = document.querySelector('.playing-indicator');
    if (show) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }
}

function updateDuration() {
    const duration = audioPlayer.duration;
    document.getElementById('totalTime').textContent = formatTime(duration);
    
    // עדכון משך הפרק ברשימה
    if (currentEpisode) {
        currentEpisode.duration = formatTime(duration);
        const durationElement = document.querySelector(`[data-episode-id="${currentEpisode.id}"] .episode-duration span:last-child`);
        if (durationElement) {
            durationElement.textContent = currentEpisode.duration;
        }
    }
}

function updateProgress() {
    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration;
    const progress = (currentTime / duration) * 100;
    
    document.getElementById('currentTime').textContent = formatTime(currentTime);
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressHandle').style.left = `${progress}%`;
    
    // שמירת מיקום כל 5 שניות
    if (Math.floor(currentTime) % 5 === 0) {
        savePlaybackPosition();
    }
}

function updateBuffered() {
    if (audioPlayer.buffered.length > 0) {
        const bufferedEnd = audioPlayer.buffered.end(audioPlayer.buffered.length - 1);
        const duration = audioPlayer.duration;
        const bufferedProgress = (bufferedEnd / duration) * 100;
        document.getElementById('bufferedBar').style.width = `${bufferedProgress}%`;
    }
}

function handleEpisodeEnd() {
    const listenData = listenHistory[currentEpisode.id];
    // חישוב אחוז האזנה אמיתי
    const totalListened = listenData ? listenData.totalListened : 0;
    const duration = audioPlayer.duration;
    const listenPercentage = (totalListened / duration) * 100;
    if (listenPercentage >= PODCAST_CONFIG.minListenPercentage && !hasCompletedEpisode) {
        hasCompletedEpisode = true;
        listenData.completed = true;
        saveListenData();
        if (PODCAST_CONFIG.enableLotteryForm) {
            setTimeout(() => {
                showLotteryModal();
            }, 500);
        }
    }
    delete playbackData[currentEpisode.id];
    savePlaybackPosition();
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function savePlaybackPosition() {
    if (currentEpisode && audioPlayer.currentTime > 0) {
        playbackData[currentEpisode.id] = audioPlayer.currentTime;
        localStorage.setItem('podcastPlayback', JSON.stringify(playbackData));
    }
}

function loadPlaybackData() {
    const saved = localStorage.getItem('podcastPlayback');
    if (saved) {
        playbackData = JSON.parse(saved);
    }
}

function setupEventListeners() {
    // כפתורי בקרה
    document.getElementById('playPauseBtn').addEventListener('click', playPause);
    document.getElementById('skipBackward').addEventListener('click', () => skip(-PODCAST_CONFIG.skipInterval));
    document.getElementById('skipForward').addEventListener('click', () => skip(PODCAST_CONFIG.skipInterval));
    
    // סגירת מודל המשך האזנה בלחיצה על הרקע
    const resumeModal = document.getElementById('resumeModal');
    if (resumeModal) {
        resumeModal.addEventListener('click', (e) => {
            if (e.target === resumeModal) {
                resumeModal.classList.add('hidden');
            }
        });
    }
    
    // סגירת מודל סיום האזנה בלחיצה על הרקע
    const completionModal = document.getElementById('completionModal');
    if (completionModal) {
        completionModal.addEventListener('click', (e) => {
            if (e.target === completionModal) {
                completionModal.classList.add('hidden');
            }
        });
    }
    
    // בקרת מהירות
    const speedBtn = document.getElementById('speedBtn');
    const speedMenu = document.getElementById('speedMenu');
    
    speedBtn.addEventListener('click', () => {
        speedMenu.classList.toggle('hidden');
    });
    
    speedMenu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseFloat(btn.dataset.speed);
            audioPlayer.playbackRate = speed;
            speedBtn.querySelector('span').textContent = `${speed}x`;
            speedMenu.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            speedMenu.classList.add('hidden');
        });
    });
    
    // בקרת עוצמת קול
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeRange = document.getElementById('volumeRange');
    
    volumeBtn.addEventListener('click', () => {
        volumeSlider.classList.toggle('hidden');
    });
    
    volumeRange.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        audioPlayer.volume = volume;
        updateVolumeIcon(volume);
    });
    
    // סרגל התקדמות
    const progressBar = document.querySelector('.progress-bar-container');
    progressBar.addEventListener('click', seekTo);
    
    // סגירת תפריטים בלחיצה מחוץ
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.speed-control')) {
            speedMenu.classList.add('hidden');
        }
        if (!e.target.closest('.control-btn') && !e.target.closest('.volume-slider')) {
            volumeSlider.classList.add('hidden');
        }
    });
}

function skip(seconds) {
    if (audioPlayer.src) {
        audioPlayer.currentTime = Math.max(0, Math.min(audioPlayer.currentTime + seconds, audioPlayer.duration));
    }
}

function seekTo(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left;
    // אם RTL, נהפוך את הכיוון
    if (document.dir === 'rtl' || getComputedStyle(document.body).direction === 'rtl') {
        x = rect.width - x;
    }
    const percentage = x / rect.width;
    if (audioPlayer.src) {
        audioPlayer.currentTime = percentage * audioPlayer.duration;
    }
}

function updateVolumeIcon(volume) {
    const volumeIcon = document.querySelector('#volumeBtn .material-icons');
    if (volume === 0) {
        volumeIcon.textContent = 'volume_off';
    } else if (volume < 0.5) {
        volumeIcon.textContent = 'volume_down';
    } else {
        volumeIcon.textContent = 'volume_up';
    }
}

// טופס הגרלה
async function submitLotteryForm(event) {
    event.preventDefault();
    
    const userDetails = {
        userName: document.getElementById('lotteryName').value,
        phone: document.getElementById('lotteryPhone').value,
        branch: document.getElementById('lotteryBranch').value,
        episode: currentEpisode.title,
        date: new Date().toISOString()
    };
    
    showLoading();
    
    try {
        const result = await fetchFromAPI('submitPodcastLottery', 'POST', { userDetails: userDetails });
        
        if (result.success) {
            showModal({
                title: 'נרשמת בהצלחה!',
                message: 'פרטיך נקלטו במערכת והוכנסת להגרלה. בהצלחה!',
                icon: 'check_circle',
                onConfirm: () => {
                    document.getElementById('completionModal').classList.add('hidden');
                    document.getElementById('lotteryForm').reset();
                }
            });
        }
    } catch (error) {
        console.error('שגיאה בשליחת הטופס:', error);
        showModal({
            title: 'שגיאה',
            message: 'אירעה שגיאה בשליחת הטופס. אנא נסה שוב.',
            icon: 'error'
        });
    } finally {
        hideLoading();
    }
}

function showLotteryModal() {
    showModal({
        title: 'כל הכבוד!',
        message: `<p>סיימת להאזין לפרק במלואו!</p>
                  <p>אתה זכאי להשתתף בהגרלה על פרסים יקרי ערך</p>
                  <form id="lotteryForm" style="margin-top:1rem;">
                    <div class="form-group">
                        <label for="lotteryName">שם מלא</label>
                        <input type="text" id="lotteryName" required>
                    </div>
                    <div class="form-group">
                        <label for="lotteryPhone">מספר טלפון</label>
                        <input type="tel" id="lotteryPhone" pattern="[0-9]{10}" required>
                    </div>
                    <div class="form-group">
                        <label for="lotteryBranch">סניף</label>
                        <div class="branch-search-container">
                            <input type="text" id="lotteryBranch" required placeholder="הקלד לחיפוש סניף...">
                            <div class="branch-results"></div>
                        </div>
                    </div>
                    <button type="submit" class="submit-button">שלח והשתתף בהגרלה</button>
                  </form>` ,
        icon: 'celebration',
        confirmText: 'סגור',
        onConfirm: () => {},
        onCancel: null
    });
    // הפעלת אוטוקומפליט לסניפים
    setTimeout(setupBranchAutocomplete, 100);
    // טיפול בשליחת הטופס
    setTimeout(() => {
        const form = document.getElementById('lotteryForm');
        if (form) {
            form.addEventListener('submit', submitLotteryForm);
        }
    }, 100);
}

function closeCompletionModal() {
    // לא רלוונטי יותר, כי המודל דינמי
}

// שמירת נתוני האזנה
async function saveListenData() {
    if (!currentEpisode) return;
    const deviceId = getOrCreateDeviceId();
    const listenData = {
        deviceId,
        episodeId: currentEpisode.id,
        episode: currentEpisode.title,
        date: new Date().toISOString(),
        duration: formatTime(listenHistory[currentEpisode.id].totalListened),
        completed: listenHistory[currentEpisode.id].completed
    };
    try {
        console.log('שולח נתוני האזנה ל-API:', listenData);
        const result = await fetchFromAPI('savePodcastListen', 'POST', { listenData: listenData });
        console.log('תשובת API:', result);
    } catch (error) {
        console.error('שגיאה בשמירת נתוני האזנה:', error);
    }
}

function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('podcastDeviceId');
    if (!deviceId) {
        deviceId = 'dev-' + Math.random().toString(36).substr(2, 12) + '-' + Date.now();
        localStorage.setItem('podcastDeviceId', deviceId);
    }
    return deviceId;
}

// הגדרת השלמה אוטומטית לסניפים
function setupBranchAutocomplete() {
    const branchInput = document.getElementById('lotteryBranch');
    if (!branchInput) {
        console.log('Branch input not found - modal not open yet');
        return;
    }
    
    const resultsContainer = branchInput.nextElementSibling;
    
    branchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.trim();
        
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }
        
        const branches = cache.branches || await loadBranches();
        const filtered = branches.filter(branch => 
            branch.includes(searchTerm)
        ).slice(0, 5);
        
        resultsContainer.innerHTML = filtered.map(branch => 
            `<div class="branch-result-item" onclick="selectBranch('${branch}', 'lotteryBranch')">${branch}</div>`
        ).join('');
    });
    
    // סגירת רשימת התוצאות בלחיצה מחוץ
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.branch-search-container')) {
            resultsContainer.innerHTML = '';
        }
    });
}

function selectBranch(branch, inputId) {
    document.getElementById(inputId).value = branch;
    document.querySelector(`#${inputId}`).nextElementSibling.innerHTML = '';
}

async function loadBranches() {
    try {
        const response = await fetchFromAPI('getBranches');
        cache.branches = response.data;
        return cache.branches;
    } catch (error) {
        console.error('שגיאה בטעינת רשימת הסניפים:', error);
        return [];
    }
}

// פונקציות גלובליות עבור onclick
window.resumePlayback = resumePlayback;
window.startFromBeginning = startFromBeginning;
window.closeCompletionModal = closeCompletionModal;
window.submitLotteryForm = submitLotteryForm;
window.selectBranch = selectBranch; 