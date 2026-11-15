export default {
  "ssh.prompt.title": "Connect to {hostname}",
  "ssh.prompt.description":
    "Pick the user to sign in as. Your policy's SSH rules decide which ones are allowed.",
  "ssh.prompt.username": "Username",
  "ssh.prompt.connect": "Connect",
  "ssh.prompt.troubleshooting": "Can't connect? See {link}.",
  "ssh.prompt.troubleshootingLink": "troubleshooting",
  "ssh.offline.title": "{hostname} is offline",
  "ssh.offline.description":
    "It isn't connected to the tailnet right now. Start Tailscale on it, then try again.",
  "ssh.retry": "Try again",
  "ssh.compatibility.title": "Browser SSH is broken on Headscale {version}",
  "ssh.compatibility.description":
    "Headscale 0.29 beta releases through 0.29.1 reject Tailscale's browser/WASM {path} WebSocket request with {status}. Upgrade Headscale to 0.29.2 or newer, or use Headscale 0.28.x.",
  "ssh.status.joining": "Joining Tailnet…",
  "ssh.status.connecting": "Connecting to {hostname}…",
  "ssh.status.stopped": "Tailnet node stopped: {error}",
  "ssh.status.failed": "Failed to join Tailnet: {error}",
  "ssh.diagnostic.shutdown": "Unexpected shutdown",
  "ssh.diagnostic.authRejected": "Headscale rejected the auth key",
  "ssh.diagnostic.original": "{description}. Original details: {message}",
  "ssh.signIn.title": "Sign in to continue",
  "ssh.signIn.description":
    "{hostname} needs you to sign in again before it opens the session. {signIn}",
  "ssh.signIn.link": "Sign in",
  "ssh.terminal": "SSH terminal for {username}@{hostname}",
  "ssh.docs": "Read the docs",
  "ssh.return": "Go to Headplane",
  "ssh.error.wasm.title": "Browser SSH isn't available",
  "ssh.error.wasm.description": "This build of Headplane doesn't include browser SSH.",
  "ssh.error.agent.title": "Browser SSH needs the agent",
  "ssh.error.agent.description": "Turn on the Headplane agent to use browser SSH.",
  "ssh.error.oidc.title": "Browser SSH needs SSO",
  "ssh.error.oidc.description":
    "Sign in with SSO to use browser SSH. API key sessions don't have a Headscale user.",
  "ssh.error.node.title": "Machine not found",
  "ssh.error.node.description":
    "There's no machine named {hostname}. It may have been renamed or removed.",
  "ssh.error.user.title": "Your account isn't linked",
  "ssh.error.user.description":
    "Browser SSH connects as your Headscale user. Ask an administrator to link your account to one.",
} as const;
