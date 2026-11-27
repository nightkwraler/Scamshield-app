
const subject = document.getElementById("subject");
const counter = document.getElementById("counter");
const analyzeButton = document.getElementById("analyze");
const notice = document.getElementById("notice");
const result = document.getElementById("result");

// Update the character counter
subject.addEventListener("input", () => {
  counter.textContent = `${subject.value.length} characters`;
});

// Handle the Analyze button
analyzeButton.addEventListener("click", () => {
  const text = subject.value.trim();

  if (!text) {
    notice.textContent = "Please enter a suspicious link or message first.";
    notice.hidden = false;
    return;
  }

  notice.textContent = "Your submission is ready for analysis.";
  notice.hidden = false;

  result.textContent =
    "ScamShield is ready. On-chain AI analysis will be connected next.";

  result.hidden = false;
});
