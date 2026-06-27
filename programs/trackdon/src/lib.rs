// trackdon Solana program — draft v0.
//
// Diseño guía:
//   - El programa custodia USDC (SPL token) recibido como donaciones.
//   - Una campaña por emergencia, con su propio vault.
//   - Solo el `validator` autorizado registra damnificados (en fase 2 esto
//     se puede automatizar con Civic Pass — el wallet del damnificado debe
//     tener un pass válido antes de poder ser registrado).
//   - Cuando se cierra el intake, el monto por damnificado queda fijado:
//     `amount_per_beneficiary = total_recibido / beneficiaries_count`.
//   - Distribución por **pull**: cada damnificado llama `claim` desde su
//     propia wallet. El validator/authority NO puede retirar fondos.
//
// No-fee, no-monetization: el programa no tiene ninguna instrucción de
// `withdraw` para el authority. La única salida del vault es vía `claim`
// de un beneficiario registrado. Esto es intencional.
//
// Status: draft sin auditar, sin tests, sin deploy. Requiere revisión
// completa antes de cualquier paso a devnet/mainnet.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Trackdn1111111111111111111111111111111111111");

#[program]
pub mod trackdon {
    use super::*;

    /// Initialize a new emergency campaign.
    /// Authority is typically a multisig of validators / NGOs.
    pub fn init_campaign(
        ctx: Context<InitCampaign>,
        name: String,
        kyc_credential_required: bool,
    ) -> Result<()> {
        require!(name.len() <= 64, ErrorCode::NameTooLong);

        let campaign = &mut ctx.accounts.campaign;
        campaign.authority = ctx.accounts.authority.key();
        campaign.mint = ctx.accounts.mint.key();
        campaign.name = name;
        campaign.total_received = 0;
        campaign.beneficiaries_count = 0;
        campaign.amount_per_beneficiary = 0;
        campaign.intake_closed = false;
        campaign.kyc_credential_required = kyc_credential_required;
        campaign.bump = ctx.bumps.campaign;
        Ok(())
    }

    /// Anyone can donate USDC into a campaign vault.
    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::ZeroAmount);
        require!(!ctx.accounts.campaign.intake_closed, ErrorCode::IntakeClosed);

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.donor_token_account.to_account_info(),
                to: ctx.accounts.campaign_vault.to_account_info(),
                authority: ctx.accounts.donor.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;

        let campaign = &mut ctx.accounts.campaign;
        campaign.total_received = campaign
            .total_received
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        emit!(DonationReceived {
            campaign: campaign.key(),
            donor: ctx.accounts.donor.key(),
            amount,
            total_received: campaign.total_received,
        });
        Ok(())
    }

    /// Validator authority registers a beneficiary (pseudonymous on-chain).
    /// `kyc_credential_hash` references off-chain credential issued by KYC
    /// provider (Civic Pass / Truora / Persona).
    pub fn register_beneficiary(
        ctx: Context<RegisterBeneficiary>,
        kyc_credential_hash: [u8; 32],
    ) -> Result<()> {
        require!(!ctx.accounts.campaign.intake_closed, ErrorCode::IntakeClosed);
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.campaign.authority,
            ErrorCode::Unauthorized
        );

        let registration = &mut ctx.accounts.registration;
        registration.campaign = ctx.accounts.campaign.key();
        registration.beneficiary = ctx.accounts.beneficiary.key();
        registration.kyc_credential_hash = kyc_credential_hash;
        registration.claimed = false;
        registration.bump = ctx.bumps.registration;

        let campaign = &mut ctx.accounts.campaign;
        campaign.beneficiaries_count = campaign
            .beneficiaries_count
            .checked_add(1)
            .ok_or(ErrorCode::Overflow)?;

        emit!(BeneficiaryRegistered {
            campaign: campaign.key(),
            beneficiary: ctx.accounts.beneficiary.key(),
            kyc_credential_hash,
            total_beneficiaries: campaign.beneficiaries_count,
        });
        Ok(())
    }

    /// Close intake — no more donations or beneficiary registrations.
    /// Locks in `amount_per_beneficiary`.
    pub fn close_intake(ctx: Context<CloseIntake>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.campaign.authority,
            ErrorCode::Unauthorized
        );

        let campaign = &mut ctx.accounts.campaign;
        require!(!campaign.intake_closed, ErrorCode::AlreadyClosed);
        require!(campaign.beneficiaries_count > 0, ErrorCode::NoBeneficiaries);
        require!(campaign.total_received > 0, ErrorCode::NoFunds);

        campaign.amount_per_beneficiary =
            campaign.total_received / campaign.beneficiaries_count;
        campaign.intake_closed = true;

        emit!(IntakeClosed {
            campaign: campaign.key(),
            beneficiaries_count: campaign.beneficiaries_count,
            amount_per_beneficiary: campaign.amount_per_beneficiary,
        });
        Ok(())
    }

    /// Beneficiary claims their share (pull model).
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let campaign = &ctx.accounts.campaign;
        require!(campaign.intake_closed, ErrorCode::IntakeNotClosed);
        require!(!ctx.accounts.registration.claimed, ErrorCode::AlreadyClaimed);

        let amount = campaign.amount_per_beneficiary;
        let seeds = &[
            b"campaign".as_ref(),
            campaign.authority.as_ref(),
            campaign.name.as_bytes(),
            &[campaign.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.campaign_vault.to_account_info(),
                to: ctx.accounts.beneficiary_token_account.to_account_info(),
                authority: ctx.accounts.campaign.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_ctx, amount)?;

        ctx.accounts.registration.claimed = true;

        emit!(Claimed {
            campaign: campaign.key(),
            beneficiary: ctx.accounts.beneficiary.key(),
            amount,
        });
        Ok(())
    }
}

