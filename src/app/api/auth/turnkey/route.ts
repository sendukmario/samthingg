/**
 * API route: /api/auth/turnkey
 * Handles user authentication and wallet creation/retrieval for Turnkey
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, validateTurnkeyConfig } from '@/utils/turnkey/serverAuth';

export async function POST(request: NextRequest) {
  try {
    // Validate Turnkey configuration
    validateTurnkeyConfig();

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Authenticate user and get/create wallet
    const walletInfo = await authenticateUser(userId);

    return NextResponse.json(walletInfo);

  } catch (error) {
    console.error('Turnkey authentication error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Authentication failed',
        success: false 
      },
      { status: 500 }
    );
  }
}
