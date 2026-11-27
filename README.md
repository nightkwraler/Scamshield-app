# 🛡️ ScamShield — AI-Powered Scam Detector

**ScamShield** is an AI-powered scam detection application built on [GenLayer](https://genlayer.com/). It helps users identify potentially fraudulent messages, suspicious URLs, crypto investment offers, airdrops, and giveaways.

ScamShield uses GenLayer Intelligent Contracts to analyze submitted content, assess potential risks, and provide explanations and safety recommendations.

## 🌐 Live Application

**Try ScamShield:** https://scamshield-app-chi.vercel.app/

## ✨ Features

- **AI-Powered Analysis:** Uses GenLayer intelligent contract execution to evaluate suspicious content.
- **Risk Classification:** Identifies potential threats using LOW, MEDIUM, and HIGH risk levels.
- **Risk Scoring:** Provides a numerical risk score from 0 to 100.
- **Explainable Results:** Provides reasons behind each risk assessment.
- **Safety Recommendations:** Offers practical advice to help users avoid scams.
- **On-Chain Reports:** Stores submitted subjects and AI assessments on GenLayer.
- **Web3 Integration:** Connects through MetaMask and interacts with a deployed GenLayer contract.

## ⚙️ How It Works

1. A user enters a suspicious message, URL, investment offer, or giveaway.
2. The frontend connects to the user's wallet through MetaMask.
3. The application submits the content to the ScamShield Intelligent Contract.
4. GenLayer validators process the intelligent contract execution and reach a consensus decision.
5. The contract stores the AI assessment on-chain.
6. ScamShield retrieves and displays the assessment to the user.

## 🧠 Built on GenLayer

ScamShield uses GenLayer's Intelligent Contract capabilities to evaluate information that requires AI-powered interpretation.

The smart contract uses:

- `gl.nondet.exec_prompt` for AI-powered content analysis.
- `gl.eq_principle.prompt_non_comparative` for intelligent consensus evaluation.
- On-chain storage to preserve submitted reports and their assessments.

This combines AI-powered analysis with blockchain-based execution and verifiable transaction records.

## 📜 Smart Contract

**Network:** GenLayer Studionet

**Contract Address:**
`0x2E5759299EA090278Ce1eb6242311D6C690169ED`

**Contract Functions:**

| Function | Description |
|---|---|
| `analyze(subject)` | Analyzes submitted content and stores the assessment |
| `get_report(report_id)` | Retrieves a stored report |
| `get_report_count()` | Returns the total number
