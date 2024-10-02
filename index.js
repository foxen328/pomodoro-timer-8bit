// Variables to track time
let minutes = 25;
let seconds = 0;
let timerInterval;
let isRunning = false;

// Function to update the timer display
function updateDisplay() {
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

// Request permission for browser notifications
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Function to notify the user with a browser notification
function notifyUser() {
  if (Notification.permission === "granted") {
    new Notification("Pomodoro Timer", {
      body: "Time's up! Take a break.",
      icon: 'https://example.com/timer-icon.png'  // You can replace this with an actual icon URL
    });
  }
}

// Function to play sound when the timer finishes
function playSound() {
  const sound = document.getElementById('alarm-sound');
  sound.play();
}

// Function to start the timer
function startTimer() {
  if (!isRunning) {
    isRunning = true;
    timerInterval = setInterval(function () {
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(timerInterval);
          isRunning = false;

          // Timer finished: notify the user and play sound
          alert("Time's up!");
          notifyUser();
          playSound();
        } else {
          minutes--;
          seconds = 59;
        }
      } else {
        seconds--;
      }
      updateDisplay();
    }, 1000); // The interval is set to 1000 milliseconds (1 second)
  }
}

// Function to pause the timer
function pauseTimer() {
  clearInterval(timerInterval);
  isRunning = false;
}

// Function to reset the timer
function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  minutes = 25;
  seconds = 0;
  updateDisplay();
}

// Add event listeners to buttons
document.getElementById('start').addEventListener('click', startTimer);
document.getElementById('pause').addEventListener('click', pauseTimer);
document.getElementById('reset').addEventListener('click', resetTimer);

// Initial display update
updateDisplay();