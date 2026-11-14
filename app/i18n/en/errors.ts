export default {
  "error.connectionTitle": "Can't reach Headscale",
  "error.connectionDescription":
    "Check that Headscale is running and that Headplane can connect to it.",
  "error.headscaleTitle": "Headscale returned an error",
  "error.headscaleDescription":
    "Headscale responded with {status}. Check its logs, then try again.",
  "error.rejectedTitle": "Headscale rejected the request",
  "error.rejectedDescription":
    "Check that the API key in Headplane's config is valid and hasn't expired.",
  "error.unexpectedTitle": "Unexpected response from Headscale",
  "error.unexpectedDescription":
    "Headplane may not support this version of Headscale, or this is a bug.",
  "error.notFoundTitle": "Page not found",
  "error.notFoundDescription": "There's nothing at this address.",
  "error.forbiddenTitle": "You don't have access",
  "error.forbiddenDescription": "Ask an administrator for access.",
  "error.unknownTitle": "Something went wrong",
  "error.serverDescription": "The server responded with {status}.",
  "error.bug": "This is probably a bug. Report it on GitHub with the details below.",
  "error.thisPage": "this page",
  "error.loadPage": "Can't load {page}",
  "error.accessPage": "You don't have access to {page}",
  "error.pageConnection": "This page needs Headscale to load. Try again once it's back.",
  "error.tryAgain": "Try again",
  "error.report": "Report an issue",
  "error.details": "Details",
  "error.goHome": "Go to Headplane",
  "error.staleData": "Some data may be out of date, and changes won't save until it's back.",
  "footer.sponsor":
    "Headplane is free and open-source. Please consider {link} to support development.",
  "footer.sponsorLink": "sponsoring",
  "footer.debug": "Debug",
  "footer.hideUrl": "Hide server URL",
  "footer.showUrl": "Show server URL",
} as const;
