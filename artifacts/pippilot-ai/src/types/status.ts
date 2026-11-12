/** Setup states for future integrations; these types do not connect services. */
export type IntegrationStatus =
  | 'not-configured'
  | 'planned'
  | 'connected'
  | 'error';

/** Product capabilities that may later be implemented behind verified services. */
export type CapabilityStatus = 'planned' | 'available' | 'unavailable';
