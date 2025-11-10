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
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.isOnline = true;
        this.retryCount = 0;
        this.maxRetries = 2;
    }

    async searchWithAI(query) {
        if (!this.isOnline) {
            throw new Error('AI service offline');
        }

        try {
            // Coba direct call pertama
            return await this.makeDirectAPICall(query);
        } catch (error) {
            console.log('Direct API failed, trying CORS proxy...');
            this.retryCount++;
            
            if (this.retryCount <= this.maxRetries) {
                return await this.makeProxyAPICall(query);
            } else {
                this.isOnline = false;
                throw new Error('All connection attempts failed');
            }
        }
    }

    async makeDirectAPICall(query) {
        const prompt = this.buildSmartPrompt(query);
        const url = `${this.baseUrl}?key=${this.apiKey}`;
        
        const response = await fetch(url, {
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
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error('Invalid AI response format');
        }

        this.retryCount = 0; // Reset retry count on success
        return data.candidates[0].content.parts[0].text;
    }

    async makeProxyAPICall(query) {
        const prompt = this.buildSmartPrompt(query);
        const directUrl = `${this.baseUrl}?key=${this.apiKey}`;
        
        // List of CORS proxies to try
        const proxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/'
        ];

        for (const proxy of proxies) {
            try {
                console.log(`Trying proxy: ${proxy}`);
                const proxyUrl = proxy + encodeURIComponent(directUrl);
                
                const response = await fetch(proxyUrl, {
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
                            temperature: 0.7
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.retryCount = 0;
                    return data.candidates[0].content.parts[0].text;
                }
            } catch (proxyError) {
                console.log(`Proxy ${proxy} failed:`, proxyError);
                continue;
            }
        }
        
        throw new Error('All proxies failed');
    }

    buildSmartPrompt(query) {
        return `Anda adalah AI Assistant Gym, Fitness, dan Kesehatan profesional. User bertanya: "${query}"

PERAN ANDA:
Anda adalah personal trainer dan nutritionist ahli dengan 10+ tahun pengalaman.

INSTRUKSI DETAIL:
1. ANALISIS pertanyaan mendalam - bisa tentang:
   - Teknik gerakan olahraga (form, postur, kesalahan umum)
   - Program latihan (bulking, cutting, strength, hypertrophy)
   - Nutrisi dan diet (protein, karbohidrat, lemak, suplementasi)
   - Recovery (istirahat, sleep, stretching, mobility)
   - Injury prevention dan rehabilitasi
   - Psychology fitness (motivasi, konsistensi, mindset)
   - Equipment usage (cara pakai alat gym yang benar)

2. Jika ada KESALAHAN TULIS, koreksi dengan sopan dan berikan jawaban yang dimaksud

3. Berikan informasi yang:
   - AKURAT secara ilmiah
   - PRAKTIS untuk diterapkan
   - AMAN untuk semua level
   - DETAIL dengan contoh konkret

FORMAT RESPONS WAJIB:
JUDUL: [Judul spesifik dan menarik]
DESKRIPSI: [Penjelasan singkat 1-2 kalimat]
LEVEL: [Beginner/Intermediate/Advanced/All Levels]
DURASI: [Waktu yang dibutuhkan]
PERALATAN: [Equipment needed]
PENJELASAN_LENGKAP: [Detail teknis dan scientific explanation]
LANGKAH_LANGKAH: [Step-by-step instructions if applicable]
TIPS_AHLI: [Professional tips and tricks]
HAL_DIWAASPADAI: [Common mistakes and safety warnings]
NUTRISI_PENDUKUNG: [Nutrition advice if relevant]

CONTOH FORMAT BAIK:
JUDUL: Master the Perfect Squat
DESKRIPSI: Teknik squat yang benar untuk membangun kekuatan kaki dan mencegah cedera
LEVEL: All Levels
DURASI: 10-15 menit
PERALATAN: Barbell, rack (optional: bodyweight)
PENJELASAN_LENGKAP: Squat adalah compound exercise yang melatih quadriceps, hamstrings, glutes, dan core...
LANGKAH_LANGKAH: 1. Berdiri dengan kaki selebar bahu... 2. Jaga dada tegak... 
TIPS_AHLI: - Fokus pada depth yang aman - Kontrol gerakan turun - Drive melalui heels
HAL_DIWAASPADAI: Jangan round back, jaga knee alignment
NUTRISI_PENDUKUNG: Konsumsi protein 2 jam sebelum latihan untuk energi

JAWAB DALAM BAHASA INDONESIA YANG MUDAH DIPAHAMI.`;
    }

    parseAIResponse(aiText) {
        const result = {
            title: '',
            description: '',
            level: '',
            duration: '',
            equipment: '',
            detailedExplanation: '',
            steps: [],
            tips: [],
            warnings: [],
            nutrition: '',
            rawResponse: aiText
        };

        const lines = aiText.split('\n');
        let currentSection = '';

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            // Section detection
            if (line.startsWith('JUDUL:')) {
                result.title = line.replace('JUDUL:', '').trim();
                currentSection = 'title';
            } else if (line.startsWith('DESKRIPSI:')) {
                result.description = line.replace('DESKRIPSI:', '').trim();
                currentSection = 'description';
            } else if (line.startsWith('LEVEL:')) {
                result.level = line.replace('LEVEL:', '').trim();
                currentSection = 'level';
            } else if (line.startsWith('DURASI:')) {
                result.duration = line.replace('DURASI:', '').trim();
                currentSection = 'duration';
            } else if (line.startsWith('PERALATAN:')) {
                result.equipment = line.replace('PERALATAN:', '').trim();
                currentSection = 'equipment';
            } else if (line.startsWith('PENJELASAN_LENGKAP:')) {
                result.detailedExplanation = line.replace('PENJELASAN_LENGKAP:', '').trim();
                currentSection = 'detailedExplanation';
            } else if (line.startsWith('LANGKAH_LANGKAH:')) {
                currentSection = 'steps';
            } else if (line.startsWith('TIPS_AHLI:')) {
                currentSection = 'tips';
            } else if (line.startsWith('HAL_DIWAASPADAI:')) {
                currentSection = 'warnings';
            } else if (line.startsWith('NUTRISI_PENDUKUNG:')) {
                result.nutrition = line.replace('NUTRISI_PENDUKUNG:', '').trim();
                currentSection = 'nutrition';
            } else {
                // Content parsing for each section
                switch (currentSection) {
                    case 'steps':
                        if (line.match(/^\d+\./) || line.match(/^[-•]/)) {
                            const cleanStep = line.replace(/^(\d+\.|[-•])\s*/, '').trim();
                            if (cleanStep) result.steps.push(cleanStep);
                        }
                        break;
                    case 'tips':
                        if (line.match(/^[-•]/) || line.match(/^\d+\./)) {
                            const cleanTip = line.replace(/^(\d+\.|[-•])\s*/, '').trim();
                            if (cleanTip) result.tips.push(cleanTip);
                        }
                        break;
                    case 'warnings':
                        if (line.match(/^[-•]/)) {
                            const cleanWarning = line.replace(/^[-•]\s*/, '').trim();
                            if (cleanWarning) result.warnings.push(cleanWarning);
                        }
                        break;
                    case 'detailedExplanation':
                        if (!result.detailedExplanation) {
                            result.detailedExplanation = line;
                        } else {
                            result.detailedExplanation += ' ' + line;
                        }
                        break;
                }
            }
        });

        // Fallback parsing jika format tidak perfect
        this.applyFallbackParsing(result, aiText);
        
        return result;
    }

    applyFallbackParsing(result, aiText) {
        if (!result.title) {
            const firstLine = aiText.split('\n')[0];
            result.title = firstLine.length > 60 ? "Panduan Fitness" : firstLine;
        }

        if (!result.description && result.detailedExplanation) {
            result.description = result.detailedExplanation.split('.')[0] + '.';
        }

        if (!result.detailedExplanation) {
            result.detailedExplanation = aiText;
        }

        // Auto-extract steps from text
        if (result.steps.length === 0) {
            const stepMatches = aiText.match(/\d+\.\s*[^\d]+?(?=\n\d+\.|\n[A-Z_]+:|\n*$)/g);
            if (stepMatches) {
                result.steps = stepMatches.map(step => step.replace(/^\d+\.\s*/, '').trim());
            }
        }
    }

    async testConnection() {
        try {
            const testResponse = await this.searchWithAI("Hello, test connection");
            this.isOnline = true;
            return true;
        } catch (error) {
            this.isOnline = false;
            return false;
        }
    }
}

