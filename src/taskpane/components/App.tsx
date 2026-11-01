import * as React from "react";
import { Button, Spinner, Badge, Text, makeStyles, tokens } from "@fluentui/react-components";
import { readCurrentEmail } from "../emailReader";

const agentUrl =
  "https://copilotstudio.microsoft.com/environments/Default-2eba4cf8-af76-4db3-bcaf-81b5592535ef/bots/cr4d5_agent_c2bVLX/webchat?__version__=2&enableFileAttachment=false&cliAgent=true";

interface Analysis {
  verdict: "safe" | "suspicious" | "malicious";
  confidence: number;
  reasons: string[];
  advice: string;
}

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", height: "100vh" },
  panel: { padding: "12px", display: "flex", flexDirection: "column", gap: "10px" },
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
      <div className={styles.panel}>
        <Button appearance="primary" onClick={analyse} disabled={loading}>
          Analyse this email
        </Button>

        {loading && <Spinner label="Analysing..." />}
        {error && <Text className={styles.error}>{error}</Text>}

        {result && (
          <>
            <div>
              <Badge color={verdictColour[result.verdict] ?? "informative"} size="large">
                {result.verdict.toUpperCase()}
              </Badge>{" "}
              <Text>{result.confidence}% confidence</Text>
            </div>
            <ul>
              {result.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <Text weight="semibold">{result.advice}</Text>
          </>
        )}

        <Button appearance="subtle" onClick={() => setShowAgent(!showAgent)}>
          {showAgent ? "Hide chat agent" : "Open chat agent"}
        </Button>
      </div>

      {showAgent && <iframe className={styles.agent} src={agentUrl} title="SecureSense AI agent" />}
    </div>
  );
};

export default App;