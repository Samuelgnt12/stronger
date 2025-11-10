// Admin Management System
let workoutSchedule = {};
let stats = {
    totalUsers: 0,
    activeWorkouts: 0,
    totalExercises: 0,
    lastUpdated: null
};

// DOM Elements
const dayTabs = document.querySelectorAll('.day-tab');
const dayContents = document.getElementById('dayContents');
const notification = document.getElementById('notification');
const totalExercisesEl = document.getElementById('totalExercises');
const totalUsersEl = document.getElementById('totalUsers');
const activeWorkoutsEl = document.getElementById('activeWorkouts');
const resetScheduleBtn = document.getElementById('resetScheduleBtn');
const publishChangesBtn = document.getElementById('publishChangesBtn');
const backupDataBtn = document.getElementById('backupDataBtn');

// Initialize Admin Panel
function initAdmin() {
    loadWorkoutData();
    renderDayContents();
    setupEventListeners();
    updateStats();
    startRealTimeUpdates();
    
    showNotification('Admin panel loaded successfully!', 'success');
}

// Load workout data from localStorage
function loadWorkoutData() {
    try {
        const savedData = localStorage.getItem('gymWorkoutSchedule');
        if (savedData) {
            workoutSchedule = JSON.parse(savedData);
        } else {
            // Default workout schedule
            workoutSchedule = {
                monday: { 
                    muscleGroup: 'Chest & Triceps', 
                    exercises: [
                        { name: 'Bench Press', sets: 4, reps: '8-12' },
                        { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
                        { name: 'Triceps Pushdown', sets: 3, reps: '12-15' }
                    ] 
                },
                tuesday: { 
                    muscleGroup: 'Back & Biceps', 
                    exercises: [
                        { name: 'Deadlift', sets: 4, reps: '6-10' },
                        { name: 'Lat Pulldown', sets: 3, reps: '10-12' },
                        { name: 'Barbell Curl', sets: 3, reps: '8-12' }
                    ] 
                },
                wednesday: { 
                    muscleGroup: 'Legs', 
                    exercises: [
                        { name: 'Squat', sets: 4, reps: '8-12' },
                        { name: 'Leg Press', sets: 3, reps: '10-15' },
                        { name: 'Leg Extension', sets: 3, reps: '12-15' }
                    ] 
                },
                thursday: { 
                    muscleGroup: 'Shoulders', 
                    exercises: [
                        { name: 'Overhead Press', sets: 4, reps: '8-12' },
                        { name: 'Lateral Raise', sets: 3, reps: '12-15' },
                        { name: 'Front Raise', sets: 3, reps: '12-15' }
                    ] 
                },
                friday: { 
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
    } catch (error) {
        console.error('Error loading workout data:', error);
        showNotification('Error loading data. Using default schedule.', 'error');
    }
}

// Save workout data to localStorage
function saveWorkoutData() {
    try {
        localStorage.setItem('gymWorkoutSchedule', JSON.stringify(workoutSchedule));
        stats.lastUpdated = new Date().toISOString();
        updateStats();
        broadcastUpdate();
    } catch (error) {
        console.error('Error saving workout data:', error);
        showNotification('Error saving data!', 'error');
    }
}

// Broadcast updates to user site
function broadcastUpdate() {
    // This would typically send to a server, but for demo we'll use localStorage as signal
    localStorage.setItem('lastAdminUpdate', new Date().toISOString());
}

// Render day contents
function renderDayContents() {
    dayContents.innerHTML = '';
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    days.forEach(day => {
        const dayData = workoutSchedule[day] || { muscleGroup: '', exercises: [] };
        const dayContent = document.createElement('div');
        dayContent.className = `day-content ${day === 'monday' ? 'active' : ''}`;
        dayContent.id = `${day}Content`;
        
        let exercisesHtml = '';
        if (dayData.exercises && dayData.exercises.length > 0) {
            dayData.exercises.forEach((exercise, index) => {
                exercisesHtml += `
                    <div class="exercise-item">
                        <div class="exercise-info">
                            <h4>${exercise.name}</h4>
                            <p>${exercise.sets} sets x ${exercise.reps} reps</p>
                        </div>
                        <div class="exercise-actions">
                            <button class="btn btn-danger delete-exercise" data-day="${day}" data-index="${index}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        dayContent.innerHTML = `
            <div class="form-group">
                <label for="${day}MuscleGroup">Target Muscle Group</label>
                <input type="text" id="${day}MuscleGroup" value="${dayData.muscleGroup}" placeholder="Example: Chest & Triceps">
            </div>
            
            <div class="exercises-list">
                <h3><i class="fas fa-dumbbell"></i> Exercise List</h3>
                ${exercisesHtml || '<p style="color: #aaa; font-style: italic; padding: 1rem;">No exercises added yet</p>'}
            </div>
            
            <div class="add-exercise-form">
                <h3><i class="fas fa-plus-circle"></i> Add New Exercise</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="${day}ExerciseName">Exercise Name</label>
                        <input type="text" id="${day}ExerciseName" placeholder="Example: Bench Press">
                    </div>
                    <div class="form-group">
                        <label for="${day}ExerciseSets">Sets</label>
                        <input type="number" id="${day}ExerciseSets" placeholder="4" min="1" max="10" value="3">
                    </div>
                    <div class="form-group">
                        <label for="${day}ExerciseReps">Reps</label>
                        <input type="text" id="${day}ExerciseReps" placeholder="8-12" value="8-12">
                    </div>
                    <div class="form-group">
                        <button class="btn btn-success add-exercise-btn" data-day="${day}">
                            <i class="fas fa-plus"></i> Add Exercise
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        dayContents.appendChild(dayContent);
    });
    
    // Add event listeners to exercise buttons
    attachExerciseEventListeners();
}

// Attach event listeners to exercise elements
function attachExerciseEventListeners() {
    // Add exercise buttons
    document.querySelectorAll('.add-exercise-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const day = e.target.closest('.add-exercise-btn').dataset.day;
            addExercise(day);
        });
    });
    
    // Delete exercise buttons
    document.querySelectorAll('.delete-exercise').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target.closest('.delete-exercise');
            const day = target.dataset.day;
            const index = parseInt(target.dataset.index);
            deleteExercise(day, index);
        });
    });
    
    // Muscle group inputs
    document.querySelectorAll('input[id$="MuscleGroup"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const day = e.target.id.replace('MuscleGroup', '');
            updateMuscleGroup(day, e.target.value);
        });
        
        input.addEventListener('blur', (e) => {
            const day = e.target.id.replace('MuscleGroup', '');
            updateMuscleGroup(day, e.target.value);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Day tabs
    dayTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const day = tab.dataset.day;
            
            // Update active tab
            dayTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.day-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${day}Content`).classList.add('active');
        });
    });
    
    // Action buttons
    resetScheduleBtn.addEventListener('click', resetSchedule);
    publishChangesBtn.addEventListener('click', publishChanges);
    backupDataBtn.addEventListener('click', backupData);
}

// Add exercise to a day
function addExercise(day) {
    const nameInput = document.getElementById(`${day}ExerciseName`);
    const setsInput = document.getElementById(`${day}ExerciseSets`);
    const repsInput = document.getElementById(`${day}ExerciseReps`);
    
    const name = nameInput.value.trim();
    const sets = parseInt(setsInput.value);
    const reps = repsInput.value.trim();
    
    if (!name) {
        showNotification('Please enter exercise name!', 'error');
        nameInput.focus();
        return;
    }
    
    if (!sets || sets < 1 || sets > 10) {
        showNotification('Please enter valid sets (1-10)!', 'error');
        setsInput.focus();
        return;
    }
    
    if (!reps) {
        showNotification('Please enter reps!', 'error');
        repsInput.focus();
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
    
    // Clear inputs
    nameInput.value = '';
    setsInput.value = '3';
    repsInput.value = '8-12';
    
    showNotification(`Exercise "${name}" added successfully!`, 'success');
}

// Delete exercise from a day
function deleteExercise(day, index) {
    if (confirm('Are you sure you want to delete this exercise?')) {
        workoutSchedule[day].exercises.splice(index, 1);
        saveWorkoutData();
        renderDayContents();
        updateStats();
        showNotification('Exercise deleted successfully!', 'success');
    }
}

// Update muscle group for a day
function updateMuscleGroup(day, muscleGroup) {
    if (!workoutSchedule[day]) {
        workoutSchedule[day] = { muscleGroup: '', exercises: [] };
    }
    
    workoutSchedule[day].muscleGroup = muscleGroup.trim();
    saveWorkoutData();
    showNotification('Muscle group updated successfully!', 'success');
}

// Reset entire schedule
function resetSchedule() {
    if (confirm('Are you sure you want to reset the entire schedule? This action cannot be undone.')) {
        workoutSchedule = {
            monday: { muscleGroup: '', exercises: [] },
            tuesday: { muscleGroup: '', exercises: [] },
            wednesday: { muscleGroup: '', exercises: [] },
            thursday: { muscleGroup: '', exercises: [] },
            friday: { muscleGroup: '', exercises: [] }
        };
        saveWorkoutData();
        renderDayContents();
        updateStats();
        showNotification('Schedule reset successfully!', 'success');
    }
}

// Publish changes
function publishChanges() {
    saveWorkoutData();
    showNotification('Changes published successfully! Users will see the updated schedule.', 'success');
}

// Backup data
function backupData() {
    try {
        const dataStr = JSON.stringify(workoutSchedule, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stronger-workout-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Backup downloaded successfully!', 'success');
    } catch (error) {
        console.error('Backup error:', error);
        showNotification('Backup failed!', 'error');
    }
}

// Update statistics
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
    
    // Simulate user growth (in real app, this would come from analytics)
    const baseUsers = 85;
    const randomGrowth = Math.floor(Math.random() * 5);
    stats.totalUsers = baseUsers + randomGrowth;
    stats.totalExercises = totalExercises;
    stats.activeWorkouts = activeWorkouts;
    
    totalExercisesEl.textContent = stats.totalExercises;
    totalUsersEl.textContent = stats.totalUsers;
    activeWorkoutsEl.textContent = stats.activeWorkouts;
}

// Start real-time updates
function startRealTimeUpdates() {
    // Update stats every 10 seconds
    setInterval(() => {
        updateStats();
    }, 10000);
    
    // Check for external changes every 5 seconds
    setInterval(() => {
        const savedData = localStorage.getItem('gymWorkoutSchedule');
        if (savedData) {
            const newSchedule = JSON.parse(savedData);
            if (JSON.stringify(newSchedule) !== JSON.stringify(workoutSchedule)) {
                workoutSchedule = newSchedule;
                renderDayContents();
                updateStats();
                showNotification('Data updated in real-time!', 'success');
            }
        }
    }, 5000);
}

// Show notification
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
});