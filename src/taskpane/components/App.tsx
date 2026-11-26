import * as React from "react";
import { Button, Spinner, Badge, Text, makeStyles, tokens } from "@fluentui/react-components";
import {
  CheckmarkCircle16Regular,
  ShieldCheckmark24Regular,
  Warning16Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { readCurrentEmail } from "../emailReader";

const agentUrl =
  "https://copilotstudio.microsoft.com/environments/Default-2eba4cf8-af76-4db3-bcaf-81b5592535ef/bots/cr4d5_agent_c2bVLX/webchat?__version__=2&enableFileAttachment=false&cliAgent=true";

interface Analysis {
  verdict: "safe" | "suspicious" | "malicious";
  confidence: number;
  reasons: string[];
  advice: string;
}

const riskDescription: Record<Analysis["verdict"], string> = {
  safe: "No significant signs of phishing were detected.",
  suspicious: "This email contains signals that deserve a closer look.",
  malicious: "This email shows signs of phishing or malicious content.",
};

const useStyles = makeStyles({
  root: { position: "relative", display: "flex", flexDirection: "column", height: "100vh" },
  panel: {
    boxSizing: "border-box",
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  readyPanel: {
    padding: "20px",
    backgroundColor: "#F4F7FB",
  },
  welcome: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    padding: "20px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "12px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  brandRow: { display: "flex", alignItems: "center", gap: "10px" },
  brandMark: {
    display: "grid",
    placeItems: "center",
    width: "40px",
    height: "40px",
    flexShrink: 0,
    borderRadius: "10px",
    color: tokens.colorBrandForeground1,
    backgroundColor: tokens.colorBrandBackground2,
  },
  brandName: { color: tokens.colorNeutralForeground1 },
  eyebrow: {
    color: tokens.colorNeutralForeground3,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  welcomeTitle: {
    margin: 0,
    color: tokens.colorNeutralForeground1,
    lineHeight: "32px",
  },
  welcomeDescription: {
    color: tokens.colorNeutralForeground2,
    lineHeight: "21px",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingTop: "16px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  feature: { display: "flex", alignItems: "center", gap: "9px" },
  featureIcon: { color: tokens.colorBrandForeground1, flexShrink: 0 },
  featureText: { color: tokens.colorNeutralForeground2 },
  riskCard: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "16px",
    border: "1px solid transparent",
    borderRadius: "12px",
  },
  riskCardSafe: { backgroundColor: "#F0F8F2", border: "1px solid #C9E2CF" },
  riskCardSuspicious: { backgroundColor: "#FFF8E8", border: "1px solid #EAD9A7" },
  riskCardMalicious: { backgroundColor: "#FFF3F4", border: "1px solid #F0C7CA" },
  riskCardHeading: { display: "flex", alignItems: "center", gap: "8px" },
  riskIcon: { display: "flex", alignItems: "center" },
  riskIconSafe: { color: tokens.colorPaletteGreenForeground1 },
  riskIconSuspicious: { color: tokens.colorPaletteDarkOrangeForeground1 },
  riskIconMalicious: { color: tokens.colorPaletteRedForeground1 },
  riskHeading: { margin: 0, color: tokens.colorNeutralForeground2, letterSpacing: "0.5px" },
  riskScoreRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  riskScore: { lineHeight: "36px" },
  riskScoreSafe: { color: tokens.colorPaletteGreenForeground1 },
  riskScoreSuspicious: { color: tokens.colorPaletteDarkOrangeForeground1 },
  riskScoreMalicious: { color: tokens.colorPaletteRedForeground1 },
  riskConfidence: { color: tokens.colorNeutralForeground2 },
  riskDescription: { color: tokens.colorNeutralForeground1, lineHeight: "20px" },
  issueSection: { display: "flex", flexDirection: "column", gap: "10px" },
  issueHeading: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  issueCount: {
    padding: "4px 9px",
    borderRadius: "999px",
    color: tokens.colorNeutralForeground2,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  issueList: { display: "flex", flexDirection: "column", gap: "8px" },
  issueCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "9px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  issueIcon: { display: "flex", flexShrink: 0, paddingTop: "2px" },
  issueIconSafe: { color: tokens.colorPaletteGreenForeground1 },
  issueIconFlagged: { color: tokens.colorPaletteRedForeground1 },
  issueText: { color: tokens.colorNeutralForeground1, lineHeight: "20px" },
  emptyIssues: { color: tokens.colorNeutralForeground2 },
  adviceCard: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "#F4F7FB",
  },
  adviceHeading: { color: tokens.colorBrandForeground1 },
  adviceText: { color: tokens.colorNeutralForeground1, lineHeight: "20px" },
  actionFooter: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "auto",
  },
  analyseButton: { width: "100%" },
  chatAgentButton: {
    width: "100%",
    color: tokens.colorBrandForeground1,
    backgroundColor: "#EAF2FC",
    border: "1px solid #CEDFF2",
  },
  loadingState: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "24px",
    textAlign: "center",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  loadingMessage: { color: tokens.colorNeutralForeground1 },
  loadingDescription: { color: tokens.colorNeutralForeground2 },
  error: { color: tokens.colorPaletteRedForeground1 },
  agent: { flex: 1, width: "100%", border: 0, minHeight: "300px" },
});

const verdictColour = { safe: "success", suspicious: "warning", malicious: "danger" } as const;

const App: React.FC = () => {
  const styles = useStyles();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<Analysis | null>(null);
  const [showAgent, setShowAgent] = React.useState(false);
  const isReady = !loading && !error && !result;
  const riskCardStyle = result
    ? {
        safe: styles.riskCardSafe,
        suspicious: styles.riskCardSuspicious,
        malicious: styles.riskCardMalicious,
      }[result.verdict]
    : "";
  const riskIconStyle = result
    ? {
        safe: styles.riskIconSafe,
        suspicious: styles.riskIconSuspicious,
        malicious: styles.riskIconMalicious,
      }[result.verdict]
    : "";
  const riskScoreStyle = result
    ? {
        safe: styles.riskScoreSafe,
        suspicious: styles.riskScoreSuspicious,
        malicious: styles.riskScoreMalicious,
      }[result.verdict]
    : "";

  const analyse = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const email = await readCurrentEmail();
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setResult(data);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={`${styles.panel} ${isReady ? styles.readyPanel : ""}`}>
        {!loading && (
          <>
            {isReady && (
              <section className={styles.welcome} aria-labelledby="welcome-title">
                <div className={styles.brandRow}>
                  <div className={styles.brandMark} aria-hidden="true">
                    <ShieldCheckmark24Regular />
                  </div>
                  <Text className={styles.brandName} size={400} weight="semibold">
                    SecureSense
                  </Text>
                </div>

                <div>
                  <Text className={styles.eyebrow} size={200} weight="semibold">
                    EMAIL SECURITY
                  </Text>
                  <Text
                    as="h1"
                    id="welcome-title"
                    className={styles.welcomeTitle}
                    size={800}
                    weight="semibold"
                  >
                    Know what&apos;s in your inbox.
                  </Text>
                  <Text className={styles.welcomeDescription} size={300}>
                    Check the open email for phishing, scams, and other signs of malicious content.
                  </Text>
                </div>

                <div className={styles.features}>
                  <Text size={200} weight="semibold">
                    YOUR ANALYSIS INCLUDES
                  </Text>
                  {["A clear safety verdict", "The reasons behind it", "Practical next steps"].map(
                    (feature) => (
                      <div className={styles.feature} key={feature}>
                        <CheckmarkCircle16Regular
                          className={styles.featureIcon}
                          aria-hidden="true"
                        />
                        <Text className={styles.featureText} size={300}>
                          {feature}
                        </Text>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {error && <Text className={styles.error}>{error}</Text>}

            {result && (
              <>
                <section
                  className={`${styles.riskCard} ${riskCardStyle}`}
                  aria-labelledby="risk-level-title"
                >
                  <div className={styles.riskCardHeading}>
                    <span className={`${styles.riskIcon} ${riskIconStyle}`} aria-hidden="true">
                      {result.verdict === "safe" ? (
                        <ShieldCheckmark24Regular />
                      ) : (
                        <Warning24Regular />
                      )}
                    </span>
                    <Text
                      as="h2"
                      id="risk-level-title"
                      className={styles.riskHeading}
                      size={200}
                      weight="semibold"
                    >
                      RISK LEVEL
                    </Text>
                  </div>
                  <div className={styles.riskScoreRow}>
                    <Text
                      className={`${styles.riskScore} ${riskScoreStyle}`}
                      size={800}
                      weight="semibold"
                    >
                      {Math.round(result.confidence)}%
                    </Text>
                    <div>
                      <Badge color={verdictColour[result.verdict] ?? "informative"} size="large">
                        {result.verdict.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <Text className={styles.riskConfidence} size={200}>
                    Confidence score
                  </Text>
                  <Text className={styles.riskDescription} size={300}>
                    {riskDescription[result.verdict]}
                  </Text>
                </section>

                <section className={styles.issueSection} aria-labelledby="issues-title">
                  <div className={styles.issueHeading}>
                    <Text as="h2" id="issues-title" size={500} weight="semibold">
                      {result.verdict === "safe" ? "Analysis notes" : "Flagged issues"}
                    </Text>
                    <Text className={styles.issueCount} size={200}>
                      {result.reasons.length} found
                    </Text>
                  </div>
                  {result.reasons.length > 0 ? (
                    <div className={styles.issueList}>
                      {result.reasons.map((reason, i) => (
                        <div className={styles.issueCard} key={`${reason}-${i}`}>
                          <span
                            className={`${styles.issueIcon} ${
                              result.verdict === "safe"
                                ? styles.issueIconSafe
                                : styles.issueIconFlagged
                            }`}
                            aria-hidden="true"
                          >
                            {result.verdict === "safe" ? (
                              <CheckmarkCircle16Regular />
                            ) : (
                              <Warning16Regular />
                            )}
                          </span>
                          <Text className={styles.issueText} size={300}>
                            {reason}
                          </Text>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Text className={styles.emptyIssues} size={300}>
                      No issues were flagged.
                    </Text>
                  )}
                </section>

                <section className={styles.adviceCard} aria-labelledby="advice-title">
                  <Text
                    as="h2"
                    id="advice-title"
                    className={styles.adviceHeading}
                    size={200}
                    weight="semibold"
                  >
                    RECOMMENDED ACTION
                  </Text>
                  <Text className={styles.adviceText} size={300}>
                    {result.advice}
                  </Text>
                </section>
              </>
            )}

            <div className={styles.actionFooter}>
              {!result && (
                <Button
                  className={styles.analyseButton}
                  appearance="primary"
                  size={isReady ? "large" : "medium"}
                  onClick={analyse}
                >
                  Analyse this email
                </Button>
              )}

              <Button
                className={styles.chatAgentButton}
                appearance="secondary"
                onClick={() => setShowAgent(!showAgent)}
              >
                {showAgent ? "Hide chat agent" : "Open chat agent"}
              </Button>
            </div>
          </>
        )}
      </div>

      {showAgent && <iframe className={styles.agent} src={agentUrl} title="SecureSense AI agent" />}

      {loading && (
        <div className={styles.loadingState} role="status" aria-live="polite">
          <Spinner size="large" aria-hidden="true" />
          <Text className={styles.loadingMessage} size={400} weight="semibold">
            Analysing this email...
          </Text>
          <Text className={styles.loadingDescription} size={300}>
            Checking for signs of phishing and scams.
          </Text>
        </div>
      )}
    </div>
  );
};

export default App;