// ------------------------------------------------------------------ State

#[account]
pub struct Campaign {
    pub authority: Pubkey,           // multisig / DAO of validators
    pub mint: Pubkey,                // USDC mint (or whichever stable)
    pub name: String,                // human-readable id
    pub total_received: u64,
    pub beneficiaries_count: u64,
    pub amount_per_beneficiary: u64, // 0 until close_intake
    pub intake_closed: bool,
    pub kyc_credential_required: bool,
    pub bump: u8,
}

#[account]
pub struct BeneficiaryRegistration {
    pub campaign: Pubkey,
    pub beneficiary: Pubkey,
    pub kyc_credential_hash: [u8; 32],
    pub claimed: bool,
    pub bump: u8,
}

// ----------------------------------------------------------- Instructions

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitCampaign<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 4 + 64 + 8 + 8 + 8 + 1 + 1 + 1,
        seeds = [b"campaign", authority.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,

    /// CHECK: any USDC-compatible mint; validated client-side.
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,

    #[account(mut, token::mint = campaign.mint)]
    pub campaign_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub donor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub donor: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RegisterBeneficiary<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 1 + 1,
        seeds = [b"beneficiary", campaign.key().as_ref(), beneficiary.key().as_ref()],
        bump
    )]
    pub registration: Account<'info, BeneficiaryRegistration>,

    /// CHECK: any pubkey; the registration is keyed by this.
    pub beneficiary: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseIntake<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
        seeds = [b"beneficiary", campaign.key().as_ref(), beneficiary.key().as_ref()],
        bump = registration.bump,
        constraint = registration.beneficiary == beneficiary.key() @ ErrorCode::Unauthorized,
    )]
    pub registration: Account<'info, BeneficiaryRegistration>,

    #[account(mut, token::mint = campaign.mint)]
    pub campaign_vault: Account<'info, TokenAccount>,

    #[account(mut, token::mint = campaign.mint)]
    pub beneficiary_token_account: Account<'info, TokenAccount>,

    pub beneficiary: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// ---------------------------------------------------------------- Events

#[event]
pub struct DonationReceived {
    pub campaign: Pubkey,
    pub donor: Pubkey,
    pub amount: u64,
    pub total_received: u64,
}

#[event]
pub struct BeneficiaryRegistered {
    pub campaign: Pubkey,
    pub beneficiary: Pubkey,
    pub kyc_credential_hash: [u8; 32],
    pub total_beneficiaries: u64,
}

#[event]
pub struct IntakeClosed {
    pub campaign: Pubkey,
    pub beneficiaries_count: u64,
    pub amount_per_beneficiary: u64,
}

#[event]
pub struct Claimed {
    pub campaign: Pubkey,
    pub beneficiary: Pubkey,
    pub amount: u64,
}

// ---------------------------------------------------------------- Errors

#[error_code]
pub enum ErrorCode {
    #[msg("Campaign name too long (max 64 bytes)")]
    NameTooLong,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Intake is already closed")]
    IntakeClosed,
    #[msg("Intake is not closed yet")]
    IntakeNotClosed,
    #[msg("Intake was already closed")]
    AlreadyClosed,
    #[msg("Cannot close intake without beneficiaries")]
    NoBeneficiaries,
    #[msg("Cannot close intake without funds")]
    NoFunds,
    #[msg("Caller not authorized")]
    Unauthorized,
    #[msg("Beneficiary already claimed")]
    AlreadyClaimed,
}
