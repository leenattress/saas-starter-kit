const domainRegex =
  /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/;

export const isValidDomain = (domain: string): boolean => {
  return domainRegex.test(domain);
};

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export const defaultHeaders = {
  'Content-Type': 'application/json',
};

export const passwordPolicies = {
  minLength: 8,
};

// List of events used to create webhook endpoint
export const eventTypes = [
  'member.created',
  'member.removed',
  'invitation.created',
  'invitation.removed',
];

export const maxLengthPolicies = {
  name: 104,
  nameShortDisplay: 20,
  email: 254,
  password: 70,
  team: 50,
  slug: 50,
  domain: 253,
  domains: 1024,
  apiKeyName: 64,
  webhookDescription: 100,
  webhookEndpoint: 2083,
  memberId: 64,
  eventType: 50,
  eventTypes: eventTypes.length,
  endpointId: 64,
  inviteToken: 64,
  expiredToken: 64,
  invitationId: 64,
  sendViaEmail: 10,
};

export const LlmPrompts= {
  'FIX_SPELLING': 'You are a spelling corrector. Only return what I send in corrected, do not add any other text. Respond in JSON only in this format: {"response": "..."}. Please check and fix any spelling mistakes in this text:',
  'SIMPLIFY': 'You are an expert business analyst. Simplify this text to make it easier to understand. Respond in JSON only in this format: {"response": "..."}. Please simplify this text: ',
  'UNSOLUTION': 'You are an expert business analyst. Remove any technical solutions from this and turn it into a sentence representing a customer problem, without mention of the technology we might use. Respond in JSON only in this format: {"response": "..."}. Please de-solution this text: '
}
