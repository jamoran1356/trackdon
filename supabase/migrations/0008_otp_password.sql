-- trackdon · migration 0008
-- Agrega password_enc a otp_codes para guardar la contraseña encriptada
-- AES-256-GCM hasta que se consume el OTP.

alter table public.otp_codes
  add column if not exists password_enc text;
