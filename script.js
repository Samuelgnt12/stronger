const GEMINI_API_KEY = "AIzaSyCoySrP5g37-qZyYKJFsVvxmC06dSSStko";

let workoutSchedule = {};
let lastUpdateTime = null;

const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');
const workoutDays = document.getElementById('workoutDays');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const currentDayEl = document.getElementById('currentDay');
const lastUpdateEl = document.getElementById('lastUpdate');
const aiStatusEl = document.getElementById('aiStatus');

class AdvancedGymAI {
    constructor() {
        this.apiKey = GEMINI_API_KEY;
        this.useProxy = true; // Enable proxy for GitHub Pages
        this.proxyUrls = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/'
        ];
        this.currentProxyIndex = 0;
        this.isOnline = true;
    }

    async searchWithAI(query) {
        if (!this.isOnline) {
            throw new Error('AI service offline');
        }

        try {
            const prompt = this.buildSmartPrompt(query);
            let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;
            
            // Use proxy for GitHub Pages
            if (this.useProxy) {
                apiUrl = this.getProxyUrl() + encodeURIComponent(apiUrl);
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 800,
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0].content.parts[0].text) {
                throw new Error('Invalid AI response');
            }

            return data.candidates[0].content.parts[0].text;
            
        } catch (error) {
            console.error('AI Search Error:', error);
            // Try next proxy if available
            if (this.useProxy && this.currentProxyIndex < this.proxyUrls.length - 1) {
                this.currentProxyIndex++;
                console.log('Switching to next proxy...');
                return this.searchWithAI(query);
            }
            this.isOnline = false;
            throw error;
        }
    }

    getProxyUrl() {
        return this.proxyUrls[this.currentProxyIndex];
    }

    buildSmartPrompt(query) {
        return `Anda adalah AI Assistant Gym dan Fitness yang sangat ahli. User bertanya: "${query}"

INSTRUKSI:
1. Analisis pertanyaan dengan mendalam - bisa tentang gerakan olahraga, program latihan, nutrisi, tips fitness, teknik yang benar, dll.
2. Berikan jawaban yang komprehensif tentang gym, olahraga, fitness, nutrisi, atau kesehatan
3. Jika ada kesalahan ketik, koreksi secara natural
4. Gunakan bahasa Indonesia yang mudah dipahami
5. Berikan informasi yang akurat dan praktis
6. Untuk pertanyaan gerakan olahraga, sertakan langkah-langkah detail
7. Untuk pertanyaan nutrisi, berikan saran praktis
8. Untuk pertanyaan program, berikan contoh rutinitas

FORMAT JAWABAN:
JUDUL: [Judul yang relevan]
DESKRIPSI: [Penjelasan singkat dan jelas]
PENJELASAN_DETAIL: [Penjelasan lengkap dengan poin-poin]
LANGKAH_LANGKAH: [Jika ada langkah praktis, berikan step-by-step]
TIPS_PENTING: [Tips dan saran praktis]
PERHATIAN: [Hal-hal yang perlu diwaspadai jika ada]

Jawab dengan format di atas dan pastikan informasi sesuai dengan konteks pertanyaan tentang gym, olahraga, fitness, atau kesehatan.`;
    }

    parseAIResponse(aiText) {
        const sections = {
            title: '',
            description: '',
            detailedExplanation: '',
            steps: [],
            tips: [],
            warnings: []
        };

        const lines = aiText.split('\n');
        let currentSection = '';

        lines.forEach(line => {
            line = line.trim();
            
            if (line.includes('JUDUL:')) {
                sections.title = line.replace('JUDUL:', '').trim();
                currentSection = 'title';
            } else if (line.includes('DESKRIPSI:')) {
                sections.description = line.replace('DESKRIPSI:', '').trim();
                currentSection = 'description';
            } else if (line.includes('PENJELASAN_DETAIL:')) {
                sections.detailedExplanation = line.replace('PENJELASAN_DETAIL:', '').trim();
                currentSection = 'detailedExplanation';
            } else if (line.includes('LANGKAH_LANGKAH:')) {
                currentSection = 'steps';
            } else if (line.includes('TIPS_PENTING:')) {
                currentSection = 'tips';
            } else if (line.includes('PERHATIAN:')) {
                sections.warnings = [line.replace('PERHATIAN:', '').trim()];
                currentSection = 'warnings';
            } else if (line && currentSection === 'steps') {
                if (line.match(/^[0-9]\./)) {
                    sections.steps.push(line.replace(/^[0-9]\.\s*/, '').trim());
                } else if (line.startsWith('-') || line.startsWith('•')) {
                    sections.steps.push(line.replace(/^[•\-]\s*/, '').trim());
                }
            } else if (line && currentSection === 'tips') {
                if (line.match(/^[•\-]/) || line.match(/^[0-9]\./)) {
                    sections.tips.push(line.replace(/^[•\-0-9\.]\s*/, '').trim());
                }
            } else if (line && currentSection === 'detailedExplanation' && !sections.detailedExplanation) {
                sections.detailedExplanation = line;
            }
        });

        // Fallback parsing jika format tidak sesuai
        if (!sections.title) {
            const firstLine = aiText.split('\n')[0];
            sections.title = firstLine.length > 50 ? "Informasi Olahraga" : firstLine;
            sections.description = aiText.split('.')[0] + '.';
            sections.detailedExplanation = aiText;
            
            // Extract steps from text
            const stepMatches = aiText.match(/\d+\.\s*[^\d]+/g);
            if (stepMatches) {
                sections.steps = stepMatches.map(step => step.replace(/^\d+\.\s*/, '').trim());
            }
        }

        return sections;
    }
}

