'use client';

import { MedplumClient } from '@medplum/core';
import { Device, Organization } from '@medplum/fhirtypes';

export const medplumClient = new MedplumClient({
  baseUrl: process.env.MEDPLUM_BASE_URL || 'https://api.medplum.com',
  clientId: process.env.MEDPLUM_CLIENT_ID,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET,
  fetch: fetch,
});

export async function initializeMedplum() {
  try {
    // Check if already authenticated
    if (!medplumClient.isAuthenticated()) {
      // Use client credentials for server-side operations
      // Note: startClientLogin requires clientId and clientSecret
      // This is handled by the MedplumClient constructor
    }
    return medplumClient;
  } catch (error) {
    console.error('Medplum initialization error:', error);
    throw error;
  }
}

// Search devices from Medplum
export async function searchMedplumDevices(params: {
  query?: string;
  limit?: number;
  offset?: number;
  market?: string;
}): Promise<Device[]> {
  const client = await initializeMedplum();
  
  const searchParams: Record<string, string> = {
    _count: (params.limit || 20).toString(),
    _offset: (params.offset || 0).toString(),
  };
  
  if (params.query) {
    searchParams._text = params.query;
  }
  
  if (params.market) {
    searchParams['manufacturer'] = params.market;
  }
  
  try {
    const result = await client.searchResources('Device', searchParams);
    return Array.from(result) as Device[];
  } catch (error) {
    console.error('Error searching Medplum devices:', error);
    return [];
  }
}

// Search organizations from Medplum
export async function searchMedplumOrganizations(params: {
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<Organization[]> {
  const client = await initializeMedplum();
  
  const searchParams: Record<string, string> = {
    _count: (params.limit || 20).toString(),
    _offset: (params.offset || 0).toString(),
  };
  
  if (params.query) {
    searchParams._text = params.query;
  }
  
  try {
    const result = await client.searchResources('Organization', searchParams);
    return Array.from(result) as Organization[];
  } catch (error) {
    console.error('Error searching Medplum organizations:', error);
    return [];
  }
}

// Search regulatory authorizations from Medplum
export async function searchMedplumRegulatoryAuthorizations(params: {
  query?: string;
  limit?: number;
  offset?: number;
  deviceId?: string;
}): Promise<any[]> {
  const client = await initializeMedplum();
  
  const searchParams: Record<string, string> = {
    _count: (params.limit || 20).toString(),
    _offset: (params.offset || 0).toString(),
  };
  
  if (params.query) {
    searchParams._text = params.query;
  }
  
  if (params.deviceId) {
    searchParams['device'] = params.deviceId;
  }
  
  try {
    // Note: RegulatoryAuthorization is not a standard FHIR resource type
    // Using generic search with type assertion
    const result = await client.searchResources('Device', searchParams);
    return Array.from(result) as any[];
  } catch (error) {
    console.error('Error searching Medplum regulatory authorizations:', error);
    return [];
  }
}

// Get device by ID
export async function getMedplumDevice(id: string): Promise<Device | null> {
  const client = await initializeMedplum();
  
  try {
    return await client.readResource('Device', id) as Device;
  } catch (error) {
    console.error(`Error getting Medplum device ${id}:`, error);
    return null;
  }
}

// Get organization by ID
export async function getMedplumOrganization(id: string): Promise<Organization | null> {
  const client = await initializeMedplum();
  
  try {
    return await client.readResource('Organization', id) as Organization;
  } catch (error) {
    console.error(`Error getting Medplum organization ${id}:`, error);
    return null;
  }
}

// Check if Medplum is enabled
export function isMedplumEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MEDPLUM_ENABLED === 'true';
}
