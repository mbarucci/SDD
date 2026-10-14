export const publicEventPath = (eventId) => `publicEvents/${eventId}`;
export const privateEventPath = (eventId) => `privateEvents/${eventId}`;
export const inboxPath = (eventId) => `${privateEventPath(eventId)}/inbox`;
export const rosterPath = (eventId) => `${privateEventPath(eventId)}/guests`;
export const editCapabilityPath = (token) => `publicEditCapabilities/${token}`;