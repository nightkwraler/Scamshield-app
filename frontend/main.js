
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
  const fullReport = String(report);
  const parts = fullReport.split(/\r?\n---\r?\n/);

  const assessment =
    parts.length > 1
      ? parts.slice(1).join("\n---\n")
      : fullReport;

  result.textContent = assessment.trim();
  result.hidden = false;
}

function getErrorMessage(error) {
  return (
    error?.shortMessage ||
    error?.message ||
    "An unexpected error occurred. Check the transaction in GenLayer Explorer."
  );
}

analyzeButton.addEventListener("click", async () => {
  const submittedText = subject.value.trim();

  if (!submittedText) {
    showNotice("Please enter a suspicious link or message first.");
    return;
  }

  if (submittedText.length > 1200) {
    showNotice("Please keep your submission under 1,200 characters.");
    return;
  }

  if (!window.ethereum) {
    showNotice(
      "MetaMask was not detected. Install or unlock MetaMask, then refresh this page."
    );
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Connecting to Studionet...";
  result.hidden = true;

  let transactionHash;

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

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

    showNotice(
      "Preparing your AI scam analysis. Confirm the transaction in MetaMask."
    );

    analyzeButton.textContent = "Preparing transaction...";

    const write = {
      address: CONTRACT_ADDRESS,
      functionName: "analyze",
      args: [submittedText],
    };

    const estimate =
      await client.estimateTransactionFeesForWrite(write);

    transactionHash = await client.writeContract({
      ...write,
      fees: {
        distribution: estimate.distribution,
        feeValue: estimate.feeValue,
      },
    });

    showNotice(
      `Transaction submitted: ${transactionHash}. Waiting for GenLayer finalization. Do not submit it again.`
    );

    analyzeButton.textContent = "Waiting for finalization...";

    const transaction = await client.waitForFinalization({
      hash: transactionHash,
      interval: 5000,
      retries: 100,
    });

    if (!isSuccessful(transaction)) {
      throw new Error(
        `The transaction did not complete successfully. Status: ${
          transaction.statusName ?? "unknown"
        }. Execution: ${
          transaction.txExecutionResultName ?? "unknown"
        }. Check the transaction in GenLayer Explorer before trying again.`
      );
    }

    showNotice(
      "Transaction finalized successfully. Retrieving your on-chain assessment..."
    );

    analyzeButton.textContent = "Retrieving assessment...";

    const reportCount = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_report_count",
      args: [],
    });

    const reportId = Number(reportCount);

    if (!Number.isSafeInteger(reportId) || reportId < 1) {
      throw new Error(
        `The transaction finalized, but the report count could not be read. Transaction: ${transactionHash}`
      );
    }

    const report = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_report",
      args: [reportId],
    });

    if (
      report === null ||
      report === undefined ||
      String(report).trim() === ""
    ) {
      throw new Error(
        `The transaction finalized, but report #${reportId} could not be retrieved. Transaction: ${transactionHash}`
      );
    }

    showAssessment(report);

    showNotice(
      `Analysis finalized on Studionet. On-chain report #${reportId}.`
    );
  } catch (error) {
    console.error("ScamShield analysis error:", error);

    if (transactionHash) {
      showNotice(
        `A transaction was submitted: ${transactionHash}. If confirmation timed out, check this transaction in GenLayer Explorer before trying again. Do not submit the same analysis again until its status is checked. Details: ${getErrorMessage(error)}`
      );
    } else {
      showNotice(getErrorMessage(error));
    }
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze for scams →";
  }
});