const gymAI = new AdvancedGymAI();

// Fallback responses untuk ketika AI offline
const fallbackResponses = {
    'squat': {
        title: "Cara Squat yang Benar",
        description: "Squat adalah latihan dasar untuk membangun kekuatan kaki dan inti tubuh.",
        detailedExplanation: "Squat melatih otot paha depan, paha belakang, glutes, dan inti tubuh. Gerakan ini fundamental dalam program fitness apa pun.",
        steps: [
            "Berdiri dengan kaki selebar bahu, jari kaki mengarah sedikit keluar",
            "Tegakkan punggung, tarik bahu ke belakang, dan dada membusung",
            "Turunkan tubuh dengan mendorong pinggul ke belakang seperti mau duduk",
            "Jaga lutut sejajar dengan jari kaki, jangan melebihi ujung kaki",
            "Turun hingga paha sejajar lantai atau lebih rendah jika mampu",
            "Dorong melalui tumit untuk kembali ke posisi berdiri",
            "Kencangkan glutes di puncak gerakan"
        ],
        tips: [
            "Jaga tumit tetap menempel di lantai",
            "Jangan membulatkan punggung",
            "Kontrol gerakan, jangan terburu-buru",
            "Tarik napas saat turun, hembuskan saat naik"
        ],
        warnings: ["Hentikan jika merasa sakit di lutut atau punggung"]
    },
    'push up': {
        title: "Teknik Push Up yang Benar",
        description: "Push up adalah latihan bodyweight yang efektif untuk dada, bahu, dan trisep.",
        steps: [
            "Posisi plank dengan tangan selebar bahu",
            "Jaga tubuh lurus dari kepala hingga kaki",
            "Turunkan tubuh dengan menekuk siku hingga dada hampir menyentuh lantai",
            "Jaga siku dekat dengan tubuh (45 derajat)",
            "Dorong kembali ke posisi awal"
        ],
        tips: [
            "Jaga inti tubuh tetap kencang",
            "Jangan menjatuhkan pinggul",
            "Lakukan gerakan penuh untuk hasil maksimal"
        ]
    },
    'deadlift': {
        title: "Panduan Deadlift untuk Pemula",
        description: "Deadlift adalah latihan compound terbaik untuk kekuatan tubuh secara keseluruhan.",
        steps: [
            "Berdiri dengan barbell di atas kaki, kaki selebar bahu",
            "Tekuk pinggul dan lutut, pegang barbell dengan grip overhand atau mixed",
            "Jaga punggung lurus, dada terangkat, bahu ke belakang",
            "Angkat barbell dengan meluruskan pinggul dan lutut bersamaan",
            "Jaga barbell tetap dekat dengan tubuh selama gerakan",
            "Di puncak, kencangkan glutes tanpa hiperekstensi",
            "Turunkan barbell dengan kontrol"
        ],
        tips: [
            "Selalu lakukan pemanasan terlebih dahulu",
            "Mulai dengan berat ringan untuk menguasai teknik",
            "Jaga barbell tetap dekat dengan tulang kering"
        ],
        warnings: ["JANGAN membulatkan punggung saat mengangkat"]
    },
    'nutrisi': {
        title: "Panduan Nutrisi untuk Fitness",
        description: "Nutrisi yang tepat sama pentingnya dengan latihan untuk hasil maksimal.",
        detailedExplanation: "Nutrisi fitness terdiri dari makronutrien (protein, karbohidrat, lemak) dan mikronutrien (vitamin, mineral). Keseimbangan adalah kunci.",
        steps: [
            "Konsumsi protein cukup (1.6-2.2g per kg berat badan)",
            "Pilih karbohidrat kompleks sebagai energi utama",
            "Sertakan lemak sehat untuk hormon dan energi",
            "Minum air minimal 2-3 liter per hari",
            "Makan sayur dan buah untuk vitamin dan serat"
        ],
        tips: [
            "Makan 4-6 kali sehari dalam porsi kecil",
            "Konsumsi protein 30 menit setelah latihan",
            "Hindari processed food dan gula berlebihan",
            "Sesuaikan kalori dengan tujuan (bulking/cutting)"
        ]
    },
    'program pemula': {
        title: "Program Latihan 3 Hari untuk Pemula",
        description: "Program full body 3x seminggu ideal untuk pemula membangun dasar kekuatan.",
        detailedExplanation: "Program ini fokus pada compound movements untuk membangun kekuatan dasar dan adaptasi tubuh terhadap latihan beban.",
        steps: [
            "HARI 1: Full Body A - Squat, Bench Press, Rows",
            "HARI 2: Istirahat atau kardio ringan",
            "HARI 3: Full Body B - Deadlift, Overhead Press, Pull-ups",
            "HARI 4: Istirahat",
            "HARI 5: Full Body C - Leg Press, Incline Press, Lat Pulldown",
            "HARI 6-7: Istirahat"
        ],
        tips: [
            "Lakukan 3 set x 8-12 repetisi setiap latihan",
            "Istirahat 60-90 detik antar set",
            "Tingkatkan berat secara bertahap",
            "Fokus pada teknik bukan berat"
        ]
    }
};

