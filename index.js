// Timer variables
let minutes = 25;
let seconds = 0;
let timerInterval;

// Update title with the remaining time
function updateTitle() {
  document.title = `Pomodoro - ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update the timer display and the title
function updateDisplay() {
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
  updateTitle(); // Update the title with the remaining time
  updateProgress(); // Update the progress bar
}

// Start the timer
document.getElementById('start').addEventListener('click', () => {
  const clickSound = document.getElementById('click-sound');
  clickSound.play();

  if (!timerInterval) {
    timerInterval = setInterval(() => {
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(timerInterval);
          // Removed buzzer sound here
        } else {
          minutes--;
          seconds = 59;
        }
      } else {
        seconds--;
      }
      updateDisplay();
    }, 1000);
  }
});

// Pause the timer
document.getElementById('pause').addEventListener('click', () => {
  document.getElementById('click-sound').play();
  clearInterval(timerInterval);
  timerInterval = null;
});

// Reset the timer
document.getElementById('reset').addEventListener('click', () => {
  document.getElementById('click-sound').play();
  clearInterval(timerInterval);
  timerInterval = null;
  minutes = 25;
  seconds = 0;
  updateDisplay();
});

// Update the progress bar based on time left
function updateProgress() {
  const totalSeconds = 25 * 60; // 25 minutes total in seconds
  const elapsedSeconds = (25 - minutes) * 60 + (60 - seconds);
  const progressPercentage = (elapsedSeconds / totalSeconds) * 100;
  document.querySelector('.progress-fill').style.width = progressPercentage + '%';
}

// Dark mode toggle
document.getElementById('toggle-dark-mode').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// Music toggle
document.getElementById('music-toggle').addEventListener('click', () => {
  const music = document.getElementById('bg-music');
  if (music.paused) {
    music.play();
  } else {
    music.pause();
  }
});