// Enhanced fallback database
const enhancedFallbackDB = {
    'squat': {
        title: "🏋️ Master the Perfect Squat",
        description: "Teknik squat yang benar untuk membangun kekuatan kaki dan mencegah cedera",
        level: "All Levels",
        duration: "10-15 menit",
        equipment: "Barbell, Squat Rack (optional: bodyweight)",
        detailedExplanation: "Squat adalah compound exercise fundamental yang melatih quadriceps, hamstrings, glutes, core, dan lower back. Gerakan ini meningkatkan kekuatan fungsional, mobilitas, dan metabolisme.",
        steps: [
            "Berdiri dengan kaki selebar bahu, toes slightly pointed out",
            "Tegakkan punggung, tarik bahu ke belakang, dada membusung",
            "Turunkan tubuh dengan mendorong pinggul ke belakang seperti mau duduk",
            "Jaga lutut sejajar dengan jari kaki, jangan melebihi ujung kaki",
            "Turun hingga paha parallel dengan lantai (atau lebih rendah jika fleksibel)",
            "Jaga berat badan di tumit, bukan jari kaki",
            "Dorong melalui tumit untuk kembali ke posisi awal",
            "Kencangkan glutes di puncak gerakan"
        ],
        tips: [
            "Lakukan pemanasan dynamic stretching sebelum squat",
            "Start dengan bodyweight untuk master form dulu",
            "Gunakan mirror untuk check form alignment",
            "Kontrol gerakan turun, explosive naik",
            "Bernapas dalam saat turun, hembuskan saat naik"
        ],
        warnings: [
            "JANGAN bulatkan punggung (keep neutral spine)",
            "Jangan biarkan lutut collapse inward",
            "Hentikan jika merasa sharp pain di knee atau back",
            "Jangan bounce di bagian bawah gerakan"
        ],
        nutrition: "Konsumsi 20-30g protein 1-2 jam sebelum latihan, dan carbs kompleks untuk energy"
    },

    'bench press': {
        title: "💪 Bench Press Mastery",
        description: "Teknik bench press yang aman dan efektif untuk chest development",
        level: "Beginner to Advanced",
        duration: "8-12 menit",
        equipment: "Bench, Barbell, Weight plates",
        detailedExplanation: "Bench press adalah upper body compound exercise utama untuk developing chest, shoulders, dan triceps. Penting untuk mastering form yang benar sebelum menambah berat.",
        steps: [
            "Lie flat on bench dengan feet firmly on floor",
            "Grip bar slightly wider than shoulder width",
            "Unrack bar dan posisikan di atas chest",
            "Lower bar dengan kontrol ke mid-chest",
            "Keep elbows at 45-60 degree angle dari body",
            "Touch bar lightly ke chest (don't bounce)",
            "Press bar back to starting position dengan power",
            "Don't lock elbows completely di top position"
        ],
        tips: [
            "Keep shoulder blades retracted throughout",
            "Maintain slight arch in lower back",
            "Use spotter ketika lifting heavy",
            "Focus on mind-muscle connection dengan chest",
            "Control negative (eccentric) portion"
        ],
        warnings: [
            "JANGAN bounce bar off chest",
            "Jangan flare elbows terlalu lebar (90 degrees)",
            "Always use safety pins atau spotter",
            "Jangan ego lifting - focus on form bukan weight"
        ],
        nutrition: "Pre-workout: carbs + protein, Post-workout: 30g protein dalam 1 jam"
    },

    'deadlift': {
        title: "🔥 Deadlift Fundamentals",
        description: "Learn proper deadlift form untuk full-body strength development",
        level: "Intermediate",
        duration: "12-15 menit",
        equipment: "Barbell, Weight plates",
        detailedExplanation: "Deadlift adalah king of compound exercises, melatih hamstrings, glutes, back, core, grips, dan overall posterior chain. Essential untuk functional strength.",
        steps: [
            "Stand with barbell over mid-foot, feet hip-width",
            "Bend hips and knees, grip bar just outside legs",
            "Keep back straight, chest up, shoulders back",
            "Take slack out of bar sebelum lifting",
            "Lift bar by extending hips and knees simultaneously",
            "Keep bar close to body throughout movement",
            "Stand up straight, squeeze glutes at top",
            "Lower bar dengan kontrol mengikuti same path"
        ],
        tips: [
            "Practice dengan light weight untuk master form",
            "Use mixed grip atau hook grip untuk heavy weights",
            "Engage lats sebelum lifting (pull shoulders back)",
            "Drive through heels, bukan balls of feet",
            "Keep neck in neutral position"
        ],
        warnings: [
            "JANGAN round back selama lift",
            "Jangan jerk the bar - smooth controlled movement",
            "Hentikan jika merasa back pain",
            "Always warm up properly sebelum deadlifting"
        ],
        nutrition: "High protein intake, adequate carbs untuk energy, stay hydrated"
    },

    'nutrition': {
        title: "🍎 Fitness Nutrition Guide",
        description: "Panduan nutrisi lengkap untuk muscle gain, fat loss, dan performance",
        level: "All Levels",
        duration: "Ongoing",
        equipment: "Food scale (optional), Meal prep containers",
        detailedExplanation: "Nutrition adalah 70% dari hasil fitness. Understanding macronutrients, timing, dan quality foods adalah kunci untuk mencapai goals apapun.",
        steps: [
            "Calculate daily calorie needs berdasarkan TDEE",
            "Set protein intake: 1.6-2.2g per kg body weight",
            "Include complex carbs: 3-5g per kg untuk energy",
            "Add healthy fats: 0.8-1.2g per kg untuk hormones",
            "Drink 3-4 liters water daily untuk hydration",
            "Eat 4-6 meals spread throughout day",
            "Include vegetables dengan setiap meal",
            "Time carbs around workouts untuk performance"
        ],
        tips: [
            "Meal prep di weekend untuk consistency",
            "Eat protein setiap 3-4 hours untuk muscle synthesis",
            "Don't fear carbs - mereka fuel workouts",
            "Include variety of colorful vegetables",
            "Listen to body's hunger dan fullness cues"
        ],
        warnings: [
            "Jangan extreme calorie cutting",
            "Avoid processed foods dan added sugars",
            "Don't eliminate entire food groups",
            "Jangan skip post-workout nutrition window"
        ],
        nutrition: "Focus on whole foods: lean proteins, complex carbs, healthy fats, plenty vegetables"
    },

    'beginner': {
        title: "🚀 Beginner Fitness Program",
        description: "3-day full body program untuk building foundation yang kuat",
        level: "Beginner",
        duration: "8-12 weeks",
        equipment: "Basic gym equipment atau bodyweight",
        detailedExplanation: "Program ini designed untuk pemula membangun fundamental strength, learning proper form, dan establishing consistent routine. Focus pada compound movements.",
        steps: [
            "DAY 1: Squat 3x8, Bench Press 3x8, Rows 3x10",
            "DAY 2: Rest atau light cardio 20-30min",
            "DAY 3: Deadlift 3x5, Overhead Press 3x8, Pull-ups 3xMax",
            "DAY 4: Rest",
            "DAY 5: Leg Press 3x10, Incline Press 3x8, Lat Pulldown 3x10",
            "DAY 6-7: Active recovery (walking, stretching)"
        ],
        tips: [
            "Focus on form bukan weight di 4 weeks pertama",
            "Increase weight gradually each week (progressive overload)",
            "Get 7-8 hours quality sleep setiap malam",
            "Stay consistent - don't skip workouts",
            "Track progress dalam workout journal"
        ],
        warnings: [
            "Jangan jump into advanced programs terlalu cepat",
            "Listen to body - rest jika sakit atau fatigued",
            "Don't compare progress dengan others",
            "Jangan skip warm-up dan cool-down"
        ],
        nutrition: "Eat at maintenance calories, focus on protein intake, stay consistent dengan meal timing"
    },

    'cardio': {
        title: "🏃‍♂️ Smart Cardio Training",
        description: "Effective cardio programming untuk fat loss dan cardiovascular health",
        level: "All Levels",
        duration: "20-45 minutes",
        equipment: "Treadmill, Bike, Elliptical, atau Outdoor space",
        detailedExplanation: "Cardio improves heart health, endurance, fat burning, dan recovery. Combining different cardio modalities memberikan maximum benefits.",
        steps: [
            "LISS (Low Intensity Steady State): 30-45min at 60-70% max heart rate",
            "HIIT (High Intensity Interval Training): 20-30min dengan work:rest ratios",
            "Moderate Intensity: 25-35min at 70-80% max heart rate",
            "Include variety: running, cycling, swimming, rowing",
            "Progress gradually intensity dan duration"
        ],
        tips: [
            "Do cardio pada separate days dari strength training",
            "Atau lakukan cardio setelah weights session",
            "Use heart rate monitor untuk track intensity",
            "Stay hydrated selama cardio sessions",
            "Combine different cardio types untuk prevent boredom"
        ],
        warnings: [
            "Jangan overdo cardio jika goal adalah muscle building",
            "Don't do HIIT setiap day - allow recovery",
            "Listen to joints - stop jika pain terjadi",
            "Jangan skip warm-up sebelum intense cardio"
        ],
        nutrition: "Time carbs sebelum cardio untuk energy, protein setelah untuk recovery"
    },

    'pull up': {
        title: "💪 Pull-up Progression",
        description: "Master bodyweight pulling strength dengan pull-up progression",
        level: "Beginner to Advanced",
        duration: "10-15 minutes",
        equipment: "Pull-up bar, Resistance bands (optional)",
        detailedExplanation: "Pull-ups adalah fundamental upper body strength exercise untuk back, biceps, dan core. Most people need progression plan untuk achieve first pull-up.",
        steps: [
            "Start dengan dead hangs untuk grip strength",
            "Progress ke scapular pulls untuk back activation",
            "Use resistance bands untuk assisted pull-ups",
            "Practice negative pull-ups (jump up, slow lower down)",
            "Do flexed arm hangs di top position",
            "Attempt full pull-ups dengan spot assistance",
            "Gradually reduce band assistance overtime"
        ],
        tips: [
            "Train pull-ups 2-3x per week untuk best progress",
            "Focus on full range of motion",
            "Engage core dan legs untuk stability",
            "Use varied grips: pronated, supinated, neutral",
            "Be patient - progress takes time"
        ],
        warnings: [
            "Jangan kipping pull-ups sampai strict form mastered",
            "Don't overgrip - dapat cause elbow pain",
            "Hentikan jika shoulder pain terjadi",
            "Jangan sacrifice form untuk repetitions"
        ],
        nutrition: "Adequate protein untuk muscle recovery dan growth"
    }
};

