
import {
  createClient,
  isSuccessful,
} from "genlayer-js";

import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant } from "genlayer-js/types";

const CONTRACT_ADDRESS =
  "0x2E5759299EA090278Ce1eb6242311D6C690169ED";

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

async function readReport(client, reportId) {
  return await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_report",
    args: [reportId],
    transactionHashVariant:
      TransactionHashVariant.LATEST_NONFINAL,
  });
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
    // Connect wallet
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

    // Prepare transaction
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

    // Submit transaction only once
    transactionHash = await client.writeContract({
      ...write,
      fees: {
        distribution: estimate.distribution,
        feeValue: estimate.feeValue,
      },
    });

    showNotice(
      `Transaction submitted: ${transactionHash}. Waiting for GenLayer's decision. Do not submit again.`
    );

    analyzeButton.textContent = "Waiting for AI assessment...";

    // Wait for consensus decision, not full fee finalization
    const transaction = await client.waitForDecision({
      hash: transactionHash,
      interval: 5000,
      retries: 120,
    });

    if (!isSuccessful(transaction)) {
      throw new Error(
        `The transaction did not execute successfully. Status: ${
          transaction.statusName ?? "unknown"
        }. Execution: ${
          transaction.txExecutionResultName ?? "unknown"
        }. Check this transaction in GenLayer Explorer before retrying.`
      );
    }

    showNotice(
      "GenLayer accepted the decision. Retrieving your on-chain assessment..."
    );

    analyzeButton.textContent = "Retrieving assessment...";

    // Read the report count from the latest decided state
    const reportCount = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_report_count",
      args: [],
      transactionHashVariant:
        TransactionHashVariant.LATEST_NONFINAL,
    });

    const reportId = Number(reportCount);

    if (!Number.isSafeInteger(reportId) || reportId < 1) {
      throw new Error(
        `The transaction was accepted, but the report count could not be read. Transaction: ${transactionHash}`
      );
    }

    // Retrieve the stored assessment
    const report = await readReport(client, reportId);

    if (
      report === null ||
      report === undefined ||
      String(report).trim() === ""
    ) {
      throw new Error(
        `The transaction was accepted, but report #${reportId} could not be retrieved. Transaction: ${transactionHash}`
      );
    }

    // Display assessment
    showAssessment(report);

    showNotice(
      `Analysis successful! GenLayer decision accepted. On-chain report #${reportId}.`
    );

  } catch (error) {
    console.error("ScamShield analysis error:", error);

    if (transactionHash) {
      showNotice(
        `Transaction submitted: ${transactionHash}. If the assessment did not appear, check this transaction in GenLayer Explorer before trying again. Do not submit it again. Details: ${getErrorMessage(error)}`
      );
    } else {
      showNotice(getErrorMessage(error));
    }

  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze for scams →";
  }
});
