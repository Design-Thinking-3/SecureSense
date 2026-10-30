import * as React from "react";
import { makeStyles } from "@fluentui/react-components";

const agentUrl =
  "https://copilotstudio.microsoft.com/environments/Default-2eba4cf8-af76-4db3-bcaf-81b5592535ef/bots/cr4d5_agent_c2bVLX/webchat?__version__=2&enableFileAttachment=false&cliAgent=true";

const useStyles = makeStyles({
  root: {
    width: "100%",
    height: "100vh",
  },
  agent: {
    display: "block",
    width: "100%",
    height: "100%",
    border: 0,
  },
});

const App: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <iframe
        className={styles.agent}
        src={agentUrl}
        title="SecureSense AI agent"
      />
    </div>
  );
};

export default App;