const gymAI = new AdvancedGymAI();

// Enhanced initialization dengan AI connection test
async function init() {
    // Show loading screen
    setTimeout(async () => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'block';
            initializeApp();
        }, 500);
    }, 2500);
    
    // Setup event listeners
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

async function initializeApp() {
    // Test AI connection
    const aiConnected = await gymAI.testConnection();
    updateAIStatus(aiConnected);
    
    loadWorkoutData();
    renderWorkoutDays();
    updateCurrentDay();
    updateLastUpdateTime();
}

function updateAIStatus(isConnected) {
    gymAI.isOnline = isConnected;
    if (isConnected) {
        aiStatusEl.innerHTML = '<i class="fas fa-circle"></i> AI Connected';
        aiStatusEl.style.background = 'var(--success)';
    } else {
        aiStatusEl.innerHTML = '<i class="fas fa-circle"></i> AI Offline';
        aiStatusEl.style.background = 'var(--warning)';
        showNotification('AI menggunakan data lokal', 'warning');
    }
}

// [REST OF THE FUNCTIONS REMAIN THE SAME AS BEFORE...]
// loadWorkoutData(), saveWorkoutData(), renderWorkoutDays(), etc.

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
            <p>${gymAI.isOnline ? 'AI sedang menganalisis...' : 'Mengambil data lokal...'}</p>
        </div>
    `;
    searchResults.style.display = 'block';
    
    try {
        let result;
        if (gymAI.isOnline) {
            const aiResponse = await gymAI.searchWithAI(query);
            result = gymAI.parseAIResponse(aiResponse);
        } else {
            result = getEnhancedFallbackResponse(query);
        }
        displayAIResult(result, query);
        
    } catch (error) {
        console.error('Search failed:', error);
        const fallbackResult = getEnhancedFallbackResponse(query);
        displayAIResult(fallbackResult, query);
        showNotification('Menggunakan database lokal', 'warning');
    }
}

function getEnhancedFallbackResponse(query) {
    const normalizedQuery = query.toLowerCase();
    
    // Smart keyword matching
    const keywordMap = {
        'squat': 'squat',
        'bench': 'bench press',
        'press': 'bench press',
        'deadlift': 'deadlift',
        'pull': 'pull up',
        'chin': 'pull up',
        'nutrition': 'nutrition',
        'diet': 'nutrition',
        'food': 'nutrition',
        'eat': 'nutrition',
        'beginner': 'beginner',
        'start': 'beginner',
        'program': 'beginner',
        'routine': 'beginner',
        'cardio': 'cardio',
        'run': 'cardio',
        'hiit': 'cardio'
    };
    
    for (const [keyword, responseKey] of Object.entries(keywordMap)) {
        if (normalizedQuery.includes(keyword)) {
            return enhancedFallbackDB[responseKey];
        }
    }
    
    // Default comprehensive response
    return {
        title: "💡 Ultimate Fitness Guide",
        description: "Prinsip dasar fitness untuk hasil maksimal",
        level: "All Levels",
        duration: "Ongoing",
        equipment: "Various",
        detailedExplanation: "Konsistensi adalah kunci sukses fitness. Kombinasikan latihan strength yang teratur, nutrisi tepat, recovery adequate, dan patience untuk hasil terbaik.",
        steps: [
            "Latihan strength 3-5x seminggu dengan progressive overload",
            "Konsumsi protein adequate (1.6-2.2g/kg) untuk muscle repair",
            "Include complex carbs untuk workout energy",
            "Healthy fats untuk hormone production",
            "Stay hydrated - 3-4L water daily",
            "Sleep 7-9 hours untuk recovery",
            "Active recovery pada rest days",
            "Track progress dan celebrate improvements"
        ],
        tips: [
            "Focus pada consistency bukan perfection",
            "Compound exercises untuk efficiency maksimal",
            "Mind-muscle connection selama latihan",
            "Variety dalam program untuk avoid plateau",
            "Listen to body - rest ketika needed",
            "Set realistic goals dan timelines"
        ],
        warnings: [
            "Jangan ego lifting - prioritize form over weight",
            "Avoid extreme diets atau overtraining",
            "Don't compare progress dengan others",
            "Consult professional jika ada health concerns"
        ],
        nutrition: "Whole foods approach: lean proteins, complex carbs, healthy fats, vegetables, adequate hydration"
    };
}

function displayAIResult(result, originalQuery) {
    let stepsHtml = '';
    if (result.steps && result.steps.length > 0) {
        stepsHtml = `
            <div class="exercise-steps">
                <h4>📋 Step-by-Step Instructions:</h4>
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
                <h4>💡 Expert Tips:</h4>
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
                <h4>⚠️ Important Warnings:</h4>
                <ul>
                    ${result.warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    let nutritionHtml = '';
    if (result.nutrition) {
        nutritionHtml = `
            <div class="tips-section" style="background: rgba(34, 197, 94, 0.1); border-left-color: var(--success);">
                <h4>🍎 Nutrition Advice:</h4>
                <p>${result.nutrition}</p>
            </div>
        `;
    }

    // Meta information
    const metaItems = [];
    if (result.level) metaItems.push(`<div class="meta-item"><strong>Level:</strong> ${result.level}</div>`);
    if (result.duration) metaItems.push(`<div class="meta-item"><strong>Duration:</strong> ${result.duration}</div>`);
    if (result.equipment) metaItems.push(`<div class="meta-item"><strong>Equipment:</strong> ${result.equipment}</div>`);

    const metaHtml = metaItems.length > 0 ? `
        <div class="exercise-meta">
            ${metaItems.join('')}
        </div>
    ` : '';
    
    searchResults.innerHTML = `
        <div class="ai-result">
            <div class="ai-header">
                <h3>${result.title}</h3>
                <span class="ai-badge">${gymAI.isOnline ? 'AI Coach' : 'Local Expert'}</span>
            </div>
            
            ${result.description ? `<p class="ai-description">${result.description}</p>` : ''}
            
            ${metaHtml}
            
            ${result.detailedExplanation ? `
                <div class="detailed-explanation">
                    <h4>🎯 Detailed Explanation:</h4>
                    <p>${result.detailedExplanation}</p>
                </div>
            ` : ''}
            
            ${stepsHtml}
            ${tipsHtml}
            ${warningsHtml}
            ${nutritionHtml}
            
            <div class="ai-source">
                <small>${gymAI.isOnline ? 'Generated by AI Fitness Coach' : 'From local expert database'} • Query: "${originalQuery}"</small>
            </div>
        </div>
    `;
}

// [REMAINING FUNCTIONS - updateCurrentDay, updateLastUpdateTime, updateRealTimeData, showNotification]

// Initialize the app
init();