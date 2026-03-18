-- Триггеры SECURITY DEFINER обнуляли user_id при вставке из клиента.
-- Убираем их: user_id передаётся явно из приложения (совпадает с auth.uid(), RLS ок).

drop trigger if exists assets_set_user_id on public.assets;
drop trigger if exists transactions_set_user_id on public.transactions;
drop trigger if exists goals_set_user_id on public.goals;
drop trigger if exists user_settings_set_user_id on public.user_settings;