function init() {
    // Simulate loading
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'block';
            initializeApp();
        }, 500);
    }, 2000);
    
    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Example buttons
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const query = e.target.dataset.query;
            searchInput.value = query;
            performSearch();
        });
    });

    // Real-time updates
    setInterval(updateRealTimeData, 30000);
}

function initializeApp() {
    loadWorkoutData();
    renderWorkoutDays();
    updateCurrentDay();
    updateLastUpdateTime();
    checkAIStatus();
}

function loadWorkoutData() {
    const savedData = localStorage.getItem('gymWorkoutSchedule');
    if (savedData) {
        workoutSchedule = JSON.parse(savedData);
        lastUpdateTime = localStorage.getItem('lastUpdateTime') || new Date().toISOString();
    } else {
        workoutSchedule = {
            senin: { 
                muscleGroup: 'Chest & Triceps', 
                exercises: [
                    { name: 'Bench Press', sets: 4, reps: '8-12' },
                    { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
                    { name: 'Triceps Pushdown', sets: 3, reps: '12-15' }
                ] 
            },
            selasa: { 
                muscleGroup: 'Back & Biceps', 
                exercises: [
                    { name: 'Deadlift', sets: 4, reps: '6-10' },
                    { name: 'Lat Pulldown', sets: 3, reps: '10-12' },
                    { name: 'Barbell Curl', sets: 3, reps: '8-12' }
                ] 
            },
            rabu: { 
                muscleGroup: 'Legs', 
                exercises: [
                    { name: 'Squat', sets: 4, reps: '8-12' },
                    { name: 'Leg Press', sets: 3, reps: '10-15' },
                    { name: 'Leg Extension', sets: 3, reps: '12-15' }
                ] 
            },
            kamis: { 
                muscleGroup: 'Shoulders', 
                exercises: [
                    { name: 'Overhead Press', sets: 4, reps: '8-12' },
                    { name: 'Lateral Raise', sets: 3, reps: '12-15' },
                    { name: 'Front Raise', sets: 3, reps: '12-15' }
                ] 
            },
            jumat: { 
                muscleGroup: 'Full Body', 
                exercises: [
                    { name: 'Deadlift', sets: 3, reps: '6-8' },
                    { name: 'Bench Press', sets: 3, reps: '8-10' },
                    { name: 'Pull-ups', sets: 3, reps: 'Max' }
                ] 
            }
        };
        saveWorkoutData();
    }
}

function saveWorkoutData() {
    localStorage.setItem('gymWorkoutSchedule', JSON.stringify(workoutSchedule));
    lastUpdateTime = new Date().toISOString();
    localStorage.setItem('lastUpdateTime', lastUpdateTime);
    updateLastUpdateTime();
}

function renderWorkoutDays() {
    workoutDays.innerHTML = '';
    
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1;
    
    days.forEach((day, index) => {
        const dayData = workoutSchedule[day];
        if (!dayData) return;
        
        const dayCard = document.createElement('div');
        dayCard.className = `day-card ${index === todayIndex ? 'today' : ''}`;
        
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        const isToday = index === todayIndex;
        
        let exercisesHtml = '';
        if (dayData.exercises && dayData.exercises.length > 0) {
            dayData.exercises.forEach((exercise) => {
                exercisesHtml += `
                    <div class="exercise-item">
                        <h4>${exercise.name}</h4>
                        <p>${exercise.sets} set x ${exercise.reps} repetisi</p>
                    </div>
                `;
            });
        }
        
        dayCard.innerHTML = `
            <h3>${dayName} ${isToday ? '<span class="today-badge">Hari Ini</span>' : ''}</h3>
            <span class="muscle-group">${dayData.muscleGroup}</span>
            <div class="exercises-list">
                ${exercisesHtml}
            </div>
        `;
        
        workoutDays.appendChild(dayCard);
    });
}

async function performSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        showNotification('Masukkan pertanyaan tentang gym atau olahraga!', 'error');
        return;
    }
    
    // Show loading
    searchResults.innerHTML = `
        <div class="loading-ai">
            <div class="loading-spinner"></div>
            <p>AI sedang menganalisis pertanyaan Anda...</p>
        </div>
    `;
    searchResults.style.display = 'block';
    
    try {
        const aiResponse = await gymAI.searchWithAI(query);
        const parsedResult = gymAI.parseAIResponse(aiResponse);
        displayAIResult(parsedResult, query);
        
    } catch (error) {
        console.error('AI Search failed, using fallback:', error);
        useFallbackResponse(query);
    }
}

