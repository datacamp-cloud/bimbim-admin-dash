-- Add an explicit rejected state for courier account verification.
ALTER TYPE "StatutCompteLivreur" ADD VALUE IF NOT EXISTS 'rejete';
