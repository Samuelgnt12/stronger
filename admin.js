let workoutSchedule = {};
let stats = {
    totalUsers: 0,
    activeWorkouts: 0,
    totalExercises: 0,
    lastUpdated: null
};

const dayTabs = document.querySelectorAll('.day-tab');
const dayContents = document.getElementById('dayContents');
const notification = document.getElementById('notification');
const totalExercisesEl = document.getElementById('totalExercises');
const totalUsersEl = document.getElementById('totalUsers');
const activeWorkoutsEl = document.getElementById('activeWorkouts');
const resetScheduleBtn = document.getElementById('resetScheduleBtn');
const publishChangesBtn = document.getElementById('publishChangesBtn');
const backupDataBtn = document.getElementById('backupDataBtn');

function init() {
    loadWorkoutData();
    renderDayContents();
    setupEventListeners();
    updateStats();
    startRealTimeUpdates();
}

function loadWorkoutData() {
    const savedData = localStorage.getItem('gymWorkoutSchedule');
    if (savedData) {
        workoutSchedule = JSON.parse(savedData);
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
    stats.lastUpdated = new Date().toISOString();
    updateStats();
    broadcastUpdate();
}

function broadcastUpdate() {
    // Simulate broadcasting to users
    const event = new Event('workoutScheduleUpdated');
    window.dispatchEvent(event);
}

function renderDayContents() {
    dayContents.innerHTML = '';
    
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
    
    days.forEach(day => {
        const dayData = workoutSchedule[day] || { muscleGroup: '', exercises: [] };
        const dayContent = document.createElement('div');
        dayContent.className = `day-content ${day === 'senin' ? 'active' : ''}`;
        dayContent.id = `${day}Content`;
        
        let exercisesHtml = '';
        if (dayData.exercises && dayData.exercises.length > 0) {
            dayData.exercises.forEach((exercise, index) => {
                exercisesHtml += `
                    <div class="exercise-item">
                        <div class="exercise-info">
                            <h4>${exercise.name}</h4>
                            <p>${exercise.sets} set x ${exercise.reps} repetisi</p>
                        </div>
                        <div class="exercise-actions">
                            <button class="btn btn-danger delete-exercise" data-day="${day}" data-index="${index}">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        dayContent.innerHTML = `
            <div class="form-group">
                <label for="${day}MuscleGroup">Kelompok Otot Target</label>
                <input type="text" id="${day}MuscleGroup" value="${dayData.muscleGroup}" placeholder="Contoh: Chest & Triceps">
            </div>
            
            <div class="exercises-list">
                <h3>Daftar Latihan</h3>
                ${exercisesHtml || '<p style="color: #aaa; font-style: italic;">Belum ada latihan</p>'}
            </div>
            
            <div class="add-exercise-form">
                <h3>Tambah Latihan Baru</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="${day}ExerciseName">Nama Latihan</label>
                        <input type="text" id="${day}ExerciseName" placeholder="Contoh: Bench Press">
                    </div>
                    <div class="form-group">
                        <label for="${day}ExerciseSets">Set</label>
                        <input type="number" id="${day}ExerciseSets" placeholder="4" min="1" max="10">
                    </div>
                    <div class="form-group">
                        <label for="${day}ExerciseReps">Reps</label>
                        <input type="text" id="${day}ExerciseReps" placeholder="8-12">
                    </div>
                    <div class="form-group">
                        <button class="btn btn-success add-exercise-btn" data-day="${day}" style="height: 42px; margin-top: 24px;">
                            <i class="fas fa-plus"></i> Tambah
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        dayContents.appendChild(dayContent);
    });
    
    document.querySelectorAll('.add-exercise-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const day = e.target.dataset.day;
            addExercise(day);
        });
    });
    
    document.querySelectorAll('.delete-exercise').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const day = e.target.closest('.delete-exercise').dataset.day;
            const index = parseInt(e.target.closest('.delete-exercise').dataset.index);
            deleteExercise(day, index);
        });
    });
    
    document.querySelectorAll('input[id$="MuscleGroup"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const day = e.target.id.replace('MuscleGroup', '');
            updateMuscleGroup(day, e.target.value);
        });
    });
}