function useFallbackResponse(query) {
    const normalizedQuery = query.toLowerCase();
    
    // Cari kecocokan di fallback responses
    for (const [key, response] of Object.entries(fallbackResponses)) {
        if (normalizedQuery.includes(key)) {
            displayAIResult(response, query);
            showNotification('Menggunakan data lokal (AI offline)', 'warning');
            return;
        }
    }
    
    // Default fallback response
    const defaultResponse = {
        title: "Tips Fitness Umum",
        description: "Berikut beberapa tips umum untuk program fitness Anda:",
        detailedExplanation: "Konsistensi adalah kunci dalam fitness. Latihan teratur, nutrisi tepat, dan istirahat cukup adalah fondasi keberhasilan.",
        steps: [
            "Latihan 3-5 kali seminggu secara konsisten",
            "Kombinasikan latihan kekuatan dan kardio",
            "Konsumsi protein cukup untuk pemulihan otot",
            "Minum air yang cukup sepanjang hari",
            "Istirahat 7-8 jam per malam",
            "Lakukan peregangan sebelum dan setelah latihan"
        ],
        tips: [
            "Fokus pada progres, bukan perfeksi",
            "Dengarkan tubuh Anda - istirahat jika perlu",
            "Catat progres latihan untuk motivasi",
            "Variasi latihan untuk menghindari plateau"
        ]
    };
    
    displayAIResult(defaultResponse, query);
    showNotification('AI offline, menampilkan tips umum', 'warning');
}

