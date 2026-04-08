const clickSound = new Audio("/sounds/click.mp3");
const warningSound = new Audio("/sounds/warning.mp3"); // Add this

export const playClick = () => {
  clickSound.currentTime = 0;
  clickSound.play().catch(e => console.log("Sound play blocked"));
};

export const playWarning = () => {
  warningSound.currentTime = 0;
  warningSound.volume = 0.5;
  warningSound.play().catch(e => console.log("Sound play blocked"));
};