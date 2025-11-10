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

// Simple AI Class dengan fallback yang kuat
class SimpleGymAI {
    constructor() {
        this.isOnline = true;
    }

    async searchWithAI(query) {
        // Coba direct API call dulu
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are a fitness expert. Answer this question in Indonesian: ${query}. Keep response under 300 characters.`
                            }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 150,
                            temperature: 0.7
                        }
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                this.isOnline = true;
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('API response not OK');
            }
        } catch (error) {
            console.log('AI API failed, using fallback:', error);
            this.isOnline = false;
            return this.getFallbackResponse(query);
        }
    }

    getFallbackResponse(query) {
        const lowerQuery = query.toLowerCase();
        
        // Smart fallback responses
        if (lowerQuery.includes('squat')) {
            return "Squat: Berdiri kaki selebar bahu, turunkan pinggul seperti mau duduk, jaga punggung lurus, turun hingga paha sejajar lantai, lalu berdiri kembali. Fokus pada bentuk yang benar.";
        } else if (lowerQuery.includes('bench') || lowerQuery.includes('press')) {
            return "Bench Press: Berbaring di bangku, pegang barbell selebar bahu, turunkan ke dada dengan kontrol, dorong kembali ke atas. Jaga siku 45 derajat dan bahu tetap di bangku.";
        } else if (lowerQuery.includes('deadlift')) {
            return "Deadlift: Berdiri dengan barbell di atas kaki, tekuk pinggul dan lutut, pegang barbell, angkat dengan meluruskan tubuh. JAGA PUNGGUNG LURUS! Mulai dengan berat ringan.";
        } else if (lowerQuery.includes('nutrisi') || lowerQuery.includes('makan')) {
            return "Nutrisi Fitness: Protein 1.6-2.2g per kg berat badan, karbohidrat kompleks untuk energi, lemak sehat, banyak air. Makan 4-6x sehari, protein 30 menit setelah latihan.";
        } else if (lowerQuery.includes('pemula') || lowerQuery.includes('beginner')) {
            return "Program Pemula: Latihan 3x seminggu (Senin-Rabu-Jumat). Squat, Bench Press, Deadlift, Pull-ups. 3 set x 8-12 repetisi. Fokus pada teknik, bukan berat.";
        } else if (lowerQuery.includes('cardio')) {
            return "Cardio: LISS 30-45 menit 3x seminggu atau HIIT 20-30 menit 2x seminggu. Lakukan setelah angkat beban atau di hari terpisah. Gunakan treadmill, sepeda, atau elliptical.";
        } else {
            return "Untuk hasil terbaik: Latihan konsisten 3-5x seminggu, nutrisi tepat (protein, karbo, lemak sehat), istirahat cukup 7-8 jam, dan tetap hidrasi. Konsistensi adalah kunci!";
        }
    }
}

const gymAI = new SimpleGymAI();

// Initialize app
function init() {
    // Quick load tanpa loading screen panjang
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'block';
            initializeApp();
        }, 300);
    }, 1500);
    
    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Example buttons
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const query = e.target.dataset.query;
            searchInput.value = query;
            performSearch();
        });
    });
}

function initializeApp() {
    loadWorkoutData();
    renderWorkoutDays();
    updateCurrentDay();
    updateLastUpdateTime();
    updateAIStatus();
}

function loadWorkoutData() {
    const savedData = localStorage.getItem('gymWorkoutSchedule');
    if (savedData) {
        workoutSchedule = JSON.parse(savedData);
        lastUpdateTime = localStorage.getItem('lastUpdateTime') || new Date().toISOString();
    } else {
        // Default data
        workoutSchedule = {
            monday: { muscleGroup: 'Chest & Triceps', exercises: [
                { name: 'Bench Press', sets: 4, reps: '8-12' },
                { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' }
            ] },
            tuesday: { muscleGroup: 'Back & Biceps', exercises: [
                { name: 'Deadlift', sets: 4, reps: '6-10' },
                { name: 'Lat Pulldown', sets: 3, reps: '10-12' }
            ] },
            wednesday: { muscleGroup: 'Legs', exercises: [
                { name: 'Squat', sets: 4, reps: '8-12' },
                { name: 'Leg Press', sets: 3, reps: '10-15' }
            ] },
            thursday: { muscleGroup: 'Shoulders', exercises: [
                { name: 'Overhead Press', sets: 4, reps: '8-12' },
                { name: 'Lateral Raise', sets: 3, reps: '12-15' }
            ] },
            friday: { muscleGroup: 'Full Body', exercises: [
                { name: 'Deadlift', sets: 3, reps: '6-8' },
                { name: 'Bench Press', sets: 3, reps: '8-10' }
            ] }
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
    if (!workoutDays) return;
    
    workoutDays.innerHTML = '';
    
    const days = {
        monday: 'Senin',
        tuesday: 'Selasa', 
        wednesday: 'Rabu',
        thursday: 'Kamis',
        friday: 'Jumat'
    };
    
    const today = new Date().getDay();
    const dayMap = [0, 1, 2, 3, 4, 5, 6]; // Minggu=0, Senin=1, etc.
    
    Object.entries(days).forEach(([key, dayName], index) => {
        const dayData = workoutSchedule[key];
        if (!dayData) return;
        
        const dayCard = document.createElement('div');
        dayCard.className = `day-card ${dayMap[today] === index + 1 ? 'today' : ''}`;
        
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
        
        const isToday = dayMap[today] === index + 1;
        dayCard.innerHTML = `
            <h3>${dayName} ${isToday ? '<span class="today-badge">Hari Ini</span>' : ''}</h3>
            <span class="muscle-group">${dayData.muscleGroup}</span>
            <div class="exercises-list">
                ${exercisesHtml || '<p style="color: #666; font-style: italic; padding: 1rem;">Tidak ada latihan</p>'}
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
            <p>${gymAI.isOnline ? 'AI sedang menganalisis...' : 'Mengambil data...'}</p>
        </div>
    `;
    searchResults.style.display = 'block';
    
    try {
        const aiResponse = await gymAI.searchWithAI(query);
        displayAIResult(aiResponse, query);
    } catch (error) {
        console.error('Search error:', error);
        displayAIResult("Maaf, terjadi error. Coba tanya tentang: squat, bench press, deadlift, nutrisi, atau program pemula.", query);
    }
}

function displayAIResult(result, query) {
    searchResults.innerHTML = `
        <div class="ai-result">
            <div class="ai-header">
                <h3>🤖 AI Fitness Coach</h3>
                <span class="ai-badge">${gymAI.isOnline ? 'Live' : 'Offline'}</span>
            </div>
            <div class="ai-description">
                <p><strong>Pertanyaan:</strong> "${query}"</p>
                <p><strong>Jawaban:</strong> ${result}</p>
            </div>
            <div class="ai-source">
                <small>${gymAI.isOnline ? 'Powered by AI' : 'Local expert knowledge'} • ${new Date().toLocaleTimeString('id-ID')}</small>
            </div>
        </div>
    `;
}

function updateAIStatus() {
    if (aiStatusEl) {
        aiStatusEl.innerHTML = gymAI.isOnline ? 
            '<i class="fas fa-circle"></i> AI Connected' : 
            '<i class="fas fa-circle"></i> AI Offline';
        aiStatusEl.style.background = gymAI.isOnline ? 'var(--success)' : 'var(--warning)';
    }
}

function updateCurrentDay() {
    if (currentDayEl) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = new Date();
        currentDayEl.textContent = days[today.getDay()];
    }
}

function updateLastUpdateTime() {
    if (lastUpdateEl && lastUpdateTime) {
        const updateDate = new Date(lastUpdateTime);
        lastUpdateEl.textContent = `Diperbarui: ${updateDate.toLocaleDateString('id-ID')} ${updateDate.toLocaleTimeString('id-ID')}`;
    }
}

function showNotification(message, type) {
    // Simple notification
    alert(`${type.toUpperCase()}: ${message}`);
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}