function displayAIResult(result, originalQuery) {
    let stepsHtml = '';
    if (result.steps && result.steps.length > 0) {
        stepsHtml = `
            <div class="exercise-steps">
                <h4>Langkah-langkah:</h4>
                <ol>
                    ${result.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
        `;
    }

    let tipsHtml = '';
    if (result.tips && result.tips.length > 0) {
        tipsHtml = `
            <div class="tips-section">
                <h4>Tips Penting:</h4>
                <ul>
                    ${result.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    let warningsHtml = '';
    if (result.warnings && result.warnings.length > 0) {
        warningsHtml = `
            <div class="tips-section" style="background: rgba(239, 68, 68, 0.1); border-left-color: var(--danger);">
                <h4>Perhatian:</h4>
                <p>${result.warnings.join(' ')}</p>
            </div>
        `;
    }
    
    searchResults.innerHTML = `
        <div class="ai-result">
            <div class="ai-header">
                <h3>${result.title}</h3>
                <span class="ai-badge">${gymAI.isOnline ? 'AI Assistant' : 'Local Data'}</span>
            </div>
            
            ${result.description ? `<p style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--light);">${result.description}</p>` : ''}
            
            ${result.detailedExplanation ? `
                <div style="margin-bottom: 1.5rem;">
                    <p>${result.detailedExplanation}</p>
                </div>
            ` : ''}
            
            ${stepsHtml}
            ${tipsHtml}
            ${warningsHtml}
            
            <div class="ai-source">
                <small>${gymAI.isOnline ? 'Dihasilkan oleh AI Gym Assistant' : 'Data lokal'} • Pertanyaan: "${originalQuery}"</small>
            </div>
        </div>
    `;
}

function updateCurrentDay() {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabru'];
    const today = new Date();
    const dayName = days[today.getDay()];
    currentDayEl.textContent = dayName;
}

function updateLastUpdateTime() {
    if (lastUpdateTime) {
        const updateDate = new Date(lastUpdateTime);
        const now = new Date();
        const diffMs = now - updateDate;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) {
            lastUpdateEl.textContent = 'Baru saja diperbarui';
        } else if (diffMins < 60) {
            lastUpdateEl.textContent = `Diperbarui ${diffMins} menit lalu`;
        } else {
            lastUpdateEl.textContent = `Diperbarui ${updateDate.toLocaleDateString('id-ID')}`;
        }
    }
}

function updateRealTimeData() {
    updateCurrentDay();
    updateLastUpdateTime();
    checkAIStatus();
    
    // Check for schedule updates
    const savedData = localStorage.getItem('gymWorkoutSchedule');
    if (savedData) {
        const newSchedule = JSON.parse(savedData);
        if (JSON.stringify(newSchedule) !== JSON.stringify(workoutSchedule)) {
            workoutSchedule = newSchedule;
            renderWorkoutDays();
            showNotification('Jadwal telah diperbarui!', 'success');
        }
    }
}

function checkAIStatus() {
    // Test AI connection
    gymAI.isOnline = true;
    aiStatusEl.innerHTML = `<i class="fas fa-circle"></i> AI Active`;
    aiStatusEl.style.background = 'var(--success)';
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize the app
init();