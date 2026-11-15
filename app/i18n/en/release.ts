export default {
  "common.copiedAttribute": "Copied {name} to clipboard",
  "common.confirm": "Confirm",
  "common.retry": "Retry",
  "common.learnMore": "Learn more",
  "common.learnMorePeriod": "Learn more.",
  "common.errorDetails": "Error Details",
  "common.requestUrl": "Request URL: {url}",
  "common.statusCode": "Status Code: {status}",
  "common.statusText": "Status Text: {text}",
  "common.error": "Error",
  "common.errorName": "Error: {name}",
  "common.errorStatus": "Error {status}",
  "common.unexpectedError": "Unexpected Error",
  "common.pageUnavailable": "{page} Unavailable",
  "common.pageUnavailableHint":
    "This page could not be loaded because the Headscale server is unreachable. It will be available once the connection is restored.",
  "error.apiTitle": "Headscale API Error",
  "error.apiCommunication": "There was an error communicating with the Headscale API.",
  "error.apiServer":
    "The server responded with a status code of {status}, indicating a server-side issue. Please check the Headscale server status and try again later.",
  "error.apiUnexpected": "The Headscale API returned an unexpected response.",
  "error.apiAuth":
    "The status code indicates an authentication error. Please verify your API key and Headplane configuration.",
  "error.apiUnsupported":
    "You may be using an unsupported version of Headscale or this may be a bug.",
  "error.apiInvalidTitle": "Invalid response from Headscale API",
  "error.connectionHint":
    "Headplane was unable to reach the Headscale API. Please check your network setup and configuration to ensure Headplane is able to connect.",
  "error.connectionTitle": "Cannot connect to Headscale API",
  "error.processing": "There was an error processing your request.",
  "error.report":
    "An unexpected error occurred which is most likely a bug. Please consider reporting filing an issue on the {link} repository with the details below.",
  "error.original": "Original diagnostic details:",
  "live.unreachable": "Headscale Unreachable",
  "live.unreachableHint":
    "Unable to connect to the Headscale server. Data shown may be stale and changes cannot be saved until the connection is restored.",
  "footer.sponsor":
    "Headplane is free and open-source. Please consider {link} to support development.",
  "footer.sponsoring": "sponsoring",
  "footer.debug": "Debug",
  "footer.hideUrl": "Hide server URL",
  "footer.showUrl": "Show server URL",
  "nav.logo": "Headplane logo",
  "login.welcome": "Welcome to Headplane",
  "login.instructions":
    "Enter an API key to authenticate with Headplane. You can generate one by running {command} in your terminal.",
  "login.signIn": "Sign In",
  "login.singleSignOn": "Single Sign-On",
  "login.configurationIssue": "Configuration Issue",
  "login.configurationIssues": "Configuration Issue(s)",
  "login.cookieWarning":
    "Headplane is configured to use secure cookies, but this site is being served over an insecure connection and login will not work correctly.",
  "login.keyLabel": "API Key",
  "login.error.missing": "Missing API key. Please enter your API key.",
  "login.error.empty": "API key cannot be empty. Please enter a valid API key.",
  "login.error.notFoundLegacy": "API key was not found in the Headscale database",
  "login.error.malformed":
    "API key is malformed (missing expiration). Please generate a new API key.",
  "login.error.expiredLegacy": "API key has expired",
  "login.error.invalidLegacy": "API key is invalid (it may be incorrect or expired)",
  "login.error.validation": "Error while validating API key (see logs for details)",
  "logout.titleLegacy": "You have been logged out",
  "logout.descriptionLegacy": "You can now close this window.",
  "oidc.unavailableTitleLegacy": "SSO Temporarily Unavailable",
  "oidc.unavailableLegacy":
    "Unable to reach the identity provider. Single Sign-On will be available once the provider is reachable again. You can still sign in with an API key.",
  "oidc.authError": "Authentication Error",
  "oidc.configIntro": "The OpenID Connect (OIDC) Single Sign-On (SSO) configuration has issues:",
} as const;
