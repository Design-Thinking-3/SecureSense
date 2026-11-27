import * as React from "react";
import { Button, Spinner, Badge, Text, makeStyles, tokens } from "@fluentui/react-components";
import { readCurrentEmail } from "../emailReader";
import type { Analysis } from "../types";

const riskColour = { high: "danger", medium: "warning", low: "success" } as const;

const liveChatScriptUrl = "https://oc-cdn-public-oce.azureedge.net/livechatwidget/scripts/LiveChatBootstrapper.js";
const liveChatFallbackUrl =
  "https://ocprodpublicocegs.blob.core.windows.net/livechatwidget/scripts/LiveChatBootstrapper.js";
const liveChatAttributes = {
  "data-app-id": "31b45f16-22f2-4396-8570-06584a86c764",
  "data-lcw-version": "prod",
  "data-org-id": "03336418-251b-4f0d-acf9-98604e8fad08",
  "data-org-url": "https://m-03336418-251b-4f0d-acf9-98604e8fad08.au.omnichannelengagementhub.com",
  "data-widget-ui-version": "modern",
};

const useStyles = makeStyles({
  root: { display: "flex", flexDirection: "column", height: "100vh" },
  panel: { padding: "12px", display: "flex", flexDirection: "column", gap: "10px" },
  error: { color: tokens.colorPaletteRedForeground1 },
});

const App: React.FC = () => {
  const styles = useStyles();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [chatError, setChatError] = React.useState("");
  const [result, setResult] = React.useState<Analysis | null>(null);

  React.useEffect(() => {
    let disposed = false;
    let activeScript: HTMLScriptElement;

    const createScript = (src: string, isFallback: boolean): HTMLScriptElement => {
      const script = document.createElement("script");
      script.id = "Microsoft_Omnichannel_LCWidget";
      script.src = src;
      script.async = true;
      Object.keys(liveChatAttributes).forEach((name) =>
        script.setAttribute(name, liveChatAttributes[name as keyof typeof liveChatAttributes])
      );
      script.onerror = () => {
        script.remove();
        if (disposed) return;
        if (isFallback) {
          setChatError("Chat support couldn't be loaded. Please try again later.");
          return;
        }
        activeScript = createScript(liveChatFallbackUrl, true);
        document.body.appendChild(activeScript);
      };
      return script;
    };

    activeScript = createScript(liveChatScriptUrl, false);
    document.body.appendChild(activeScript);

    return () => {
      disposed = true;
      activeScript.remove();
    };
  }, []);

  const analyse = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const email = await readCurrentEmail();
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
        {chatError && <Text className={styles.error} role="alert">{chatError}</Text>}

        {result && (
          <>
            <div>
              <Badge color={riskColour[result.riskLevel]} size="large">
                {result.riskLevel.toUpperCase()} RISK
              </Badge>{" "}
              <Text>{result.summary}</Text>
            </div>
            <ul>
              {result.issues.map((issue) => (
                <li key={issue.type}>
                  <b>{issue.title}</b>
                  {issue.evidence && `: ${issue.evidence}`}
                  <br />
                  {issue.explanation}
                </li>
              ))}
            </ul>
            {result.recommendation && <Text weight="semibold">My recommendation: {result.recommendation}</Text>}
          </>
        )}
      </div>
    </div>
  );
};

export default App;