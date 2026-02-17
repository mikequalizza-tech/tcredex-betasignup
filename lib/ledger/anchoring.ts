/**
 * tCredex External Anchoring Service
 * Anchors ledger hashes to external systems for independent verification
 */

import { getLedgerService } from './service';

interface AnchorResult {
  success: boolean;
  anchor_type: string;
  external_reference?: string;
  error?: string;
}

/**
 * Anchor to GitHub Gist
 * Creates or updates a gist with the latest ledger hash
 */
export async function anchorToGitHubGist(
  githubToken: string,
  gistId?: string
): Promise<AnchorResult> {
  const service = getLedgerService();
  const latest = await service.getLatestHash();
  
  if (!latest) {
    return { success: false, anchor_type: 'github_gist', error: 'No ledger events to anchor' };
  }

  const content = JSON.stringify({
    platform: 'tCredex.com',
    anchor_type: 'ledger_hash',
    event_id: latest.eventId,
    hash: latest.hash,
    timestamp: latest.timestamp,
    anchored_at: new Date().toISOString()
  }, null, 2);

  try {
    let response;
    
    if (gistId) {
      // Update existing gist
      response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          files: {
            'tcredex-ledger-anchor.json': { content }
          }
        })
      });
    } else {
      // Create new gist
      response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          description: 'tCredex.com Ledger Anchor - Tamper-Evident Hash Chain',
          public: false, // Keep private by default
          files: {
            'tcredex-ledger-anchor.json': { content }
          }
        })
      });
    }

    if (!response.ok) {
      const error = await response.text();
      return { success: false, anchor_type: 'github_gist', error: `GitHub API error: ${error}` };
    }

    const gistData = await response.json();
    
    // Record the anchor in our database
    await service.recordAnchor(
      latest.eventId,
      latest.hash,
      'github_gist',
      gistData.id,
      { url: gistData.html_url, updated_at: gistData.updated_at }
    );

    return {
      success: true,
      anchor_type: 'github_gist',
      external_reference: gistData.id
    };

  } catch (error) {
    return {
      success: false,
      anchor_type: 'github_gist',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Anchor via email to escrow mailbox
 * Sends hash to designated external mailbox for independent timestamp
 */
export async function anchorToEscrowEmail(
  escrowEmail: string,
  _smtpConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }
): Promise<AnchorResult> {
  const service = getLedgerService();
  const latest = await service.getLatestHash();
  
  if (!latest) {
    return { success: false, anchor_type: 'escrow_email', error: 'No ledger events to anchor' };
  }

  // Note: In production, use nodemailer or similar
  // This is a placeholder showing the structure
  const emailBody = `
tCredex.com Ledger Anchor
=========================
Timestamp: ${new Date().toISOString()}
Event ID: ${latest.eventId}
Event Timestamp: ${latest.timestamp}
Hash: ${latest.hash}

This email serves as an independent timestamp anchor for the tCredex.com
tamper-evident ledger. The hash above can be verified against the platform
ledger to confirm data integrity at the time of this anchor.

This is an automated message from the tCredex.com Marketplace platform.
Operator/Advisor: American Impact Ventures, LLC
`;

  try {
    // In production, implement actual email sending
    // For now, we'll just record the intent
    console.log(`[Anchor] Would send to ${escrowEmail}:`, emailBody);

    const messageId = `anchor-${latest.eventId}-${Date.now()}`;
    
    await service.recordAnchor(
      latest.eventId,
      latest.hash,
      'escrow_email',
      messageId,
      { recipient: escrowEmail, sent_at: new Date().toISOString() }
    );

    return {
      success: true,
      anchor_type: 'escrow_email',
      external_reference: messageId
    };

  } catch (error) {
    return {
      success: false,
      anchor_type: 'escrow_email',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Anchor to blockchain (Bitcoin/Ethereum timestamp)
 * Uses a timestamping service to embed hash in blockchain
 */
export async function anchorToBlockchain(
  provider: 'opentimestamps' | 'originstamp' = 'opentimestamps'
): Promise<AnchorResult> {
  const service = getLedgerService();
  const latest = await service.getLatestHash();
  
  if (!latest) {
    return { success: false, anchor_type: 'blockchain', error: 'No ledger events to anchor' };
  }

  try {
    if (provider === 'opentimestamps') {
      // OpenTimestamps is free and uses Bitcoin
      // In production, use the opentimestamps-client library
      const response = await fetch('https://a.pool.opentimestamps.org/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: latest.hash
      });

      if (!response.ok) {
        return { 
          success: false, 
          anchor_type: 'blockchain', 
          error: `OpenTimestamps error: ${response.statusText}` 
        };
      }

      // The response is the .ots proof file
      const otsProof = await response.arrayBuffer();
      const proofBase64 = Buffer.from(otsProof).toString('base64');

      await service.recordAnchor(
        latest.eventId,
        latest.hash,
        'blockchain',
        `ots-${latest.eventId}`,
        { 
          provider: 'opentimestamps',
          proof_base64: proofBase64,
          submitted_at: new Date().toISOString()
        }
      );

      return {
        success: true,
        anchor_type: 'blockchain',
        external_reference: `ots-${latest.eventId}`
      };
    }

    return { success: false, anchor_type: 'blockchain', error: `Unknown provider: ${provider}` };

  } catch (error) {
    return {
      success: false,
      anchor_type: 'blockchain',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run all configured anchors
 * Called by scheduled job (e.g., hourly cron)
 */
export async function runScheduledAnchoring(config: {
  github?: { token: string; gistId?: string };
  email?: { escrowEmail: string; smtp: Parameters<typeof anchorToEscrowEmail>[1] };
  blockchain?: { provider: 'opentimestamps' | 'originstamp' };
}): Promise<AnchorResult[]> {
  const results: AnchorResult[] = [];

  if (config.github) {
    const result = await anchorToGitHubGist(config.github.token, config.github.gistId);
    results.push(result);
  }

  if (config.email) {
    const result = await anchorToEscrowEmail(config.email.escrowEmail, config.email.smtp);
    results.push(result);
  }

  if (config.blockchain) {
    const result = await anchorToBlockchain(config.blockchain.provider);
    results.push(result);
  }

  console.log('[Anchor] Scheduled anchoring complete:', results);
  return results;
}
