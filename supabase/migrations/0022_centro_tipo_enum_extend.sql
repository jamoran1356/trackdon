-- Migration 0022: extender enum centro_tipo con valores nuevos del wizard
-- El form /registro-centro ofrece centro_acopio, fundacion, iglesia, otro.
-- El enum original solo tenía 'fisico' y 'comprador_medicamentos'.

alter type public.centro_tipo add value if not exists 'centro_acopio';
alter type public.centro_tipo add value if not exists 'fundacion';
alter type public.centro_tipo add value if not exists 'iglesia';
alter type public.centro_tipo add value if not exists 'otro';