function setupEventListeners() {
    dayTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const day = tab.dataset.day;
            
            dayTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.day-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${day}Content`).classList.add('active');
        });
    });
    
    resetScheduleBtn.addEventListener('click', resetSchedule);
    publishChangesBtn.addEventListener('click', publishChanges);
    backupDataBtn.addEventListener('click', backupData);
}

function addExercise(day) {
    const nameInput = document.getElementById(`${day}ExerciseName`);
    const setsInput = document.getElementById(`${day}ExerciseSets`);
    const repsInput = document.getElementById(`${day}ExerciseReps`);
    
    const name = nameInput.value.trim();
    const sets = parseInt(setsInput.value);
    const reps = repsInput.value.trim();
    
    if (!name || !sets || !reps) {
        showNotification('Harap isi semua field!', 'error');
        return;
    }
    
    if (!workoutSchedule[day]) {
        workoutSchedule[day] = { muscleGroup: '', exercises: [] };
    }
    
    workoutSchedule[day].exercises.push({
        name,
        sets,
        reps
    });
    
    saveWorkoutData();
    renderDayContents();
    updateStats();
    
    nameInput.value = '';
    setsInput.value = '';
    repsInput.value = '';
    
    showNotification('Latihan berhasil ditambahkan!', 'success');
}

function deleteExercise(day, index) {
    if (confirm('Apakah Anda yakin ingin menghapus latihan ini?')) {
        workoutSchedule[day].exercises.splice(index, 1);
        saveWorkoutData();
        renderDayContents();
        updateStats();
        showNotification('Latihan berhasil dihapus!', 'success');
    }
}

function updateMuscleGroup(day, muscleGroup) {
    if (!workoutSchedule[day]) {
        workoutSchedule[day] = { muscleGroup: '', exercises: [] };
    }
    
    workoutSchedule[day].muscleGroup = muscleGroup;
    saveWorkoutData();
    showNotification('Kelompok otot berhasil diperbarui!', 'success');
}

function resetSchedule() {
    if (confirm('Apakah Anda yakin ingin mereset seluruh jadwal? Tindakan ini tidak dapat dibatalkan.')) {
        workoutSchedule = {
            senin: { muscleGroup: '', exercises: [] },
            selasa: { muscleGroup: '', exercises: [] },
            rabu: { muscleGroup: '', exercises: [] },
            kamis: { muscleGroup: '', exercises: [] },
            jumat: { muscleGroup: '', exercises: [] }
        };
        saveWorkoutData();
        renderDayContents();
        updateStats();
        showNotification('Jadwal berhasil direset!', 'success');
    }
}

function publishChanges() {
    saveWorkoutData();
    showNotification('Perubahan berhasil dipublikasikan ke semua user!', 'success');
}

function backupData() {
    const dataStr = JSON.stringify(workoutSchedule, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-workout-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Backup data berhasil diunduh!', 'success');
}

function updateStats() {
    let totalExercises = 0;
    let activeWorkouts = 0;
    
    for (const day in workoutSchedule) {
        const exercises = workoutSchedule[day].exercises || [];
        totalExercises += exercises.length;
        if (exercises.length > 0) {
            activeWorkouts++;
        }
    }
    
    // Simulate user growth
    const baseUsers = 85;
    const randomGrowth = Math.floor(Math.random() * 5);
    stats.totalUsers = baseUsers + randomGrowth;
    stats.totalExercises = totalExercises;
    stats.activeWorkouts = activeWorkouts;
    
    totalExercisesEl.textContent = stats.totalExercises;
    totalUsersEl.textContent = stats.totalUsers;
    activeWorkoutsEl.textContent = stats.activeWorkouts;
}

function startRealTimeUpdates() {
    // Update stats every 10 seconds
    setInterval(() => {
        updateStats();
    }, 10000);
    
    // Check for external changes
    setInterval(() => {
        const savedData = localStorage.getItem('gymWorkoutSchedule');
        if (savedData) {
            const newSchedule = JSON.parse(savedData);
            if (JSON.stringify(newSchedule) !== JSON.stringify(workoutSchedule)) {
                workoutSchedule = newSchedule;
                renderDayContents();
                updateStats();
                showNotification('Data diperbarui secara real-time!', 'success');
            }
        }
    }, 5000);
}

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

init();