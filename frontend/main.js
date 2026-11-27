import { createClient, isSuccessful } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT_ADDRESS = "0x2E5759299EA090278Ce1eb6242311D6C690169ED";

const subject = document.getElementById("subject");
const counter = document.getElementById("counter");
const analyzeButton = document.getElementById("analyze");
const notice = document.getElementById("notice");
const result = document.getElementById("result");

subject.addEventListener("input", () => {
  counter.textContent = `${subject.value.length} / 1200`;
});

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = false;
}

function showAssessment(report) {
  const parts = report.split("\\n---\\n");
  const assessment = parts.length > 1 ? parts.slice(1).join("\\n---\\n") : report;
  result.textContent = assessment.trim();
  result.hidden = false;
}

analyzeButton.addEventListener("click", async () => {
  const text = subject.value.trim();

  if (!text) {
    showNotice("Please enter a suspicious link or message first.");
    return;
  }

  if (text.length > 1200) {
    showNotice("Please keep your submission under 1,200 characters.");
    return;
  }

  if (!window.ethereum) {
    showNotice("MetaMask was not detected. Install or unlock MetaMask, then refresh this page.");
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Connecting to Studionet...";
  result.hidden = true;

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const walletAddress = accounts?.[0];

    if (!walletAddress) {
      throw new Error("No wallet account was selected.");
    }

    const client = createClient({
      chain: studionet,
      account: walletAddress,
      provider: window.ethereum,
    });

    await client.connect("studionet");

    showNotice("Preparing your on-chain AI analysis. Confirm the transaction in MetaMask when prompted.");
    analyzeButton.textContent = "Preparing transaction...";

    const write = {
      address: CONTRACT_ADDRESS,
      functionName: "analyze",
      args: [text],
    };

    const estimate = await client.estimateTransactionFeesForWrite(write);

    const txHash = await client.writeContract({
      ...write,
      fees: {
        distribution: estimate.distribution,
        feeValue: estimate.feeValue,
      },
    });

    showNotice(`Transaction submitted: ${txHash}. Waiting for GenLayer consensus...`);
    analyzeButton.textContent = "Waiting for consensus...";

    const transaction = await client.waitForFinalization({ hash: txHash });

    if (!isSuccessful(transaction)) {
      throw new Error(
        `GenLayer analysis did not succeed: ${transaction.statusName ?? "unknown status"} / ${transaction.txExecutionResultName ?? "unknown result"}`
      );
    }

    const reportId = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_report_count",
      args: [],
    });

    const report = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_report",
      args: [reportId],
    });

    showAssessment(String(report));
    showNotice(`Analysis finalized on Studionet. On-chain report #${reportId.toString()}.`);
  } catch (error) {
    console.error("ScamShield analysis error:", error);
    showNotice(error?.shortMessage || error?.message || "Something went wrong. Please try again.");
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze for scams →";
  }
});
